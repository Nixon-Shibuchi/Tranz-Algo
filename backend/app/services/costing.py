"""Landed-cost domain engine (Template Method over Strategy + Factory).

Public functions keep the same signatures so API and tests stay stable while
allocation and line-cost modes are open for extension (OCP / Protected Variations).
"""

from app.services.costing_math import money
from app.services.strategies.allocation import get_allocation_strategy
from app.services.strategies.line_cost import get_line_cost_strategy

__all__ = [
    "money",
    "allocate_shares",
    "local_unit_cost",
    "compute_line_taxes",
    "compute_landed_for_method",
    "suggest_prices",
    "margin_guard_alert",
]


def allocate_shares(
    amounts: list[float],
    total_charge: float,
) -> list[float]:
    """Allocate total_charge proportional to amounts; last line gets remainder for exact sum."""
    if total_charge is None:
        return [0.0] * len(amounts)
    if not amounts or sum(amounts) <= 0:
        raise ValueError("Cannot allocate: basis totals must be > 0")
    basis_total = sum(amounts)
    raw = [total_charge * (a / basis_total) for a in amounts]
    rounded = [money(x) for x in raw]
    drift = money(total_charge - sum(rounded))
    if rounded:
        rounded[-1] = money(rounded[-1] + drift)
    return rounded


def local_unit_cost(item: dict, exchange_rate: float | None) -> float:
    """Facade over LineCostStrategy factory (keeps call sites simple)."""
    strategy = get_line_cost_strategy(item.get("line_cost_mode"))
    return strategy.unit_cost(item, exchange_rate)


def compute_line_taxes(
    product_line_value: float,
    duty_rate: float | None,
    vat_rate: float | None,
) -> tuple[float, float]:
    duty = money(product_line_value * float(duty_rate or 0))
    vat = money((product_line_value + duty) * float(vat_rate or 0))
    return duty, vat


def compute_landed_for_method(
    items: list[dict],
    *,
    method: str,
    shipping_total: float,
    exchange_rate: float | None,
    batch_duty_total: float | None,
    batch_vat_total: float | None,
    tax_rates_by_item: dict[int, tuple[float, float]],
) -> list[dict]:
    """
    Template Method: prepare lines → Strategy basis → allocate shares → assemble.

    items: dicts with id, quantity, weight_kg, line_cost_mode, foreign_unit_price,
           local_unit_product_cost
    tax_rates_by_item: item_id -> (duty_rate, vat_rate); used when batch totals are None
    """
    prepared = []
    for item in items:
        qty = float(item["quantity"])
        if qty <= 0:
            raise ValueError("Quantity must be > 0")
        unit = local_unit_cost(item, exchange_rate)
        line_product = money(unit * qty)
        weight = float(item["weight_kg"] or 0)
        prepared.append(
            {
                "id": item["id"],
                "quantity": qty,
                "weight": weight,
                "local_unit": unit,
                "line_product": line_product,
            }
        )

    strategy = get_allocation_strategy(method)
    basis = strategy.basis(prepared)

    ship_shares = allocate_shares(basis, float(shipping_total or 0))

    use_batch_tax = batch_duty_total is not None or batch_vat_total is not None
    duty_shares = (
        allocate_shares(basis, float(batch_duty_total or 0)) if use_batch_tax else None
    )
    vat_shares = (
        allocate_shares(basis, float(batch_vat_total or 0)) if use_batch_tax else None
    )

    results = []
    for idx, p in enumerate(prepared):
        if use_batch_tax:
            duty = duty_shares[idx]
            vat = vat_shares[idx]
        else:
            duty_rate, vat_rate = tax_rates_by_item.get(p["id"], (0.0, 0.0))
            duty, vat = compute_line_taxes(p["line_product"], duty_rate, vat_rate)
        line_landed = money(p["line_product"] + ship_shares[idx] + duty + vat)
        unit_landed = money(line_landed / p["quantity"])
        results.append(
            {
                "item_id": p["id"],
                "local_unit_product_cost": p["local_unit"],
                "shipping_share": ship_shares[idx],
                "duty_amount": duty,
                "vat_amount": vat,
                "landed_line_cost": line_landed,
                "landed_unit_cost": unit_landed,
            }
        )
    return results


def suggest_prices(landed_unit_costs: list[tuple[int, float]], profit_margin: float) -> list[dict]:
    out = []
    for item_id, landed in landed_unit_costs:
        suggested = money(float(landed) * (1 + float(profit_margin)))
        out.append({"item_id": item_id, "suggested_retail_price": suggested})
    return out


def margin_guard_alert(active_price: float, landed_unit: float, safety_margin: float) -> bool:
    floor = money(float(landed_unit) * (1 + float(safety_margin)))
    return float(active_price) < floor
