from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from uuid import uuid4

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import BatchItem, Product, User
from app.schemas import ProductBulkCreate, ProductBulkResult, ProductCreate, ProductOut, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


def _unique_auto_sku(db: Session, product_id: int) -> str:
    """Assign a stable catalogue id like PRD-0007 from the DB primary key."""
    candidate = f"PRD-{product_id:04d}"
    clash = db.scalars(
        select(Product).where(Product.sku == candidate, Product.id != product_id)
    ).first()
    if not clash:
        return candidate
    return f"PRD-{product_id:04d}-{product_id}"


def _create_product_row(db: Session, payload: ProductCreate) -> Product:
    data = payload.model_dump()
    sku = (data.get("sku") or "").strip() or None
    data["sku"] = sku or f"TMP-{uuid4().hex[:12].upper()}"
    if sku and db.scalars(select(Product).where(Product.sku == sku)).first():
        raise ValueError(f"SKU already exists: {sku}")
    product = Product(**data)
    db.add(product)
    db.flush()
    if not sku:
        product.sku = _unique_auto_sku(db, product.id)
    return product


@router.get("", response_model=list[ProductOut])
def list_products(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return list(db.scalars(select(Product).order_by(Product.sku)).all())


@router.post("/bulk", response_model=ProductBulkResult)
def create_products_bulk(
    payload: ProductBulkCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Create many products with minimal DB round trips (CSV import over remote Postgres)."""
    # One query: existing SKUs that appear in this file (plus we track in-file dupes)
    file_skus = [(item.sku or "").strip() for item in payload.items]
    named = [s for s in file_skus if s]
    existing: set[str] = set()
    if named:
        existing = {
            str(s).upper()
            for s in db.scalars(select(Product.sku).where(Product.sku.in_(named))).all()
        }

    created: list[Product] = []
    needs_auto_sku: list[Product] = []
    errors: list[str] = []
    seen_in_file: set[str] = set()

    for i, item in enumerate(payload.items, start=1):
        data = item.model_dump()
        sku = (data.get("sku") or "").strip() or None
        if sku:
            key = sku.upper()
            if key in seen_in_file:
                errors.append(f"Row {i}: duplicate SKU in file ({sku})")
                continue
            if key in existing:
                errors.append(f"Row {i}: SKU already exists: {sku}")
                continue
            seen_in_file.add(key)
            existing.add(key)
            data["sku"] = sku
            product = Product(**data)
            db.add(product)
            created.append(product)
        else:
            # Temporary unique SKU until we know the DB id (one flush for the whole batch)
            data["sku"] = f"TMP-{uuid4().hex[:12].upper()}"
            product = Product(**data)
            db.add(product)
            created.append(product)
            needs_auto_sku.append(product)

    if not created:
        return ProductBulkResult(created=[], errors=errors)

    # Single flush → assign auto SKUs in memory → one commit (no per-row SELECT/refresh)
    db.flush()
    for product in needs_auto_sku:
        candidate = f"PRD-{product.id:04d}"
        if candidate.upper() in existing:
            candidate = f"PRD-{product.id:04d}-{product.id}"
        product.sku = candidate
        existing.add(candidate.upper())

    # Snapshot before commit so expire_on_commit does not trigger N refreshes
    outs = [ProductOut.model_validate(p) for p in created]
    db.commit()
    return ProductBulkResult(created=outs, errors=errors)


@router.post("", response_model=ProductOut)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        product = _create_product_row(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    db.commit()
    db.refresh(product)
    return product


@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    data = payload.model_dump(exclude_unset=True)
    if "sku" in data:
        clash = db.scalars(
            select(Product).where(Product.sku == data["sku"], Product.id != product_id)
        ).first()
        if clash:
            raise HTTPException(status_code=400, detail="SKU already exists")
    for key, value in data.items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    in_use = db.scalars(
        select(BatchItem).where(BatchItem.product_id == product_id).limit(1)
    ).first()
    if in_use:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete this product because it is used in a shipment. Remove it from shipments first.",
        )
    db.delete(product)
    db.commit()
    return {"ok": True}
