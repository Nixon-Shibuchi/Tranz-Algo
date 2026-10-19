# Evaluation note — App vs spreadsheet oracle

**Project:** Tranz-Algo  
**Updated:** 2026-10-15  
**Scope:** Demo shipments `SHP-DEMO-LOCAL-ZMW` + `SHP-DEMO-AUTO-FX` (CSV samples + handout)

## Method

1. Freeze demo inputs in `samples/shipment_A_full.csv` and `samples/shipment_B_full.csv`.  
2. Encode the same oracles as pytest fixtures in `backend/tests/test_costing.py`.  
3. Replay in the app via Scenario 05 (CSV import → True Cost → commit).

Tolerance: absolute difference ≤ **0.01** ZMW.

## Results

| Scenario | Check | Result |
|---|---|---|
| 01 Already-Local qty | Landed 170 / 107 / 160 / 120 / 93; RP @30% 221 / 139.10 / 208 / 156 / 120.90 | **PASS** (`pytest`) |
| 02 Auto FX weight | @20 landed 136.25 / 145 / 46.25 / 92.50; EARBUD RP 170.31 | **PASS** (`pytest`) |
| 03 Comparator | Demo A qty vs weight deltas (rice ↑, soap/tea ↓) | **PASS** (manual arithmetic; UI compare) |
| 04 Safety floor | RICE floor 187; margin&lt;10% warns on True Cost | **PASS** (formula + pricing-time UI) |
| 05 UI demos | Same batches via CSV import path | **PASS** (hand-checked vs samples) |

## Interpretation

- Dual modes are evidenced by Scenario 01 (Already-Local) and Scenario 02 (Auto FX).  
- Allocation sensitivity is evidenced by Scenario 03 on Demo A.  
- Safety floor is evidenced by Scenario 04 on True Cost (no recheck button).  
- Classroom path is Scenario 05 using the same demo CSVs/handout.

## Limitations

- Full UI click-through should be re-confirmed before viva on a clean database (**Start fresh** / **Clear drafts**).  
- Value-based allocation remains stretch.  
- Live FX rates vary; Scenario 02 uses fixed **20** (UI starter / CSV) for reproducibility.

## Conclusion

Against the demo-shipment spreadsheet baseline, Tranz-Algo’s core true-cost and suggestion calculations are accurate within the agreed tolerance.
