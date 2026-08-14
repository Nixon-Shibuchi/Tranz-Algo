# Evaluation note — App vs spreadsheet oracle

**Project:** Tranz-Algo  
**Date:** 2026-08-11  
**Scope:** Core landed-cost + suggestion formulas (Week 3 evaluation pack)

## Method

1. Freeze formulas from `docs/design/cost_modes_and_formulas.md`.  
2. Build spreadsheet oracles for Already-Local (qty) and Auto FX (weight).  
3. Encode the same oracles as pytest fixtures in `backend/tests/test_costing.py`.  
4. Provide UI replay scripts in `docs/scenarios/`.

Tolerance: absolute difference ≤ **0.01** ZMW.

## Results (engine / automated)

| Scenario | Check | Result |
|---|---|---|
| 01 Already-Local qty | Landed 704 / 954 / 454; RP 880 / 1192.50 / 567.50 | **PASS** (`pytest`) |
| 02 Auto FX weight | Landed 1026.54 / 1236.06 / 445.77; FAN RP 1334.50 | **PASS** (`pytest`) |
| 03 Comparator | Qty vs weight deltas as tabulated | **PASS** (manual arithmetic; UI shows comparison) |
| 04 Margin-Guard | Floor 820 × 1.10 = 902; 880 triggers alert logic | **PASS** (formula) |
| 05 UI demo | Landed 820 / 1080 / 560; RP 1066 / 1404 / 728 | **PASS** (matches prior API E2E + design) |

## Interpretation

- The costing engine reproduces the design-freeze spreadsheet examples.  
- Dual modes are evidenced by Scenario 01 (Already-Local) and Scenario 02 (Auto FX).  
- Allocation sensitivity is evidenced by Scenario 03.  
- Margin-Guard floor arithmetic is evidenced by Scenario 04.  
- The classroom/demo path is evidenced by Scenario 05.

## Limitations

- Full UI click-through for every scenario should be re-confirmed before viva on a clean database.  
- Value-based allocation remains stretch (not in this eval pack).  
- Live FX API rates vary; Scenario 02 uses a **fixed** rate 27.00 for reproducibility.

## Conclusion

Against the spreadsheet baseline, Tranz-Algo’s core true-cost and suggestion calculations are accurate within the agreed tolerance for the evaluated scenarios.
