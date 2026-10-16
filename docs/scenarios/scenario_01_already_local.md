# Scenario 01 — Already-Local (quantity)

**Demo batch:** `SHP-DEMO-LOCAL-ZMW`  
**CSV:** `samples/shipment_A_full.csv` (+ `samples/products_demo.csv`)  
**Handout:** `docs/viva/Tranz-Algo_Demo_Shipment_Data.docx` · Demo A  
**Automated:** `test_demo_a_quantity_already_local`

## Inputs

| Field | Value |
|---|---|
| Reference | `SHP-DEMO-LOCAL-ZMW` |
| Mode | Already-Local (set on create) |
| Allocation | Quantity (100 units) |
| Shipping (ZMW) | 5000.00 |
| Duty total (ZMW) | 1000.00 |
| VAT total (ZMW) | 1500.00 |
| Profit margin | 0.30 (30%) |
| Paperwork | Agent invoice AG-100 / road pack RC-441 |

| SKU | Qty | Local unit (ZMW) |
|---|---:|---:|
| RICE-5 | 20 | 95.00 |
| SUGAR-1 | 30 | 32.00 |
| OIL-2L | 10 | 85.00 |
| TEA-500 | 24 | 45.00 |
| SOAP-BAR | 16 | 18.00 |

## Spreadsheet expected outputs

Shares per unit: ship 50 + duty 10 + VAT 15 = **75**

| SKU | Ship share | Duty share | VAT share | Landed unit | Suggested RP |
|---|---:|---:|---:|---:|---:|
| RICE-5 | 1000.00 | 200.00 | 300.00 | **170.00** | **221.00** |
| SUGAR-1 | 1500.00 | 300.00 | 450.00 | **107.00** | **139.10** |
| OIL-2L | 500.00 | 100.00 | 150.00 | **160.00** | **208.00** |
| TEA-500 | 1200.00 | 240.00 | 360.00 | **120.00** | **156.00** |
| SOAP-BAR | 800.00 | 160.00 | 240.00 | **93.00** | **120.90** |

## App replay

1. Products → **Import CSV** (`samples/products_demo.csv`).  
2. Shipments → **Clear drafts** if needed → **Import shipment CSV** (`samples/shipment_A_full.csv`).  
3. True Cost → allocate **quantity** → margin **0.30** → save suggestions → commit.

## Result log

| Field | Spreadsheet | App | Diff | Pass? |
|---|---:|---:|---:|---|
| RICE landed | 170.00 | | | |
| SUGAR landed | 107.00 | | | |
| OIL landed | 160.00 | | | |
| TEA landed | 120.00 | | | |
| SOAP landed | 93.00 | | | |
| RICE suggested | 221.00 | | | |

**pytest:** PASS
