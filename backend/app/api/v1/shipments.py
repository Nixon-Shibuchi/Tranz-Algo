from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import BatchItem, LedgerEntry, Product, ShipmentBatch, User
from app.schemas import (
    AllocateRequest,
    BatchItemBulkCreate,
    BatchItemBulkResult,
    BatchItemCreate,
    BatchItemOut,
    BatchItemUpdate,
    CommitRequest,
    CostsUpdate,
    LedgerOut,
    ShipmentCreate,
    ShipmentImportRequest,
    ShipmentImportResult,
    ShipmentOut,
    ShipmentUpdate,
    SuggestRequest,
)
from app.services import shipment_workflow as workflow
from app.services.shipment_workflow import WorkflowError

router = APIRouter(prefix="/shipments", tags=["shipments"])


def _http(exc: WorkflowError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.detail)


def _get_batch(db: Session, batch_id: int) -> ShipmentBatch:
    try:
        return workflow.get_batch(db, batch_id)
    except WorkflowError as exc:
        raise _http(exc) from exc


def _ensure_draftish(batch: ShipmentBatch) -> None:
    try:
        workflow.ensure_editable(batch)
    except WorkflowError as exc:
        raise _http(exc) from exc


@router.get("", response_model=list[ShipmentOut])
def list_shipments(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = db.scalars(
        select(ShipmentBatch).options(joinedload(ShipmentBatch.items)).order_by(ShipmentBatch.id.desc())
    ).unique().all()
    return list(rows)


@router.post("", response_model=ShipmentOut)
def create_shipment(
    payload: ShipmentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if db.scalars(select(ShipmentBatch).where(ShipmentBatch.reference == payload.reference)).first():
        raise HTTPException(status_code=400, detail="Reference already exists")
    data = payload.model_dump()
    data["currency_local"] = "ZMW"
    batch = ShipmentBatch(**data, created_by=user.id, status="draft")
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return _get_batch(db, batch.id)


def _add_item_row(db: Session, batch: ShipmentBatch, payload: BatchItemCreate) -> BatchItem:
    product = db.get(Product, payload.product_id)
    if not product:
        raise ValueError(f"Product not found: id={payload.product_id}")
    weight = payload.weight_kg
    if weight is None and product.default_weight_kg is not None:
        weight = float(product.default_weight_kg) * float(payload.quantity)
    item = BatchItem(
        batch_id=batch.id,
        product_id=payload.product_id,
        quantity=payload.quantity,
        weight_kg=weight,
        foreign_unit_price=payload.foreign_unit_price,
        local_unit_product_cost=payload.local_unit_product_cost,
        line_cost_mode=payload.line_cost_mode,
    )
    db.add(item)
    return item


@router.post("/import", response_model=ShipmentImportResult)
def import_shipment(
    payload: ShipmentImportRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create shipment + costs + all lines in one request (full CSV import)."""
    header = payload.shipment
    if db.scalars(select(ShipmentBatch).where(ShipmentBatch.reference == header.reference)).first():
        raise HTTPException(status_code=400, detail="Reference already exists")
    data = header.model_dump()
    data["currency_local"] = "ZMW"
    batch = ShipmentBatch(**data, created_by=user.id, status="draft")
    db.add(batch)
    db.flush()

    if payload.costs is not None:
        cost_data = payload.costs.model_dump(exclude_unset=True)
        for key, value in cost_data.items():
            setattr(batch, key, value)
        if payload.costs.exchange_rate is not None and payload.costs.exchange_rate_source is None:
            batch.exchange_rate_source = "manual"
            batch.exchange_rate_at = datetime.now(timezone.utc)

    errors: list[str] = []
    created = 0
    for i, item_payload in enumerate(payload.items, start=1):
        try:
            _add_item_row(db, batch, item_payload)
            created += 1
        except ValueError as exc:
            errors.append(f"Line {i}: {exc}")

    db.commit()
    return ShipmentImportResult(
        shipment=_get_batch(db, batch.id),
        items_created=created,
        errors=errors,
    )


@router.get("/{batch_id}", response_model=ShipmentOut)
def get_shipment(
    batch_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return _get_batch(db, batch_id)


@router.put("/{batch_id}", response_model=ShipmentOut)
def update_shipment(
    batch_id: int,
    payload: ShipmentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    batch = _get_batch(db, batch_id)
    _ensure_draftish(batch)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(batch, key, value)
    db.commit()
    return _get_batch(db, batch_id)


@router.delete("/{batch_id}")
def delete_shipment(
    batch_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    batch = _get_batch(db, batch_id)
    if batch.status == "committed":
        raise HTTPException(status_code=409, detail="Cannot delete committed batch")
    db.delete(batch)
    db.commit()
    return {"ok": True}


@router.post("/{batch_id}/items", response_model=BatchItemOut)
def add_item(
    batch_id: int,
    payload: BatchItemCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    batch = _get_batch(db, batch_id)
    _ensure_draftish(batch)
    try:
        item = _add_item_row(db, batch, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    batch.status = "draft"
    db.commit()
    db.refresh(item)
    return item


@router.post("/{batch_id}/items/bulk", response_model=BatchItemBulkResult)
def add_items_bulk(
    batch_id: int,
    payload: BatchItemBulkCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Add many lines in one DB round trip (lines CSV import)."""
    batch = _get_batch(db, batch_id)
    _ensure_draftish(batch)
    created: list[BatchItem] = []
    errors: list[str] = []
    for i, item_payload in enumerate(payload.items, start=1):
        try:
            created.append(_add_item_row(db, batch, item_payload))
        except ValueError as exc:
            errors.append(f"Line {i}: {exc}")
    batch.status = "draft"
    db.commit()
    for item in created:
        db.refresh(item)
    return BatchItemBulkResult(created=created, errors=errors)


@router.put("/{batch_id}/items/{item_id}", response_model=BatchItemOut)
def update_item(
    batch_id: int,
    item_id: int,
    payload: BatchItemUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    batch = _get_batch(db, batch_id)
    _ensure_draftish(batch)
    item = db.get(BatchItem, item_id)
    if not item or item.batch_id != batch_id:
        raise HTTPException(status_code=404, detail="Item not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{batch_id}/items/{item_id}")
def delete_item(
    batch_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    batch = _get_batch(db, batch_id)
    _ensure_draftish(batch)
    item = db.get(BatchItem, item_id)
    if not item or item.batch_id != batch_id:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"ok": True}


@router.put("/{batch_id}/costs", response_model=ShipmentOut)
def update_costs(
    batch_id: int,
    payload: CostsUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    batch = _get_batch(db, batch_id)
    _ensure_draftish(batch)
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(batch, key, value)
    if payload.exchange_rate is not None and payload.exchange_rate_source is None:
        batch.exchange_rate_source = "manual"
        batch.exchange_rate_at = datetime.now(timezone.utc)
    db.commit()
    return _get_batch(db, batch_id)


@router.post("/{batch_id}/allocate")
def allocate(
    batch_id: int,
    payload: AllocateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        result = workflow.allocate_batch(
            db, batch_id, method=payload.method, compare=payload.compare
        )
    except WorkflowError as exc:
        raise _http(exc) from exc
    return {
        "selected_method": result["selected_method"],
        "comparison": result["comparison"],
        "shipment": ShipmentOut.model_validate(result["batch"]),
    }


@router.post("/{batch_id}/suggest-prices", response_model=ShipmentOut)
def suggest(
    batch_id: int,
    payload: SuggestRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        return workflow.suggest_batch_prices(
            db,
            batch_id,
            profit_margin=payload.profit_margin,
            safety_margin=payload.safety_margin,
        )
    except WorkflowError as exc:
        raise _http(exc) from exc


@router.post("/{batch_id}/commit", response_model=ShipmentOut)
def commit_batch(
    batch_id: int,
    payload: CommitRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return workflow.commit_batch(
            db,
            batch_id,
            user_id=user.id,
            accept_suggestions=payload.accept_suggestions,
            item_price_overrides=payload.item_price_overrides,
        )
    except WorkflowError as exc:
        raise _http(exc) from exc


@router.get("/{batch_id}/ledger", response_model=list[LedgerOut])
def ledger(
    batch_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    _get_batch(db, batch_id)
    rows = db.scalars(
        select(LedgerEntry)
        .where(LedgerEntry.batch_id == batch_id)
        .order_by(LedgerEntry.created_at, LedgerEntry.id)
    ).all()
    return list(rows)


@router.post("/{batch_id}/margin-guard/recheck")
def margin_guard_recheck(
    batch_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return workflow.recheck_margin_guard(db, batch_id, user_id=user.id)
    except WorkflowError as exc:
        raise _http(exc) from exc
