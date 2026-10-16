from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255), default="")
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50), default="admin")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    batches: Mapped[list["ShipmentBatch"]] = relationship(back_populates="creator")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sku: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(120), nullable=True)
    brand: Mapped[str | None] = mapped_column(String(120), nullable=True)
    unit: Mapped[str] = mapped_column(String(32), default="pcs")
    barcode: Mapped[str | None] = mapped_column(String(64), nullable=True)
    origin_country: Mapped[str | None] = mapped_column(String(80), nullable=True)
    default_weight_kg: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)
    reorder_level: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)
    stock_on_hand: Mapped[float] = mapped_column(Numeric(12, 3), default=0)
    active_retail_price: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    batch_items: Mapped[list["BatchItem"]] = relationship(back_populates="product")
    sales: Mapped[list["Sale"]] = relationship(back_populates="product")


class Sale(Base):
    """Simple stock-out when goods are sold (not a full POS)."""

    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    quantity: Mapped[float] = mapped_column(Numeric(12, 3))
    unit_price: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    stock_after: Mapped[float] = mapped_column(Numeric(12, 3), default=0)
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    product: Mapped[Product] = relationship(back_populates="sales")


class ShipmentBatch(Base):
    __tablename__ = "shipment_batches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    reference: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    supplier_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    invoice_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    clearing_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    carrier_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    origin_country: Mapped[str | None] = mapped_column(String(80), nullable=True)
    destination: Mapped[str | None] = mapped_column(String(80), nullable=True, default="Zambia")
    expected_arrival_date: Mapped[str | None] = mapped_column(String(32), nullable=True)
    received_date: Mapped[str | None] = mapped_column(String(32), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="draft")
    primary_cost_mode: Mapped[str] = mapped_column(String(32), default="already_local")
    currency_foreign: Mapped[str | None] = mapped_column(String(8), nullable=True)
    currency_local: Mapped[str] = mapped_column(String(8), default="ZMW")
    exchange_rate: Mapped[float | None] = mapped_column(Numeric(18, 8), nullable=True)
    exchange_rate_source: Mapped[str | None] = mapped_column(String(32), nullable=True)
    exchange_rate_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    shipping_total: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    shipping_currency_mode: Mapped[str] = mapped_column(String(32), default="already_local")
    duty_total: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    vat_total: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    allocation_method: Mapped[str | None] = mapped_column(String(32), nullable=True)
    profit_margin: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    safety_margin: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    paperwork_source: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    committed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    creator: Mapped[User] = relationship(back_populates="batches")
    items: Mapped[list["BatchItem"]] = relationship(
        back_populates="batch", cascade="all, delete-orphan"
    )
    cost_entries: Mapped[list["CostEntry"]] = relationship(
        back_populates="batch", cascade="all, delete-orphan"
    )
    ledger_entries: Mapped[list["LedgerEntry"]] = relationship(
        back_populates="batch", cascade="all, delete-orphan"
    )


class BatchItem(Base):
    __tablename__ = "batch_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    batch_id: Mapped[int] = mapped_column(ForeignKey("shipment_batches.id"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    quantity: Mapped[float] = mapped_column(Numeric(12, 3))
    weight_kg: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)
    foreign_unit_price: Mapped[float | None] = mapped_column(Numeric(14, 4), nullable=True)
    local_unit_product_cost: Mapped[float | None] = mapped_column(Numeric(14, 4), nullable=True)
    line_cost_mode: Mapped[str] = mapped_column(String(32), default="already_local")
    duty_amount: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    vat_amount: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    shipping_share: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    landed_unit_cost: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    landed_line_cost: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    suggested_retail_price: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    accepted_retail_price: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    batch: Mapped[ShipmentBatch] = relationship(back_populates="items")
    product: Mapped[Product] = relationship(back_populates="batch_items")


class CostEntry(Base):
    __tablename__ = "cost_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    batch_id: Mapped[int] = mapped_column(ForeignKey("shipment_batches.id"))
    charge_type: Mapped[str] = mapped_column(String(32))
    entry_mode: Mapped[str] = mapped_column(String(32))
    amount: Mapped[float] = mapped_column(Numeric(14, 2))
    currency: Mapped[str] = mapped_column(String(8), default="ZMW")
    paperwork_source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    batch: Mapped[ShipmentBatch] = relationship(back_populates="cost_entries")


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    batch_id: Mapped[int] = mapped_column(ForeignKey("shipment_batches.id"))
    batch_item_id: Mapped[int | None] = mapped_column(ForeignKey("batch_items.id"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(64))
    payload_json: Mapped[dict] = mapped_column(JSON, default=dict)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    batch: Mapped[ShipmentBatch] = relationship(back_populates="ledger_entries")


class FxRateCache(Base):
    __tablename__ = "fx_rate_cache"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    base_currency: Mapped[str] = mapped_column(String(8), index=True)
    quote_currency: Mapped[str] = mapped_column(String(8), index=True)
    rate: Mapped[float] = mapped_column(Numeric(18, 8))
    source: Mapped[str] = mapped_column(String(32), default="frankfurter")
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    is_last_known_good: Mapped[bool] = mapped_column(Boolean, default=True)
