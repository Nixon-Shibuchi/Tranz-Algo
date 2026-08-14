# Evaluation scenarios — Tranz-Algo

Spreadsheet-oracle pack for Week 3 evaluation. Each scenario lists **inputs**, **spreadsheet expected outputs**, and **how to replay in the app**. Tolerance: **≤ 0.01 ZMW** on money fields (matches `backend/tests/test_costing.py`).

| # | File | Mode | Allocation | Purpose |
|---|---|---|---|---|
| 1 | [scenario_01_already_local.md](./scenario_01_already_local.md) | Already-Local | Quantity | Design Example B |
| 2 | [scenario_02_auto_fx.md](./scenario_02_auto_fx.md) | Auto FX | Weight | Design Example A |
| 3 | [scenario_03_allocation_compare.md](./scenario_03_allocation_compare.md) | Already-Local | Qty vs weight | Comparator sensitivity |
| 4 | [scenario_04_margin_guard.md](./scenario_04_margin_guard.md) | — | — | Alert floor check |
| 5 | [scenario_05_ui_demo_batch.md](./scenario_05_ui_demo_batch.md) | Already-Local | Quantity | Live demo numbers (FAN/BLD/KTL) |
| — | [eval_note.md](./eval_note.md) | — | — | Summary vs app/tests |

## How to evaluate

1. Recreate the scenario in Excel (or use the tables below as the oracle).  
2. Enter the same data in Tranz-Algo.  
3. Run allocate → suggest (same method/margin).  
4. Record app outputs in the scenario’s results table.  
5. Mark **PASS** if every money field differs by at most `0.01`.

Automated check for scenarios 1–2:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest -q tests/test_costing.py
```
