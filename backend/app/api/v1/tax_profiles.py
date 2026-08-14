from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import TaxProfile, User
from app.schemas import TaxProfileCreate, TaxProfileOut, TaxProfileUpdate

router = APIRouter(prefix="/tax-profiles", tags=["tax-profiles"])


@router.get("", response_model=list[TaxProfileOut])
def list_profiles(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return list(db.scalars(select(TaxProfile).order_by(TaxProfile.name)).all())


@router.post("", response_model=TaxProfileOut)
def create_profile(
    payload: TaxProfileCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if db.scalars(select(TaxProfile).where(TaxProfile.name == payload.name)).first():
        raise HTTPException(status_code=400, detail="Profile name already exists")
    row = TaxProfile(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/{profile_id}", response_model=TaxProfileOut)
def get_profile(
    profile_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    row = db.get(TaxProfile, profile_id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    return row


@router.put("/{profile_id}", response_model=TaxProfileOut)
def update_profile(
    profile_id: int,
    payload: TaxProfileUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    row = db.get(TaxProfile, profile_id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{profile_id}")
def delete_profile(
    profile_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from app.models import Product

    row = db.get(TaxProfile, profile_id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    for product in db.scalars(select(Product).where(Product.tax_profile_id == profile_id)):
        product.tax_profile_id = None
    db.delete(row)
    db.commit()
    return {"ok": True}
