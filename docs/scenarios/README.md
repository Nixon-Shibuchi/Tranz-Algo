# Evaluation scenarios — Tranz-Algo

**Status:** Complete · **Updated:** 2026-10-15  

All scenarios use the **latest demo shipments** (`SHP-DEMO-LOCAL-ZMW` / `SHP-DEMO-AUTO-FX`) from `samples/`.  
Tolerance: **≤ 0.01 ZMW** on money fields.

| # | File | Batch | Allocation | Purpose |
|---|---|---|---|---|
| 1 | [scenario_01_already_local.md](./scenario_01_already_local.md) | `SHP-DEMO-LOCAL-ZMW` | Quantity | Already-Local oracle |
| 2 | [scenario_02_auto_fx.md](./scenario_02_auto_fx.md) | `SHP-DEMO-AUTO-FX` | Weight | Auto FX oracle (@20) |
| 3 | [scenario_03_allocation_compare.md](./scenario_03_allocation_compare.md) | Demo A | Qty vs weight | Comparator sensitivity |
| 4 | [scenario_04_margin_guard.md](./scenario_04_margin_guard.md) | Demo A | — | Safety floor on True Cost |
| 5 | [scenario_05_ui_demo_batch.md](./scenario_05_ui_demo_batch.md) | A + B | Qty + weight | Classroom UI path |
| — | [samples/](./samples/) | — | — | `products_demo.csv`, full + line CSVs |
| — | [eval_note.md](./eval_note.md) | — | — | Summary vs app/tests |

**How to use the app / viva handouts:** [`../viva/`](../viva/) (Word docs — How to Use, Demo Data, Presentation Guide, Q&A).

## How to evaluate

1. Import products + the matching full-shipment CSV (or use the handout tables).  
2. True Cost → allocate → suggest (same method/margin).  
3. Record app outputs in the scenario results table.  
4. Mark **PASS** if every money field differs by at most `0.01`.

Automated check for scenarios 1–2:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest -q tests/test_costing.py
```
