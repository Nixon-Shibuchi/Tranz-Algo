from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.session import Base, engine
import app.models  # noqa: F401 — register models


def _friendly_validation_message(err: dict) -> str:
    loc = err.get("loc", ())
    field = str(loc[-1]) if loc else "field"
    msg = str(err.get("msg", "Invalid value"))
    lower = msg.lower()

    if field == "email" or "email address" in lower:
        return "Please enter a valid email address (example: name@gmail.com)."
    if "required" in lower:
        return f"{field.replace('_', ' ').capitalize()} is required."
    if field == "password" and ("min" in lower or "at least" in lower):
        return "Password must be at least 6 characters."
    clean = msg
    for prefix in ("Value error, ", "value is not a valid ", "Value is not a valid "):
        if clean.lower().startswith(prefix.lower()):
            clean = clean[len(prefix) :]
            break
    return f"{field.replace('_', ' ').capitalize()}: {clean}"


def create_app() -> FastAPI:
    app = FastAPI(
        title="Tranz-Algo API",
        description="Landed-cost inventory orchestration with dual cost-entry modes",
        version="0.1.0",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_, exc: RequestValidationError):
        messages = []
        for err in exc.errors():
            text = _friendly_validation_message(err)
            if text not in messages:
                messages.append(text)
        return JSONResponse(
            status_code=422,
            content={"detail": messages[0] if len(messages) == 1 else messages},
        )

    app.include_router(api_router, prefix="/api/v1")
    return app


app = create_app()


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_sqlite_columns()


def _ensure_sqlite_columns() -> None:
    """Add new columns on existing SQLite DBs (create_all won't alter tables)."""
    if not settings.is_sqlite:
        return
    statements = [
        ("products", "category", "VARCHAR(120)"),
        ("products", "brand", "VARCHAR(120)"),
        ("products", "unit", "VARCHAR(32) DEFAULT 'pcs'"),
        ("products", "barcode", "VARCHAR(64)"),
        ("products", "origin_country", "VARCHAR(80)"),
        ("products", "reorder_level", "NUMERIC(12,3)"),
        ("shipment_batches", "invoice_number", "VARCHAR(120)"),
        ("shipment_batches", "clearing_agent", "VARCHAR(255)"),
        ("shipment_batches", "carrier_name", "VARCHAR(255)"),
        ("shipment_batches", "origin_country", "VARCHAR(80)"),
        ("shipment_batches", "destination", "VARCHAR(80)"),
        ("shipment_batches", "expected_arrival_date", "VARCHAR(32)"),
        ("shipment_batches", "received_date", "VARCHAR(32)"),
        ("sales", "stock_after", "NUMERIC(12,3) DEFAULT 0"),
    ]
    with engine.begin() as conn:
        for table, column, coltype in statements:
            rows = conn.exec_driver_sql(f"PRAGMA table_info({table})").fetchall()
            if not rows:
                continue  # table not created yet; create_all handles new tables
            existing = {r[1] for r in rows}
            if column not in existing:
                conn.exec_driver_sql(f"ALTER TABLE {table} ADD COLUMN {column} {coltype}")
