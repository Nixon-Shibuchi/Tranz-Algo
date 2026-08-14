# Scenario 02 — Auto FX (weight)

**Oracle source:** `docs/design/cost_modes_and_formulas.md` Example A  
**Automated:** `test_example_a_weight_auto_fx`

## Inputs

| Field | Value |
|---|---|
| Mode | Auto FX |
| FX | 1 USD = 27.00 ZMW |
| Shipping | 200 USD → **5400.00 ZMW** (enter local shipping 5400 after conversion, or convert in spreadsheet) |
| Allocation | Weight |
| Tax profile | Duty 10%, VAT 16% on local product line value |
| Profit margin | 0.30 (30%) |

| SKU | Qty | Line weight kg | Foreign unit (USD) |
|---|---:|---:|---:|
| FAN-A | 10 | 50 | 20.00 |
| BLD-B | 5 | 15 | 30.00 |
| KTL-C | 10 | 15 | 10.00 |

## Spreadsheet expected outputs (weight allocation)

| SKU | Local unit | Ship share | Duty | VAT | Landed unit | Suggested RP |
|---|---:|---:|---:|---:|---:|---:|
| FAN-A | 540.00 | 3375.00 | 540.00 | 950.40 | **1026.54** | **1334.50** |
| BLD-B | 810.00 | 1012.50 | 405.00 | 712.80 | **1236.06** | **1606.88** |
| KTL-C | 270.00 | 1012.50 | 270.00 | 475.20 | **445.77** | **579.50** |

## App replay

1. Create tax profile duty `0.10`, VAT `0.16`; attach to products.  
2. Shipment Auto FX, foreign USD, local ZMW, rate **27**.  
3. Add lines with foreign unit prices + line weights.  
4. Costs: exchange 27, shipping total **5400** ZMW (pre-converted), leave batch duty/VAT empty so profiles apply.  
5. Allocate **weight** → Suggest **0.30**.

## Result log

| Field | Spreadsheet | App | Diff | Pass? |
|---|---:|---:|---:|---|
| FAN landed | 1026.54 | | | |
| BLD landed | 1236.06 | | | |
| KTL landed | 445.77 | | | |
| FAN suggested | 1334.50 | | | |

**pytest:** PASS
