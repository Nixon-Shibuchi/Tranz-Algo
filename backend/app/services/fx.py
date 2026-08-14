from datetime import datetime, timezone

import httpx
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import FxRateCache


def fetch_remote_rate(base: str, quote: str) -> tuple[float, str]:
    """Try Frankfurter first; fall back to open.er-api.com (better ZMW coverage)."""
    base = base.upper()
    quote = quote.upper()
    if base == quote:
        return 1.0, "identity"

    # Frankfurter (ECB) — may not include ZMW
    try:
        url = f"{settings.fx_api_base.rstrip('/')}/latest"
        with httpx.Client(timeout=8.0) as client:
            resp = client.get(url, params={"from": base, "to": quote})
            if resp.status_code == 200:
                data = resp.json()
                if quote in data.get("rates", {}):
                    return float(data["rates"][quote]), "frankfurter"
    except Exception:
        pass

    # open.er-api.com free endpoint
    try:
        with httpx.Client(timeout=8.0) as client:
            resp = client.get(f"https://open.er-api.com/v6/latest/{base}")
            resp.raise_for_status()
            data = resp.json()
            if data.get("result") == "success" and quote in data.get("rates", {}):
                return float(data["rates"][quote]), "open_er_api"
    except Exception as exc:
        raise RuntimeError(f"Unable to fetch FX rate {base}->{quote}: {exc}") from exc

    raise RuntimeError(f"Rate {base}->{quote} not available from free FX providers")


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
