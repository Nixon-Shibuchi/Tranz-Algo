# Scenario 03 — Allocation comparator (quantity vs weight)

**Purpose:** Show that method choice changes unit landed cost (viva talking point).  
**Base batch:** Scenario 01 inputs (Already-Local, shipping 3000, duty 900, VAT 1200).

## Spreadsheet — quantity (selected in Scenario 01)

| SKU | Landed unit |
|---|---:|
| FAN-A | 704.00 |
| BLD-B | 954.00 |
| KTL-C | 454.00 |

## Spreadsheet — weight (same costs; weights 50 / 15 / 15 = 80)

Ship/duty/VAT shares by weight:

| SKU | W share | Ship | Duty | VAT | Product line | Landed unit |
|---|---:|---:|---:|---:|---:|---:|
| FAN-A | 50/80 | 1875.00 | 562.50 | 750.00 | 5000.00 | **(5000+1875+562.50+750)/10 = 818.75** |
| BLD-B | 15/80 | 562.50 | 168.75 | 225.00 | 3750.00 | **(3750+562.50+168.75+225)/5 = 941.25** |
| KTL-C | 15/80 | 562.50 | 168.75 | 225.00 | 2500.00 | **(2500+562.50+168.75+225)/10 = 345.625 → 345.63** |

## Observation

| SKU | Qty landed | Weight landed | Δ |
|---|---:|---:|---:|
| FAN-A | 704.00 | 818.75 | +114.75 |
| BLD-B | 954.00 | 941.25 | −12.75 |
| KTL-C | 454.00 | 345.63 | −108.37 |

**Pass criterion:** App comparison line / re-allocate with the other method matches spreadsheet within 0.01.
