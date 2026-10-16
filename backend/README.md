# Tranz-Algo backend

FastAPI API for landed-cost inventory orchestration (working MVP).

**Product workflow:** root [`README.md`](../README.md)  
**Endpoint list:** [`docs/design/api_endpoints.md`](../docs/design/api_endpoints.md)

## What’s implemented

- Auth (JWT), products, shipments (costs, allocate, suggest, commit, ledger)
- FX (Frankfurter + fallback + manual); optional safety-floor API (UI uses Cost history)
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

## Database (PostgreSQL)

**Recommended:** Postgres via Docker Compose (repo root):

```powershell
cd ..
docker compose up -d
```

Then in `backend/.env`:

```text
DATABASE_URL=postgresql+psycopg://tranzalgo:tranzalgo@127.0.0.1:5432/tranzalgo
```

Restart uvicorn. On first startup the API runs `create_all` and creates all tables.

- `postgres://…` and `postgresql://…` URLs are normalized to `postgresql+psycopg://…`
- SQLite fallback: `DATABASE_URL=sqlite:///./tranzalgo.db` (no Docker needed)
- Local Windows Postgres works with the same URL if you create user/db `tranzalgo` / password `tranzalgo`

## Tests

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest -q
```

