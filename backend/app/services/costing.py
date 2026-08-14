from decimal import Decimal, ROUND_HALF_UP


TWOPLACES = Decimal("0.01")


def money(value: float | Decimal) -> float:
    return float(Decimal(str(value)).quantize(TWOPLACES, rounding=ROUND_HALF_UP))


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
    mode = item.get("line_cost_mode", "already_local")
    if mode == "auto_fx":
        if item.get("foreign_unit_price") is None:
            raise ValueError("Auto FX line missing foreign_unit_price")
        if exchange_rate is None:
            raise ValueError("Exchange rate required for Auto FX lines")
        return money(float(item["foreign_unit_price"]) * float(exchange_rate))
    if item.get("local_unit_product_cost") is None:
        raise ValueError("Already-Local line missing local_unit_product_cost")
    return money(float(item["local_unit_product_cost"]))


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
    items: dicts with id, quantity, weight_kg, line_cost_mode, foreign_unit_price, local_unit_product_cost
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

    if method == "weight":
        if any(p["weight"] <= 0 for p in prepared):
            raise ValueError("Weight allocation requires weight_kg > 0 on every line")
        basis = [p["weight"] for p in prepared]
    elif method == "quantity":
        basis = [p["quantity"] for p in prepared]
    elif method == "value":
        basis = [p["line_product"] for p in prepared]
    else:
        raise ValueError("method must be weight, quantity, or value")

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
