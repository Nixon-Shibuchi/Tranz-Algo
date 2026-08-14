# Scenario 01 — Already-Local (quantity)

**Oracle source:** `docs/design/cost_modes_and_formulas.md` Example B  
**Automated:** `test_example_b_quantity_already_local`

## Inputs

| Field | Value |
|---|---|
| Mode | Already-Local |
| Allocation | Quantity |
| Shipping (ZMW) | 3000.00 |
| Duty total (ZMW) | 900.00 |
| VAT total (ZMW) | 1200.00 |
| Profit margin | 0.25 (25%) |
| Paperwork | CA-778 / FR-221 |

| SKU | Qty | Local unit (ZMW) |
|---|---:|---:|
| FAN-A | 10 | 500.00 |
| BLD-B | 5 | 750.00 |
| KTL-C | 10 | 250.00 |

## Spreadsheet expected outputs

| SKU | Ship share | Duty share | VAT share | Landed unit | Suggested RP |
|---|---:|---:|---:|---:|---:|
| FAN-A | 1200.00 | 360.00 | 480.00 | **704.00** | **880.00** |
| BLD-B | 600.00 | 180.00 | 240.00 | **954.00** | **1192.50** |
| KTL-C | 1200.00 | 360.00 | 480.00 | **454.00** | **567.50** |

## App replay

1. Products with matching SKUs (weights optional).  
2. Shipment Already-Local, local currency ZMW.  
3. Add lines with local unit costs above.  
4. Save costs: shipping 3000, duty 900, VAT 1200.  
5. Allocate **quantity** → Suggest margin **0.25**.

## Result log

| Field | Spreadsheet | App | Diff | Pass? |
|---|---:|---:|---:|---|
| FAN landed | 704.00 | | | |
| BLD landed | 954.00 | | | |
| KTL landed | 454.00 | | | |
| FAN suggested | 880.00 | | | |
| BLD suggested | 1192.50 | | | |
| KTL suggested | 567.50 | | | |

**pytest:** PASS (fixture locked in CI/local tests)
