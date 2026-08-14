from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import BatchItem, LedgerEntry, Product, ShipmentBatch, TaxProfile, User
from app.schemas import (
    AllocateRequest,
    BatchItemCreate,
    BatchItemOut,
    BatchItemUpdate,
    CommitRequest,
    CostsUpdate,
    LedgerOut,
    ShipmentCreate,
    ShipmentOut,
    ShipmentUpdate,
    SuggestRequest,
)
from app.services.costing import compute_landed_for_method, money, suggest_prices

router = APIRouter(prefix="/shipments", tags=["shipments"])


def _get_batch(db: Session, batch_id: int) -> ShipmentBatch:
    batch = db.scalars(
        select(ShipmentBatch)
        .where(ShipmentBatch.id == batch_id)
        .options(joinedload(ShipmentBatch.items))
    ).unique().first()
    if not batch:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return batch


def _ensure_draftish(batch: ShipmentBatch) -> None:
    if batch.status == "committed":
        raise HTTPException(status_code=409, detail="Committed batches are read-only")


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
    product = db.get(Product, payload.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    weight = payload.weight_kg
    if weight is None and product.default_weight_kg is not None:
        weight = float(product.default_weight_kg) * float(payload.quantity)
    item = BatchItem(
        batch_id=batch_id,
        product_id=payload.product_id,
        quantity=payload.quantity,
        weight_kg=weight,
        foreign_unit_price=payload.foreign_unit_price,
        local_unit_product_cost=payload.local_unit_product_cost,
        line_cost_mode=payload.line_cost_mode,
        tax_profile_id=payload.tax_profile_id or product.tax_profile_id,
    )
    db.add(item)
    batch.status = "draft"
    db.commit()
    db.refresh(item)
    return item


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


def _item_dicts(batch: ShipmentBatch) -> list[dict]:
    return [
        {
            "id": item.id,
            "quantity": float(item.quantity),
            "weight_kg": float(item.weight_kg) if item.weight_kg is not None else None,
            "line_cost_mode": item.line_cost_mode,
            "foreign_unit_price": float(item.foreign_unit_price)
            if item.foreign_unit_price is not None
            else None,
            "local_unit_product_cost": float(item.local_unit_product_cost)
            if item.local_unit_product_cost is not None
            else None,
        }
        for item in batch.items
    ]


def _tax_rates(db: Session, batch: ShipmentBatch) -> dict[int, tuple[float, float]]:
    rates: dict[int, tuple[float, float]] = {}
    for item in batch.items:
        profile_id = item.tax_profile_id
        if not profile_id and item.product:
            profile_id = item.product.tax_profile_id
        if profile_id:
            profile = db.get(TaxProfile, profile_id)
            if profile:
                rates[item.id] = (float(profile.duty_rate), float(profile.vat_rate))
                continue
        rates[item.id] = (0.0, 0.0)
    return rates


@router.post("/{batch_id}/allocate")
def allocate(
    batch_id: int,
    payload: AllocateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    batch = db.scalars(
        select(ShipmentBatch)
        .where(ShipmentBatch.id == batch_id)
        .options(joinedload(ShipmentBatch.items).joinedload(BatchItem.product))
    ).unique().first()
    if not batch:
        raise HTTPException(status_code=404, detail="Shipment not found")
    _ensure_draftish(batch)
    if not batch.items:
        raise HTTPException(status_code=422, detail="Batch has no items")

    items = _item_dicts(batch)
    tax_rates = _tax_rates(db, batch)
    shipping = float(batch.shipping_total or 0)
    rate = float(batch.exchange_rate) if batch.exchange_rate is not None else None
    duty_total = float(batch.duty_total) if batch.duty_total is not None else None
    vat_total = float(batch.vat_total) if batch.vat_total is not None else None

    try:
        selected = compute_landed_for_method(
            items,
            method=payload.method,
            shipping_total=shipping,
            exchange_rate=rate,
            batch_duty_total=duty_total,
            batch_vat_total=vat_total,
            tax_rates_by_item=tax_rates,
        )
        comparison = {"selected": selected}
        if payload.compare:
            other = "quantity" if payload.method == "weight" else "weight"
            try:
                comparison[other] = compute_landed_for_method(
                    items,
                    method=other,
                    shipping_total=shipping,
                    exchange_rate=rate,
                    batch_duty_total=duty_total,
                    batch_vat_total=vat_total,
                    tax_rates_by_item=tax_rates,
                )
            except ValueError:
                comparison[other] = None
            comparison[payload.method] = selected
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    by_id = {row["item_id"]: row for row in selected}
    for item in batch.items:
        row = by_id[item.id]
        item.local_unit_product_cost = row["local_unit_product_cost"]
        item.shipping_share = row["shipping_share"]
        item.duty_amount = row["duty_amount"]
        item.vat_amount = row["vat_amount"]
        item.landed_line_cost = row["landed_line_cost"]
        item.landed_unit_cost = row["landed_unit_cost"]
    batch.allocation_method = payload.method
    batch.status = "costed"
    db.commit()
    return {
        "selected_method": payload.method,
        "comparison": comparison,
        "shipment": ShipmentOut.model_validate(_get_batch(db, batch_id)),
    }


@router.post("/{batch_id}/suggest-prices", response_model=ShipmentOut)
def suggest(
    batch_id: int,
    payload: SuggestRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    batch = _get_batch(db, batch_id)
    _ensure_draftish(batch)
    if not batch.items or any(i.landed_unit_cost is None for i in batch.items):
        raise HTTPException(status_code=422, detail="Allocate costs before suggesting prices")
    suggestions = suggest_prices(
        [(i.id, float(i.landed_unit_cost)) for i in batch.items],
        payload.profit_margin,
    )
    by_id = {s["item_id"]: s["suggested_retail_price"] for s in suggestions}
    for item in batch.items:
        item.suggested_retail_price = by_id[item.id]
    batch.profit_margin = payload.profit_margin
    batch.safety_margin = payload.safety_margin
    db.commit()
    return _get_batch(db, batch_id)


@router.post("/{batch_id}/commit", response_model=ShipmentOut)
def commit_batch(
    batch_id: int,
    payload: CommitRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    batch = _get_batch(db, batch_id)
    if batch.status == "committed":
        raise HTTPException(status_code=409, detail="Already committed")
    if not batch.items or any(i.landed_unit_cost is None for i in batch.items):
        raise HTTPException(status_code=422, detail="Allocate before commit")

    overrides = {o.item_id: o.accepted_retail_price for o in payload.item_price_overrides}
    for item in batch.items:
        if item.id in overrides:
            item.accepted_retail_price = money(overrides[item.id])
        elif payload.accept_suggestions:
            if item.suggested_retail_price is None:
                raise HTTPException(status_code=422, detail="Suggest prices before commit")
            item.accepted_retail_price = item.suggested_retail_price
        product = db.get(Product, item.product_id)
        if product:
            product.stock_on_hand = float(product.stock_on_hand or 0) + float(item.quantity)
            product.active_retail_price = item.accepted_retail_price

        db.add(
            LedgerEntry(
                batch_id=batch.id,
                batch_item_id=item.id,
                event_type="landed_cost",
                payload_json={
                    "landed_unit_cost": float(item.landed_unit_cost),
                    "shipping_share": float(item.shipping_share or 0),
                    "duty_amount": float(item.duty_amount or 0),
                    "vat_amount": float(item.vat_amount or 0),
                    "allocation_method": batch.allocation_method,
                    "primary_cost_mode": batch.primary_cost_mode,
                    "exchange_rate": float(batch.exchange_rate) if batch.exchange_rate else None,
                    "exchange_rate_source": batch.exchange_rate_source,
                },
                created_by=user.id,
            )
        )
        db.add(
            LedgerEntry(
                batch_id=batch.id,
                batch_item_id=item.id,
                event_type="price_accepted",
                payload_json={
                    "accepted_retail_price": float(item.accepted_retail_price),
                    "suggested_retail_price": float(item.suggested_retail_price or 0),
                    "profit_margin": float(batch.profit_margin or 0),
                },
                created_by=user.id,
            )
        )

    if batch.paperwork_source:
        db.add(
            LedgerEntry(
                batch_id=batch.id,
                event_type="paperwork_source",
                payload_json={"paperwork_source": batch.paperwork_source},
                created_by=user.id,
            )
        )

    batch.status = "committed"
    batch.committed_at = datetime.now(timezone.utc)
    db.commit()
    return _get_batch(db, batch_id)


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
    from app.services.costing import margin_guard_alert

    batch = _get_batch(db, batch_id)
    safety = float(batch.safety_margin or 0.10)
    alerts = []
    for item in batch.items:
        product = db.get(Product, item.product_id)
        active = float(
            (product.active_retail_price if product and product.active_retail_price is not None else None)
            or item.accepted_retail_price
            or 0
        )
        landed = float(item.landed_unit_cost or 0)
        if landed and active and margin_guard_alert(active, landed, safety):
            alert = {
                "item_id": item.id,
                "product_id": item.product_id,
                "active_retail_price": active,
                "landed_unit_cost": landed,
                "floor": money(landed * (1 + safety)),
            }
            alerts.append(alert)
            db.add(
                LedgerEntry(
                    batch_id=batch.id,
                    batch_item_id=item.id,
                    event_type="margin_alert",
                    payload_json=alert,
                    created_by=user.id,
                )
            )
    db.commit()
    return {"alerts": alerts, "safety_margin": safety}
