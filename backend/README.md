# Tranz-Algo backend

FastAPI API for landed-cost inventory orchestration (working MVP).

**Product workflow:** root [`README.md`](../README.md)  
**Endpoint list:** [`docs/design/api_endpoints.md`](../docs/design/api_endpoints.md)

## What’s implemented

- Auth (JWT), products, tax profiles, shipments (costs, allocate, suggest, commit, ledger)
- FX (Frankfurter + fallback + manual), Margin-Guard recheck
- Inventory list + **Record sale**, admin reset-business-data
- Costing tests for worked examples

## Setup

```powershell
cd backend
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

> Prefer Python **3.11–3.13** on Windows.

Open docs: http://127.0.0.1:8000/docs

## Tests

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest -q
```

Default DB is SQLite (`tranzalgo.db`). For Postgres/Supabase, set `DATABASE_URL` in `.env`.
