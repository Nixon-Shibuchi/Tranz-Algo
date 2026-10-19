# Scenario 02 — Auto FX (weight)

**Demo batch:** `SHP-DEMO-AUTO-FX`  
**CSV:** `samples/shipment_B_full.csv` (+ `samples/products_demo.csv`)  
**Handout:** `docs/viva/Tranz-Algo_Demo_Shipment_Data.docx` · Demo B  
**Automated:** `test_demo_b_weight_auto_fx`

## Inputs

| Field | Value |
|---|---|
| Reference | `SHP-DEMO-AUTO-FX` |
| Mode | Auto FX (set on create) |
| FX | **20** (CSV / UI starter; same rate used for the oracle) |
| Shipping (ZMW) | 2800.00 |
| Duty total (ZMW) | 700.00 |
| VAT total (ZMW) | 1050.00 |
| Allocation | Weight (14 kg line weights) |
| Profit margin | 0.25 (25%) |
| Paperwork | CI-220 / clearance CL-55 |

| SKU | Qty | Line weight kg | Foreign unit (USD) |
|---|---:|---:|---:|
| EARBUD | 40 | 2.0 | 6.00 |
| CHARGER | 30 | 6.0 | 4.00 |
| CABLE | 40 | 2.0 | 1.50 |
| CASE-SOFT | 40 | 4.0 | 3.00 |

## Spreadsheet expected outputs (weight @ 20)

Local unit = foreign × **20**. Shares per kg: ship 200 + duty 50 + VAT 75 = **325**.

| SKU | Local unit | Ship share | Duty | VAT | Landed unit | Suggested RP |
|---|---:|---:|---:|---:|---:|---:|
| EARBUD | 120.00 | 400.00 | 100.00 | 150.00 | **136.25** | **170.31** |
| CHARGER | 80.00 | 1200.00 | 300.00 | 450.00 | **145.00** | **181.25** |
| CABLE | 30.00 | 400.00 | 100.00 | 150.00 | **46.25** | **57.81** |
| CASE-SOFT | 60.00 | 800.00 | 200.00 | 300.00 | **92.50** | **115.63** |

## App replay

1. Products already imported (or import `samples/products_demo.csv`).  
2. Shipments → **Import shipment CSV** (`samples/shipment_B_full.csv`).  
3. On costs: rate is **20** from the CSV (same as UI starter). Optional **Fetch FX** for a live rate — for the oracle numbers below, keep **20**.  
4. True Cost → allocate **weight** → margin **0.25** → save → commit.

## Result log

| Field | Spreadsheet | App | Diff | Pass? |
|---|---:|---:|---:|---|
| EARBUD landed | 136.25 | | | |
| CHARGER landed | 145.00 | | | |
| CABLE landed | 46.25 | | | |
| CASE landed | 92.50 | | | |
| EARBUD suggested | 170.31 | | | |

**pytest:** PASS (fixed rate 20)
