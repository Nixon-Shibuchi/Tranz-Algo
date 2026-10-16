# Scenario 03 — Allocation comparator (quantity vs weight)

**Purpose:** Show that method choice changes unit landed cost (viva talking point).  
**Base batch:** Demo A `SHP-DEMO-LOCAL-ZMW` (shipping 5000, duty 1000, VAT 1500).  
**Weights:** from product defaults × qty after CSV import (RICE 100, SUGAR 30, OIL 20, TEA 12, SOAP 1.92 → **163.92 kg**).

## Spreadsheet — quantity (selected in Scenario 01)

| SKU | Landed unit |
|---|---:|
| RICE-5 | 170.00 |
| SUGAR-1 | 107.00 |
| OIL-2L | 160.00 |
| TEA-500 | 120.00 |
| SOAP-BAR | 93.00 |

## Spreadsheet — weight (same costs; product default weights)

| SKU | W share | Ship | Duty | VAT | Landed unit |
|---|---:|---:|---:|---:|---:|
| RICE-5 | 100/163.92 | 3050.27 | 610.05 | 915.08 | **323.77** |
| SUGAR-1 | 30/163.92 | 915.08 | 183.02 | 274.52 | **77.75** |
| OIL-2L | 20/163.92 | 610.05 | 122.01 | 183.02 | **176.51** |
| TEA-500 | 12/163.92 | 366.03 | 73.21 | 109.81 | **67.88** |
| SOAP-BAR | 1.92/163.92 | 58.57 | 11.71 | 17.57 | **23.49** |

## Observation

| SKU | Qty landed | Weight landed | Δ |
|---|---:|---:|---:|
| RICE-5 | 170.00 | 323.77 | +153.77 |
| SUGAR-1 | 107.00 | 77.75 | −29.25 |
| OIL-2L | 160.00 | 176.51 | +16.51 |
| TEA-500 | 120.00 | 67.88 | −52.12 |
| SOAP-BAR | 93.00 | 23.49 | −69.51 |

Heavy lines (rice) absorb more under weight allocation; light lines (soap/tea) get cheaper.

**Pass criterion:** True Cost comparison / re-allocate with the other method matches spreadsheet within 0.01.
