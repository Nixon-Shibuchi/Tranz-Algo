from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import BatchItem, Product, TaxProfile, User
from app.schemas import ProductCreate, ProductOut, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


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
    if db.scalars(select(Product).where(Product.sku == payload.sku)).first():
        raise HTTPException(status_code=400, detail="SKU already exists")
    if payload.tax_profile_id and not db.get(TaxProfile, payload.tax_profile_id):
        raise HTTPException(status_code=404, detail="Tax profile not found")
    product = Product(**payload.model_dump())
    db.add(product)
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
