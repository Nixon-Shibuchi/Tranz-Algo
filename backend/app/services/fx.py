from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models import FxRateCache
from app.services.strategies.fx_providers import build_fx_provider_chain


def fetch_remote_rate(base: str, quote: str) -> tuple[float, str]:
    """Delegate to the FX provider chain (Chain of Responsibility)."""
    base = base.upper()
    quote = quote.upper()
    try:
        return build_fx_provider_chain().fetch(base, quote)
    except Exception as exc:
        raise RuntimeError(f"Unable to fetch FX rate {base}->{quote}: {exc}") from exc


def get_rate(
    db: Session,
    base: str,
    quote: str = "ZMW",
    *,
    prefer_cache: bool = False,
) -> tuple[float, str, datetime]:
    base = base.upper()
    quote = quote.upper()

    if prefer_cache:
        cached = _latest_good(db, base, quote)
        if cached:
            return float(cached.rate), "cache", cached.fetched_at

    try:
        rate, source = fetch_remote_rate(base, quote)
        now = datetime.now(timezone.utc)
        _store_rate(db, base, quote, rate, source, now)
        return rate, "api", now
    except Exception:
        cached = _latest_good(db, base, quote)
        if cached:
            return float(cached.rate), "cache", cached.fetched_at
        raise


def set_manual_rate(db: Session, base: str, quote: str, rate: float) -> FxRateCache:
    now = datetime.now(timezone.utc)
    return _store_rate(db, base.upper(), quote.upper(), rate, "manual", now)


def _latest_good(db: Session, base: str, quote: str) -> FxRateCache | None:
    stmt = (
        select(FxRateCache)
        .where(
            FxRateCache.base_currency == base,
            FxRateCache.quote_currency == quote,
            FxRateCache.is_last_known_good.is_(True),
        )
        .order_by(FxRateCache.fetched_at.desc())
        .limit(1)
    )
    return db.scalars(stmt).first()


def _store_rate(
    db: Session,
    base: str,
    quote: str,
    rate: float,
    source: str,
    fetched_at: datetime,
) -> FxRateCache:
    db.execute(
        update(FxRateCache)
        .where(
            FxRateCache.base_currency == base,
            FxRateCache.quote_currency == quote,
        )
        .values(is_last_known_good=False)
    )
    row = FxRateCache(
        base_currency=base,
        quote_currency=quote,
        rate=rate,
        source=source,
        fetched_at=fetched_at,
        is_last_known_good=True,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
