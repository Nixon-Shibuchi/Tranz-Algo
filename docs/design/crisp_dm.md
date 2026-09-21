# CRISP-DM process mapping — Tranz-Algo

Tranz-Algo follows the **CRISP-DM** (Cross-Industry Standard Process for Data Mining) lifecycle as the **project process**, adapted for an explainable **analytical costing / pricing** system rather than a black-box ML classifier. The “model” here is the landed-cost and Margin-Guard formula set, not a trained neural network.

CRISP-DM is **iterative**: evaluation findings feed back into business understanding and data preparation (e.g. dual cost modes after discovering mixed paperwork).

```text
Business Understanding
        ↓
Data Understanding
        ↓
Data Preparation
        ↓
Modeling  ←──────────────┐
        ↓                │
Evaluation ──────────────┘
        ↓
Deployment
```

---

## 1. Business Understanding

**Goal:** Help import-dependent SMEs recover **per-item true (landed) cost**, suggest safe retail prices, and keep stock by shipment batch—without replacing POS, shippers, or clearing agents.

**Success criteria (project):**
- Dual cost-entry modes (Already-Local + Auto FX, including mixed batches)
- Transparent allocation (quantity / weight) with optional comparison
- Auditable True-Cost Ledger on commit
- Margin-Guard floor alerts when retail drifts below safety margin
- Formula results match spreadsheet oracles within **0.01 ZMW**

**Artefacts:** root `README.md`, `docs/literature/gap_statement.md`, problem framing in design docs.

---

## 2. Data Understanding

**What data the decision depends on:**

| Source | Examples | Role |
|---|---|---|
| Product catalogue | SKU, weight, reorder level, tax profile | Allocation basis & stock |
| Shipment batch | Reference, FX rate, shipping/duty/VAT totals, paperwork source | Shared charges |
| Batch lines | Qty, foreign/local unit cost, line cost mode | Product cost component |
| Tax profiles | Duty/VAT % templates | Fallback when batch tax totals absent |
| FX feeds / manual rate | Frankfurter, open.er-api, cache, manual | Auto FX conversion |
| Ledger / sales | Commit events, margin alerts, stock reductions | Audit & inventory loop |

**Quality issues acknowledged up front:** mixed currency paperwork, missing weights, delayed duty/VAT totals, volatile FX—hence dual modes, manual FX override, and batch tax paste.

**Artefacts:** `docs/design/erd.md`, `api_endpoints.md`, scenario inputs in `docs/scenarios/`.

---

## 3. Data Preparation

**Transforms applied before / during costing:**

1. Normalise line product cost via **line cost mode** (`already_local` vs `auto_fx`).
2. Convert foreign prices with batch `exchange_rate` when needed.
3. Build allocation **basis** (quantity, weight, or value) and proportional **shares** for shipping/duty/VAT.
4. Prefer **batch duty/VAT totals** from clearing paperwork when present; else profile rates.
5. Round money to 2 dp with remainder correction on the last line (exact sum).

Implemented mainly in `backend/app/services/costing.py` and strategies under `services/strategies/`, with UI capture on Shipments / True Cost.

---

## 4. Modeling

Analytical models (rule-based / formula), selected via **Strategy** so methods stay interchangeable:

| Model | Purpose | Where |
|---|---|---|
| Landed-cost allocator | Split shared charges → unit landed cost | `compute_landed_for_method` + allocation strategies |
| Line cost modes | Local vs FX unit product cost | line-cost strategies |
| Price suggestion | `landed × (1 + profit_margin)` | `suggest_prices` |
| Margin-Guard | Floor `landed × (1 + safety_margin)` vs active retail | `margin_guard_alert` |
| FX retrieval | Live rate with provider fallback + cache | FX provider chain |

Design freeze of formulas: `docs/design/cost_modes_and_formulas.md`.

---

## 5. Evaluation

**How we know the model is fit for purpose:**

| Method | Evidence |
|---|---|
| Spreadsheet oracle | Worked examples A/B frozen in design docs |
| Automated tests | `backend/tests/test_costing.py` (pytest) |
| Scenario scripts | `docs/scenarios/scenario_01` … `05` |
| Eval write-up | `docs/scenarios/eval_note.md` |

**Pass rule:** absolute difference ≤ **0.01 ZMW** vs oracle.  
**Feedback:** failures or UI gaps loop back to preparation (e.g. weight validation) or business scope (value allocation = stretch).

---

## 6. Deployment

**Delivered MVP:**
- Backend: FastAPI + SQLAlchemy + SQLite (optional Postgres), JWT auth
- Frontend: React (Vite) admin — Welcome → Shipments → True Cost → Stock
- Ops: local run via README; OpenAPI at `/docs`
- Persistence of decisions: commit writes ledger + stock + retail; Margin-Guard can recheck later

**Monitoring / maintenance (lightweight):** health endpoint, FX last-known-good cache, “Start fresh” admin reset for demos—not a full MLOps stack, appropriate to the MVP.

---

## Phase ↔ repository map

| CRISP-DM phase | Primary project locations |
|---|---|
| Business Understanding | `README.md`, `docs/literature/` |
| Data Understanding | `docs/design/erd.md`, `api_endpoints.md`, models |
| Data Preparation | Shipments UI, `costing` / strategies, cost modes |
| Modeling | `services/costing.py`, `shipment_workflow.py`, FX chain |
| Evaluation | `tests/`, `docs/scenarios/` |
| Deployment | `backend/`, `frontend/`, run instructions in README |

---

## Relation to patterns & Lehman

- **CRISP-DM** = *how the project was planned, built, and checked* (process).
- **GoF / GRASP** = *how the code is structured* so Modeling and Preparation stay extensible.
- **Lehman’s laws** = *why* that structure matters as the system keeps changing after Deployment.

See also: [software_engineering_principles.md](./software_engineering_principles.md).
