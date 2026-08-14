from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select, text
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import (
    BatchItem,
    CostEntry,
    FxRateCache,
    LedgerEntry,
    Product,
    Sale,
    ShipmentBatch,
    TaxProfile,
    User,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/reset-business-data")
def reset_business_data(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Clear products, shipments, tax profiles, sales, ledger, and FX cache. Keeps user accounts."""
    db.execute(delete(LedgerEntry))
    db.execute(delete(CostEntry))
    db.execute(delete(BatchItem))
    db.execute(delete(ShipmentBatch))
    db.execute(delete(Sale))
    db.execute(delete(Product))
    db.execute(delete(TaxProfile))
    db.execute(delete(FxRateCache))
    db.commit()
    return {
        "ok": True,
        "message": "Business data cleared. User accounts kept. You can add products fresh.",
    }
