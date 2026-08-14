# Dual Cost Modes, Allocation & Worked Formula Examples

**Design freeze:** Week 1 Day 1  
**Owners:** Nixon + Musonda  
**As built:** Quantity + weight allocation in UI; value-based still stretch. After suggest, UI offers auto-accept vs manual retail before commit. Worked examples A/B are covered by `backend/tests/test_costing.py`.

---

## 1. Dual cost-entry modes

### Auto FX mode
Use when supplier product prices (and optionally freight) are still in foreign currency.

**Required inputs**
- Foreign currency code (e.g. `USD`)
- Exchange rate (API / cache / manual)
- Per-item `foreign_unit_price` + `quantity`
- Shipping total (foreign or local — if foreign, convert with same/manual rate)
- Duty/VAT via profile rates or manual amounts

**System actions**
1. Convert product lines to local currency  
2. Convert shipping if needed  
3. Allocate shipping share  
4. Apply duty/VAT  
5. Compute landed cost + suggested price  

### Already-Local mode
Use when shipper/clearing agent/bank paperwork already shows local amounts.

**Required inputs**
- Per-item `local_unit_product_cost` (or line product total) + `quantity`
- Local shipping total (from shipper invoice)
- Local duty/VAT totals or per-line amounts
- `paperwork_source` text (for ledger)

**System actions**
1. Skip forced FX API conversion for those fields  
2. Allocate shared local shipping (and shared tax totals if entered at batch level)  
3. Compute landed cost + suggested price  
4. Record paperwork source in ledger / cost_entries  

### Mixed paperwork (allowed)
Example: Auto FX on supplier product lines + Already-Local on freight/duty from clearing agent.

Store:
- `shipment_batches.primary_cost_mode = mixed`
- each `batch_items.line_cost_mode`
- each charge’s `entry_mode` on `cost_entries`

---

## 2. Core formulas

### Auto FX product conversion
```text
LocalProductCost_i = ForeignUnitPrice_i × ExchangeRate
```

### Shipping share
```text
Weight-based:    ShippingShare_i = (weight_i / total_weight) × shipping_total
Quantity-based:  ShippingShare_i = (qty_i / total_qty) × shipping_total
Value-based:     ShippingShare_i = (line_value_i / total_line_value) × shipping_total   # stretch
```
where `line_value_i` is local product line value after conversion/entry.

### Duty / VAT (profile method — illustrative MVP)
```text
TaxableBase_i = LocalProductCost_i × qty_i     # or include shipping share if you choose that policy
Duty_i = TaxableBase_i × duty_rate
VAT_i  = (TaxableBase_i + Duty_i) × vat_rate
```
If user enters batch-level duty/VAT totals instead, allocate by the same method as shipping (document choice in ledger).

**MVP policy (freeze this):**  
- If tax profile on line → compute duty/VAT from **local product line value only** (exclude shipping share).  
- If manual batch totals entered → allocate duty/VAT totals by selected allocation method.

### Landed cost
```text
Auto FX / converted:
LandedLineCost_i = (LocalProductCost_i × qty_i) + ShippingShare_i + Duty_i + VAT_i
LandedUnitCost_i = LandedLineCost_i / qty_i

Already-Local:
LandedLineCost_i = (LocalUnitProductCost_i × qty_i) + ShippingShare_i + Duty_i + VAT_i
LandedUnitCost_i = LandedLineCost_i / qty_i
```

### Price suggestion
```text
SuggestedRP_i = LandedUnitCost_i × (1 + ProfitMargin)
```

### Margin-Guard
```text
Alert if ActiveRetailPrice_i < RecomputedLandedUnitCost_i × (1 + SafetyMargin)
```

Rounding: store money at 2 decimal places; tests allow `<= 0.01` difference vs spreadsheet oracle.

---

## 3. Worked example A — Auto FX

**Batch:** `SHP-DEMO-AUTO`  
**FX:** `1 USD = 27.00 ZMW` (manual/API)  
**Shipping:** `200 USD` → `5400.00 ZMW`  
**Allocation compare:** weight vs quantity  
**Tax profile:** duty 10%, VAT 16% on local product line value  
**Profit margin:** 30%

### Items

| Item | Qty | Weight kg | Foreign unit (USD) |
|---|---:|---:|---:|
| A Fan | 10 | 5.0 each → 50 total | 20.00 |
| B Blender | 5 | 3.0 each → 15 total | 30.00 |
| C Kettle | 10 | 1.5 each → 15 total | 10.00 |
| **Total** | **25** | **80** | |

