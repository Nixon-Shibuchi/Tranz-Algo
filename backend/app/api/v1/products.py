from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from uuid import uuid4

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import BatchItem, Product, TaxProfile, User
from app.schemas import ProductCreate, ProductOut, ProductUpdate

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


@router.get("", response_model=list[ProductOut])
def list_products(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return list(db.scalars(select(Product).order_by(Product.sku)).all())


@router.post("", response_model=ProductOut)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    data = payload.model_dump()
    sku = (data.get("sku") or "").strip() or None
    # Temporary unique value so NOT NULL + UNIQUE hold until we know the DB id
    data["sku"] = sku or f"TMP-{uuid4().hex[:12].upper()}"
    if sku and db.scalars(select(Product).where(Product.sku == sku)).first():
        raise HTTPException(status_code=400, detail="SKU already exists")
    if data.get("tax_profile_id") and not db.get(TaxProfile, data["tax_profile_id"]):
        raise HTTPException(status_code=404, detail="Tax profile not found")
    product = Product(**data)
    db.add(product)
    db.flush()
    if not sku:
        product.sku = _unique_auto_sku(db, product.id)
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
    if data.get("tax_profile_id") and not db.get(TaxProfile, data["tax_profile_id"]):
        raise HTTPException(status_code=404, detail="Tax profile not found")
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
