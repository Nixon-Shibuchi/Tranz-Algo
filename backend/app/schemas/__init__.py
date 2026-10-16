from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# Auth
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = ""


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(ORMModel):
    id: int
    email: EmailStr
    full_name: str
    role: str


# Products
class ProductCreate(BaseModel):
    sku: str | None = None
    name: str
    description: str | None = None
    category: str | None = None
    brand: str | None = None
    unit: str = "pcs"
    barcode: str | None = None
    origin_country: str | None = None
    default_weight_kg: float | None = None
    reorder_level: float | None = None


class ProductUpdate(BaseModel):
    sku: str | None = None
    name: str | None = None
    description: str | None = None
    category: str | None = None
    brand: str | None = None
    unit: str | None = None
    barcode: str | None = None
    origin_country: str | None = None
    default_weight_kg: float | None = None
    reorder_level: float | None = None
    active_retail_price: float | None = None


class ProductOut(ORMModel):
    id: int
    sku: str
    name: str
    description: str | None
    category: str | None = None
    brand: str | None = None
    unit: str = "pcs"
    barcode: str | None = None
    origin_country: str | None = None
    default_weight_kg: float | None
    reorder_level: float | None = None
    stock_on_hand: float
    active_retail_price: float | None


# Shipments
class ShipmentCreate(BaseModel):
    reference: str
    supplier_name: str | None = None
    invoice_number: str | None = None
    clearing_agent: str | None = None
    carrier_name: str | None = None
    origin_country: str | None = None
    destination: str | None = "Zambia"
    expected_arrival_date: str | None = None
    received_date: str | None = None
    primary_cost_mode: str = "already_local"
    currency_foreign: str | None = None
    currency_local: str = "ZMW"
    notes: str | None = None


class ShipmentUpdate(BaseModel):
    supplier_name: str | None = None
    invoice_number: str | None = None
    clearing_agent: str | None = None
    carrier_name: str | None = None
    origin_country: str | None = None
    destination: str | None = None
    expected_arrival_date: str | None = None
    received_date: str | None = None
    primary_cost_mode: str | None = None
    currency_foreign: str | None = None
    currency_local: str | None = None
    notes: str | None = None


class BatchItemCreate(BaseModel):
    product_id: int
    quantity: float
    weight_kg: float | None = None
    foreign_unit_price: float | None = None
    local_unit_product_cost: float | None = None
    line_cost_mode: str = "already_local"


class BatchItemUpdate(BaseModel):
    quantity: float | None = None
    weight_kg: float | None = None
    foreign_unit_price: float | None = None
    local_unit_product_cost: float | None = None
    line_cost_mode: str | None = None
    accepted_retail_price: float | None = None


class BatchItemOut(ORMModel):
    id: int
    batch_id: int
    product_id: int
    quantity: float
    weight_kg: float | None
    foreign_unit_price: float | None
    local_unit_product_cost: float | None
    line_cost_mode: str
    duty_amount: float | None
    vat_amount: float | None
    shipping_share: float | None
    landed_unit_cost: float | None
    landed_line_cost: float | None
    suggested_retail_price: float | None
    accepted_retail_price: float | None


class ShipmentOut(ORMModel):
    id: int
    reference: str
    created_by: int
    supplier_name: str | None
    invoice_number: str | None = None
    clearing_agent: str | None = None
    carrier_name: str | None = None
    origin_country: str | None = None
    destination: str | None = None
    expected_arrival_date: str | None = None
    received_date: str | None = None
    status: str
    primary_cost_mode: str
    currency_foreign: str | None
    currency_local: str
    exchange_rate: float | None
    exchange_rate_source: str | None
    shipping_total: float | None
    shipping_currency_mode: str
    duty_total: float | None
    vat_total: float | None
    allocation_method: str | None
    profit_margin: float | None
    safety_margin: float | None
    paperwork_source: str | None
    notes: str | None
    committed_at: datetime | None
    items: list[BatchItemOut] = []


class CostsUpdate(BaseModel):
    exchange_rate: float | None = None
    exchange_rate_source: str | None = None
    shipping_total: float | None = None
    shipping_currency_mode: str | None = None
    duty_total: float | None = None
    vat_total: float | None = None
    paperwork_source: str | None = None


class AllocateRequest(BaseModel):
    method: str = "quantity"  # weight | quantity
    compare: bool = True


class SuggestRequest(BaseModel):
    profit_margin: float = 0.30
    safety_margin: float = 0.10


class PriceOverride(BaseModel):
    item_id: int
    accepted_retail_price: float


class CommitRequest(BaseModel):
    accept_suggestions: bool = True
    item_price_overrides: list[PriceOverride] = []


class LedgerOut(ORMModel):
    id: int
    batch_id: int
    batch_item_id: int | None
    event_type: str
    payload_json: dict[str, Any]
    created_at: datetime


class FxRateOut(BaseModel):
    base_currency: str
    quote_currency: str
    rate: float
    source: str
    fetched_at: datetime | None = None


class ManualFxRate(BaseModel):
    base_currency: str
    quote_currency: str = "ZMW"
    rate: float


class SummaryOut(BaseModel):
    products: int
    shipments: int
    draft_shipments: int
    committed_shipments: int


class SaleCreate(BaseModel):
    product_id: int
    quantity: float = Field(gt=0)
    unit_price: float | None = Field(default=None, ge=0)
    note: str | None = Field(default=None, max_length=255)


class SaleOut(ORMModel):
    id: int
    product_id: int
    sku: str
    name: str
    quantity: float
    unit_price: float | None
    line_total: float | None
    note: str | None
    stock_after: float
    created_at: datetime
