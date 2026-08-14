from app.services.costing import compute_landed_for_method, money, suggest_prices


def test_example_b_quantity_already_local():
    items = [
        {
            "id": 1,
            "quantity": 10,
            "weight_kg": 50,
            "line_cost_mode": "already_local",
            "local_unit_product_cost": 500,
        },
        {
            "id": 2,
            "quantity": 5,
            "weight_kg": 15,
            "line_cost_mode": "already_local",
            "local_unit_product_cost": 750,
        },
        {
            "id": 3,
            "quantity": 10,
            "weight_kg": 15,
            "line_cost_mode": "already_local",
            "local_unit_product_cost": 250,
        },
    ]
    results = compute_landed_for_method(
        items,
        method="quantity",
        shipping_total=3000,
        exchange_rate=None,
        batch_duty_total=900,
        batch_vat_total=1200,
        tax_rates_by_item={},
    )
    by_id = {r["item_id"]: r for r in results}
    assert by_id[1]["landed_unit_cost"] == 704.00
    assert by_id[2]["landed_unit_cost"] == 954.00
    assert by_id[3]["landed_unit_cost"] == 454.00

    suggested = suggest_prices(
        [(r["item_id"], r["landed_unit_cost"]) for r in results], 0.25
    )
    s = {x["item_id"]: x["suggested_retail_price"] for x in suggested}
    assert s[1] == 880.00
    assert s[2] == 1192.50
    assert s[3] == 567.50


def test_example_a_weight_auto_fx():
    items = [
        {
            "id": 1,
            "quantity": 10,
            "weight_kg": 50,
            "line_cost_mode": "auto_fx",
            "foreign_unit_price": 20,
        },
        {
            "id": 2,
            "quantity": 5,
            "weight_kg": 15,
            "line_cost_mode": "auto_fx",
            "foreign_unit_price": 30,
        },
        {
            "id": 3,
            "quantity": 10,
            "weight_kg": 15,
            "line_cost_mode": "auto_fx",
            "foreign_unit_price": 10,
        },
    ]
    rates = {1: (0.10, 0.16), 2: (0.10, 0.16), 3: (0.10, 0.16)}
    results = compute_landed_for_method(
        items,
        method="weight",
        shipping_total=5400,
        exchange_rate=27.0,
        batch_duty_total=None,
        batch_vat_total=None,
        tax_rates_by_item=rates,
    )
    by_id = {r["item_id"]: r for r in results}
    assert by_id[1]["landed_unit_cost"] == 1026.54
    assert by_id[2]["landed_unit_cost"] == 1236.06
    assert by_id[3]["landed_unit_cost"] == 445.77
    assert money(1026.54 * 1.30) == 1334.50
