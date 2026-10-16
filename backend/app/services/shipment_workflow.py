"""GoF Facade: shipment costing workflow (allocate → suggest → commit).

Keeps FastAPI routers thin (GRASP Controller) while domain side-effects stay here
(Information Expert / High Cohesion). Raising WorkflowError lets the API map status codes.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import BatchItem, LedgerEntry, Product, ShipmentBatch
from app.services.costing import compute_landed_for_method, margin_guard_alert, money, suggest_prices


class WorkflowError(Exception):
    def __init__(self, detail: str, status_code: int = 422):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


def get_batch(db: Session, batch_id: int, *, with_products: bool = False) -> ShipmentBatch:
    options = joinedload(ShipmentBatch.items)
    if with_products:
        options = joinedload(ShipmentBatch.items).joinedload(BatchItem.product)
    batch = db.scalars(
        select(ShipmentBatch).where(ShipmentBatch.id == batch_id).options(options)
    ).unique().first()
    if not batch:
        raise WorkflowError("Shipment not found", status_code=404)
    return batch


def ensure_editable(batch: ShipmentBatch) -> None:
    if batch.status == "committed":
        raise WorkflowError("Committed batches are read-only", status_code=409)


def item_dicts(batch: ShipmentBatch) -> list[dict]:
    return [
        {
            "id": item.id,
            "quantity": float(item.quantity),
            "weight_kg": float(item.weight_kg) if item.weight_kg is not None else None,
            "line_cost_mode": item.line_cost_mode,
            "foreign_unit_price": float(item.foreign_unit_price)
            if item.foreign_unit_price is not None
            else None,
            "local_unit_product_cost": float(item.local_unit_product_cost)
            if item.local_unit_product_cost is not None
            else None,
        }
        for item in batch.items
    ]


def allocate_batch(
    db: Session,
    batch_id: int,
    *,
    method: str,
    compare: bool = False,
) -> dict:
    batch = get_batch(db, batch_id, with_products=True)
    ensure_editable(batch)
    if not batch.items:
        raise WorkflowError("Batch has no items")

    items = item_dicts(batch)
    shipping = float(batch.shipping_total or 0)
    rate = float(batch.exchange_rate) if batch.exchange_rate is not None else None
    duty_total = float(batch.duty_total) if batch.duty_total is not None else None
    vat_total = float(batch.vat_total) if batch.vat_total is not None else None

    try:
        selected = compute_landed_for_method(
            items,
            method=method,
            shipping_total=shipping,
            exchange_rate=rate,
            batch_duty_total=duty_total,
            batch_vat_total=vat_total,
        )
        comparison: dict = {"selected": selected}
        if compare:
            other = "quantity" if method == "weight" else "weight"
            try:
                comparison[other] = compute_landed_for_method(
                    items,
                    method=other,
                    shipping_total=shipping,
                    exchange_rate=rate,
                    batch_duty_total=duty_total,
                    batch_vat_total=vat_total,
                )
            except ValueError:
                comparison[other] = None
            comparison[method] = selected
    except ValueError as exc:
        raise WorkflowError(str(exc)) from exc

    by_id = {row["item_id"]: row for row in selected}
    for item in batch.items:
        row = by_id[item.id]
        item.local_unit_product_cost = row["local_unit_product_cost"]
        item.shipping_share = row["shipping_share"]
        item.duty_amount = row["duty_amount"]
        item.vat_amount = row["vat_amount"]
        item.landed_line_cost = row["landed_line_cost"]
        item.landed_unit_cost = row["landed_unit_cost"]
    batch.allocation_method = method
    batch.status = "costed"
    db.commit()
    return {
        "selected_method": method,
        "comparison": comparison,
        "batch": get_batch(db, batch_id),
    }


def suggest_batch_prices(
    db: Session,
    batch_id: int,
    *,
    profit_margin: float,
    safety_margin: float,
) -> ShipmentBatch:
    batch = get_batch(db, batch_id)
    ensure_editable(batch)
    if not batch.items or any(i.landed_unit_cost is None for i in batch.items):
        raise WorkflowError("Allocate costs before suggesting prices")
    suggestions = suggest_prices(
        [(i.id, float(i.landed_unit_cost)) for i in batch.items],
        profit_margin,
    )
    by_id = {s["item_id"]: s["suggested_retail_price"] for s in suggestions}
    for item in batch.items:
        item.suggested_retail_price = by_id[item.id]
    batch.profit_margin = profit_margin
    batch.safety_margin = safety_margin
    db.commit()
    return get_batch(db, batch_id)


def commit_batch(
    db: Session,
    batch_id: int,
    *,
    user_id: int,
    accept_suggestions: bool,
    item_price_overrides: list,
) -> ShipmentBatch:
    batch = get_batch(db, batch_id)
    if batch.status == "committed":
        raise WorkflowError("Already committed", status_code=409)
    if not batch.items or any(i.landed_unit_cost is None for i in batch.items):
        raise WorkflowError("Allocate before commit")

    overrides = {o.item_id: o.accepted_retail_price for o in item_price_overrides}
    for item in batch.items:
        if item.id in overrides:
            item.accepted_retail_price = money(overrides[item.id])
            pricing_method = "manual"
        elif accept_suggestions:
            if item.suggested_retail_price is None:
                raise WorkflowError("Suggest prices before commit")
            item.accepted_retail_price = item.suggested_retail_price
            pricing_method = "margin_percent"
        else:
            raise WorkflowError("Accept suggestions or provide manual prices before commit")
        product = db.get(Product, item.product_id)
        if product:
            product.stock_on_hand = float(product.stock_on_hand or 0) + float(item.quantity)
            product.active_retail_price = item.accepted_retail_price

        db.add(
            LedgerEntry(
                batch_id=batch.id,
                batch_item_id=item.id,
                event_type="landed_cost",
                payload_json={
                    "landed_unit_cost": float(item.landed_unit_cost),
                    "shipping_share": float(item.shipping_share or 0),
                    "duty_amount": float(item.duty_amount or 0),
                    "vat_amount": float(item.vat_amount or 0),
                    "allocation_method": batch.allocation_method,
                    "primary_cost_mode": batch.primary_cost_mode,
                    "exchange_rate": float(batch.exchange_rate) if batch.exchange_rate else None,
                    "exchange_rate_source": batch.exchange_rate_source,
                },
                created_by=user_id,
            )
        )
        db.add(
            LedgerEntry(
                batch_id=batch.id,
                batch_item_id=item.id,
                event_type="price_accepted",
                payload_json={
                    "accepted_retail_price": float(item.accepted_retail_price),
                    "suggested_retail_price": float(item.suggested_retail_price or 0),
                    "profit_margin": float(batch.profit_margin or 0),
                    "pricing_method": pricing_method,
                },
                created_by=user_id,
            )
        )

    if batch.paperwork_source:
        db.add(
            LedgerEntry(
                batch_id=batch.id,
                event_type="paperwork_source",
                payload_json={"paperwork_source": batch.paperwork_source},
                created_by=user_id,
            )
        )

    batch.status = "committed"
    batch.committed_at = datetime.now(timezone.utc)
    db.commit()
    return get_batch(db, batch_id)


def recheck_margin_guard(db: Session, batch_id: int, *, user_id: int) -> dict:
    batch = get_batch(db, batch_id)
    safety = float(batch.safety_margin or 0.10)
    alerts = []
    for item in batch.items:
        product = db.get(Product, item.product_id)
        active = float(
            (product.active_retail_price if product and product.active_retail_price is not None else None)
            or item.accepted_retail_price
            or 0
        )
        landed = float(item.landed_unit_cost or 0)
        if landed and active and margin_guard_alert(active, landed, safety):
            alert = {
                "item_id": item.id,
                "product_id": item.product_id,
                "active_retail_price": active,
                "landed_unit_cost": landed,
                "floor": money(landed * (1 + safety)),
            }
            alerts.append(alert)
            db.add(
                LedgerEntry(
                    batch_id=batch.id,
                    batch_item_id=item.id,
                    event_type="margin_alert",
                    payload_json=alert,
                    created_by=user_id,
                )
            )
    db.commit()
    return {"alerts": alerts, "safety_margin": safety}
