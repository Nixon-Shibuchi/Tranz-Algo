from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas import FxRateOut, ManualFxRate
from app.services import fx as fx_service

router = APIRouter(prefix="/fx", tags=["fx"])


@router.get("/rates", response_model=FxRateOut)
def get_rate(
    base: str = Query(..., min_length=3, max_length=3),
    quote: str = Query("ZMW", min_length=3, max_length=3),
    prefer_cache: bool = False,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        rate, source, fetched_at = fx_service.get_rate(
            db, base, quote, prefer_cache=prefer_cache
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return FxRateOut(
        base_currency=base.upper(),
        quote_currency=quote.upper(),
        rate=rate,
        source=source,
        fetched_at=fetched_at,
    )


@router.post("/rates/manual", response_model=FxRateOut)
def manual_rate(
    payload: ManualFxRate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    row = fx_service.set_manual_rate(
        db, payload.base_currency, payload.quote_currency, payload.rate
    )
    return FxRateOut(
        base_currency=row.base_currency,
        quote_currency=row.quote_currency,
        rate=float(row.rate),
        source=row.source,
        fetched_at=row.fetched_at,
    )