### Step 1 — Convert product lines

| Item | Local unit | Local line product |
|---|---:|---:|
| A | 20 × 27 = **540.00** | 5400.00 |
| B | 30 × 27 = **810.00** | 4050.00 |
| C | 10 × 27 = **270.00** | 2700.00 |
| **Total product** | | **12150.00** |

### Step 2 — Shipping shares (`shipping_total = 5400`)

**Weight-based**

| Item | Weight share | Shipping share |
|---|---:|---:|
| A | 50/80 | 3375.00 |
| B | 15/80 | 1012.50 |
| C | 15/80 | 1012.50 |

**Quantity-based**

| Item | Qty share | Shipping share |
|---|---:|---:|
| A | 10/25 | 2160.00 |
| B | 5/25 | 1080.00 |
| C | 10/25 | 2160.00 |

### Step 3 — Duty/VAT on product line value (profile)

| Item | Product line | Duty 10% | VAT 16% on (product+duty) |
|---|---:|---:|---:|
| A | 5400.00 | 540.00 | 950.40 |
| B | 4050.00 | 405.00 | 712.80 |
| C | 2700.00 | 270.00 | 475.20 |

### Step 4 — Landed cost (using **weight** allocation)

| Item | Product | Ship | Duty | VAT | Line landed | Unit landed |
|---|---:|---:|---:|---:|---:|---:|
| A | 5400.00 | 3375.00 | 540.00 | 950.40 | **10265.40** | **1026.54** |
| B | 4050.00 | 1012.50 | 405.00 | 712.80 | **6180.30** | **1236.06** |
| C | 2700.00 | 1012.50 | 270.00 | 475.20 | **4457.70** | **445.77** |

### Step 5 — Suggested RP (30% margin)

| Item | Unit landed | Suggested RP |
|---|---:|---:|
| A | 1026.54 | **1334.50** |
| B | 1236.06 | **1606.88** |
| C | 445.77 | **579.50** |

*(Suggested = landed_unit × 1.30, rounded to 2 dp.)*

---

## 4. Worked example B — Already-Local

**Batch:** `SHP-DEMO-LOCAL`  
**Paperwork source:** Clearing agent invoice CA-778; shipper freight note FR-221  
**Shipping (local):** `3000.00 ZMW`  
**Duty total (manual batch):** `900.00 ZMW`  
**VAT total (manual batch):** `1200.00 ZMW`  
**Allocation method selected:** quantity  
**Profit margin:** 25%

### Items (already local unit product costs)

| Item | Qty | Weight kg (info only) | Local unit product |
|---|---:|---:|---:|
| A Fan | 10 | 50 total | 500.00 |
| B Blender | 5 | 15 total | 750.00 |
| C Kettle | 10 | 15 total | 250.00 |
| **Total qty** | **25** | | |

### Product lines

| Item | Product line |
|---|---:|
| A | 5000.00 |
| B | 3750.00 |
| C | 2500.00 |
| **Total** | **11250.00** |

### Allocate shipping / duty / VAT by quantity

| Item | Qty share | Ship share | Duty share | VAT share |
|---|---:|---:|---:|---:|
| A | 10/25 | 1200.00 | 360.00 | 480.00 |
| B | 5/25 | 600.00 | 180.00 | 240.00 |
| C | 10/25 | 1200.00 | 360.00 | 480.00 |

### Landed + suggested (25%)

| Item | Line landed | Unit landed | Suggested RP |
|---|---:|---:|---:|
| A | 5000+1200+360+480 = **7040.00** | **704.00** | **880.00** |
| B | 3750+600+180+240 = **4770.00** | **954.00** | **1192.50** |
| C | 2500+1200+360+480 = **4540.00** | **454.00** | **567.50** |

---

## 5. Margin-Guard mini example

Suppose item A from Example B is accepted at **880.00**.  
Later, a reference recompute raises unit landed cost to **820.00** with safety margin 10%:

```text
Floor = 820.00 × 1.10 = 902.00
Active RP 880.00 < 902.00 → RAISE ALERT
```

---

## 6. Unit-test seeds (copy into Week 1 tests)

Use Example A (weight path) and Example B (quantity path) as oracle fixtures.  
Assert each `LandedUnitCost` and `SuggestedRP` within `0.01`.
