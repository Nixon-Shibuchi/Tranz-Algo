from app.services.costing import compute_landed_for_method, money, suggest_prices


def test_demo_a_quantity_already_local():
    """SHP-DEMO-LOCAL-ZMW — Scenario 01 / samples/shipment_A_full.csv"""
    items = [
        {
            "id": 1,
            "quantity": 20,
            "weight_kg": 100,
            "line_cost_mode": "already_local",
            "local_unit_product_cost": 95,
        },
        {
            "id": 2,
            "quantity": 30,
            "weight_kg": 30,
            "line_cost_mode": "already_local",
            "local_unit_product_cost": 32,
        },
        {
            "id": 3,
            "quantity": 10,
            "weight_kg": 20,
            "line_cost_mode": "already_local",
            "local_unit_product_cost": 85,
        },
        {
            "id": 4,
            "quantity": 24,
            "weight_kg": 12,
            "line_cost_mode": "already_local",
            "local_unit_product_cost": 45,
        },
        {
            "id": 5,
            "quantity": 16,
            "weight_kg": 1.92,
            "line_cost_mode": "already_local",
            "local_unit_product_cost": 18,
        },
    ]
    results = compute_landed_for_method(
        items,
        method="quantity",
        shipping_total=5000,
        exchange_rate=None,
        batch_duty_total=1000,
        batch_vat_total=1500,
    )
    by_id = {r["item_id"]: r for r in results}
    assert by_id[1]["landed_unit_cost"] == 170.00
    assert by_id[2]["landed_unit_cost"] == 107.00
    assert by_id[3]["landed_unit_cost"] == 160.00
    assert by_id[4]["landed_unit_cost"] == 120.00
    assert by_id[5]["landed_unit_cost"] == 93.00

    suggested = suggest_prices(
        [(r["item_id"], r["landed_unit_cost"]) for r in results], 0.30
    )
    s = {x["item_id"]: x["suggested_retail_price"] for x in suggested}
    assert s[1] == 221.00
    assert s[2] == 139.10
    assert s[3] == 208.00
    assert s[4] == 156.00
    assert s[5] == 120.90


def test_demo_b_weight_auto_fx():
    """SHP-DEMO-AUTO-FX — Scenario 02 / samples/shipment_B_full.csv @ starter rate 20"""
    items = [
        {
            "id": 1,
            "quantity": 40,
            "weight_kg": 2.0,
            "line_cost_mode": "auto_fx",
            "foreign_unit_price": 6.00,
        },
        {
            "id": 2,
            "quantity": 30,
            "weight_kg": 6.0,
            "line_cost_mode": "auto_fx",
            "foreign_unit_price": 4.00,
        },
        {
            "id": 3,
            "quantity": 40,
            "weight_kg": 2.0,
            "line_cost_mode": "auto_fx",
            "foreign_unit_price": 1.50,
        },
        {
            "id": 4,
            "quantity": 40,
            "weight_kg": 4.0,
            "line_cost_mode": "auto_fx",
            "foreign_unit_price": 3.00,
        },
    ]
    results = compute_landed_for_method(
        items,
        method="weight",
        shipping_total=2800,
        exchange_rate=20,
        batch_duty_total=700,
        batch_vat_total=1050,
    )
    by_id = {r["item_id"]: r for r in results}
    assert by_id[1]["landed_unit_cost"] == 136.25
    assert by_id[2]["landed_unit_cost"] == 145.00
    assert by_id[3]["landed_unit_cost"] == 46.25
    assert by_id[4]["landed_unit_cost"] == 92.50
    assert money(136.25 * 1.25) == 170.31

    suggested = suggest_prices(
        [(r["item_id"], r["landed_unit_cost"]) for r in results], 0.25
    )
    s = {x["item_id"]: x["suggested_retail_price"] for x in suggested}
    assert s[1] == 170.31
    assert s[2] == 181.25
    assert s[3] == 57.81
    assert s[4] == 115.63
