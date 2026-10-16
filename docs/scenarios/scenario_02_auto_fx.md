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
| FX | Starter **20** (or last fetched). **Fetch FX** for live; set **27.50** for this oracle |
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

## Spreadsheet expected outputs (weight @ 27.50)

Shares per kg: ship 200 + duty 50 + VAT 75 = **325**

| SKU | Local unit | Ship share | Duty | VAT | Landed unit | Suggested RP |
|---|---:|---:|---:|---:|---:|---:|
| EARBUD | 165.00 | 400.00 | 100.00 | 150.00 | **181.25** | **226.56** |
| CHARGER | 110.00 | 1200.00 | 300.00 | 450.00 | **175.00** | **218.75** |
| CABLE | 41.25 | 400.00 | 100.00 | 150.00 | **57.50** | **71.88** |
| CASE-SOFT | 82.50 | 800.00 | 200.00 | 300.00 | **115.00** | **143.75** |

## App replay

1. Products already imported (or import `samples/products_demo.csv`).  
2. Shipments → **Import shipment CSV** (`samples/shipment_B_full.csv`).  
3. On costs: rate starts at **20** (or last fetched). Click **Fetch FX**, or type **27.50** for the oracle below.  
4. True Cost → allocate **weight** → margin **0.25** → save → commit.

## Result log

| Field | Spreadsheet | App | Diff | Pass? |
|---|---:|---:|---:|---|
| EARBUD landed | 181.25 | | | |
| CHARGER landed | 175.00 | | | |
| CABLE landed | 57.50 | | | |
| CASE landed | 115.00 | | | |
| EARBUD suggested | 226.56 | | | |

**pytest:** PASS (fixed rate 27.50)
