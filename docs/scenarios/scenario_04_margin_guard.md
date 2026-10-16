# Scenario 04 — Safety floor (on True Cost pricing)

**Purpose:** Show the margin safety floor while setting retail on True Cost.  
**Demo batch:** `SHP-DEMO-LOCAL-ZMW` after Scenario 01 allocate (quantity).  
**UI:** No post-commit recheck. Floor = `landed × (1 + safety)` (default safety **10%**).

## Live app behaviour

1. Import Demo A → True Cost → allocate **quantity**.  
2. Drag profit margin **below 10%** → warning; red floor mark sits past suggested retail.  
3. Or **Enter prices manually** and type a retail below the listed floor → “below floor” on that line.  
4. Save / commit still allowed; confirm dialog notes the floor risk.  
5. After commit, use **Cost history**.

## Floors on Demo A (quantity landed)

| SKU | Landed unit | Floor (×1.10) | Suggested @30% |
|---|---:|---:|---:|
| RICE-5 | 170.00 | **187.00** | 221.00 |
| SUGAR-1 | 107.00 | **117.70** | 139.10 |
| OIL-2L | 160.00 | **176.00** | 208.00 |
| TEA-500 | 120.00 | **132.00** | 156.00 |
| SOAP-BAR | 93.00 | **102.30** | 120.90 |

At **30%** margin, all suggested prices are above floor. Drag to **5%** → every line is below floor.

## Formula check (viva)

```text
Floor = LandedUnit × (1 + 0.10)
Example: RICE-5 → 170.00 × 1.10 = 187.00
```

## Pass criterion

Floor arithmetic matches within 0.01; True Cost flags prices below floor while adjusting margin/manual retail.
