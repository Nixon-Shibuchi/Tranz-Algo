# Tranz-Algo

**Explainable landed-cost inventory orchestration with dual cost modes and auditable price suggestion for import-dependent SMEs.**

Tranz-Algo helps retailers who import goods in shipment batches recover the **true cost** of each item, suggest safe retail prices, and track inventory — without replacing POS, shipping companies, or clearing agents.

---

## What problem it solves

Import SMEs often lose money because:

1. Bulk shipping and tax costs are shared across many items and hard to split fairly.
2. Supplier invoices may be in foreign currency while freight/duty arrives already in local currency.
3. Selling prices are set once and not rechecked when exchange rates move.
4. Spreadsheets are slow, opaque, and easy to get wrong.

Tranz-Algo turns import paperwork into **per-item landed cost → suggested retail price → stock by shipment batch**, with an auditable **True-Cost Ledger**.

---

## How to use the app & viva

Operator and viva guidance is in **Word documents** under [`docs/viva/`](docs/viva/):

| Document | Use for |
|---|---|
| [How to Use the App](docs/viva/Tranz-Algo_How_to_Use_the_App.docx) | Screens, workflow, start commands, CSV demo path |
| [Demo Shipment Data](docs/viva/Tranz-Algo_Demo_Shipment_Data.docx) | Printable Demo A/B numbers |
| [Presentation Training Guide](docs/viva/Tranz-Algo_Presentation_Training_Guide.docx) | Talk script + rehearsal |
| [Technology Justification & Viva Q&A](docs/viva/Tranz-Algo_Technology_Justification_and_Viva_QA.docx) | Panel questions |

CSV samples: [`docs/scenarios/samples/`](docs/scenarios/samples/). Regenerate docs: `python docs/viva/build_viva_docs.py`.

**Quick demo:** Import `products_demo.csv` → `shipment_A_full.csv` / `shipment_B_full.csv` → True Cost → allocate → commit.  
References: `SHP-DEMO-LOCAL-ZMW` (qty, margin 0.30) and `SHP-DEMO-AUTO-FX` (weight; FX rate **20** for the demo oracle — same as UI starter).

---

## How taxes and cost modes work

### When to use it

| Timing | Useful? | Why |
|---|---|---|
| Before buying / booking a shipper | Limited | Rough what-if only if you estimate costs |
| After invoices/paperwork exist | **Primary** | True landed cost needs real figures |
| After prices are set | Yes | Cost history + stock / batch reporting |

### How taxes are handled

The app **does not** call a live ZRA/customs assessment API.

Duty/VAT come from **clearing paperwork totals** pasted on the shipment. Tranz-Algo **stores, allocates, and explains** those costs. It does **not** legally assess customs.

### Dual cost-entry modes

| Mode | Input | FX API? | Best when |
|---|---|---|---|
| **Auto FX** | Foreign product prices | Yes (**Fetch FX** / cache / manual) | Supplier invoice still in USD/CNY/etc. |
| **Already-Local** | Local amounts from shipper/agent | Not required | Freight/duty already converted |

Primary mode is chosen when the shipment is created. Shipping/duty/VAT are still entered as local paperwork totals in both modes.

---

## Core formulas

**Auto FX landed cost**

```text
LandedCost = (ForeignPrice × ExchangeRate) + ShippingShare + Duty + ImportVAT
```

**Already-Local landed cost**

```text
LandedCost = LocalProductCost + ShippingShare + Duty + ImportVAT
```

**Price suggestion**

```text
SuggestedRetailPrice = LandedCost × (1 + ProfitMargin)
```

**Safety floor (on True Cost)**

`Floor = landed × (1 + safety margin)` (default 10%). While you drag profit margin or enter manual retail, the UI flags prices below the floor. There is no post-commit recheck — use **Cost history** after commit.

---

## What is in scope vs out of scope

### In scope

- Web admin dashboard (React)
- Auth (JWT register/login)
- Product + shipment-batch inventory
- Dual cost-entry modes (Auto FX / Already-Local)
- Landed-cost engine + allocation comparator (quantity + weight)
- Price suggestion + auto/manual accept before commit
- Cost history / True-Cost Ledger on commit
- Stock board (available / low / out) + **simple Record sale** (stock-out only)
- CSV import (products + full shipment)
- Admin **Start fresh** + **Clear drafts**
- Dashboard summary cards

### Out of scope

- Booking/tracking international transport
- Payment gateway / card processing
- Full POS checkout for customers (Record sale is stock-out only)
- Automated legal HS-code customs filing
- Paid trade/ERP platforms

---

## Technology stack (free-to-build)

| Layer | Technology | Why |
|---|---|---|
| Language | Python 3.11–3.13 | Numeric logic + APIs |
| Backend | FastAPI + Uvicorn | Fast, free, auto OpenAPI docs |
| Database | **PostgreSQL** (Docker Compose or local) | Real relational DB for demos / viva |
| Database (fallback) | SQLite | Zero-setup if Postgres is offline |
| Frontend | React (Vite) web admin | Tables, ledgers, demos |
| Optional mobile | React Native / Expo | Stretch goal |
| FX data | Frankfurter + open.er-api.com fallback | Auto FX; manual rate always available |
| Auth | JWT | Secure admin access |
| Testing | pytest | Formula verification |
| IDE | VS Code / Cursor | Free |

### What you need to run / build it

**Software**

- Git
- Python 3.11+ (recommended)
- Node.js LTS + npm
- VS Code (or similar)
- Docker Desktop (for `docker compose` Postgres) **or** a local PostgreSQL install
- SQLite still works as a fallback if Postgres is offline
- Internet access for FX API in Auto FX mode (Already-Local can work offline for conversion)

**Hardware**

- A laptop for development and presentation
- Optional smartphone only if building the Expo stretch goal

**Accounts / keys (free)**

- Postgres URL in `backend/.env` (see Getting started); SQLite works if you switch the URL back
- No paid FX key required (Frankfurter + open.er-api.com fallback; manual rate always available)
- Optional: free hosting later for demo (not required for viva if run locally)

---

## Current implementation status

Working local MVP (FastAPI + React + PostgreSQL, SQLite fallback):

- Welcome landing (first visit), JWT auth, colour modes (Day / Night / Sienna)
- Products, shipments (items + costs on shipment detail)
- **True Cost** studio: allocate, suggest or override retail, commit, ledger
- Dual cost modes + Fetch FX (Auto FX only) / cache / manual
- Stock board + Record sale; Cost history on committed shipments
- Dashboard, Start fresh, Clear drafts
- Confirm dialogs on create/update/delete and costing actions
- Costing unit tests (`backend/tests/test_costing.py`)

Still open for viva prep: demo script practice, optional seed script. Design, literature, and evaluation packs are complete under `docs/`.

---

## Getting started


### Database (PostgreSQL)

From the repo root (Docker):

```powershell
docker compose up -d
```

`backend/.env.example` already points at:

```text
DATABASE_URL=postgresql+psycopg://tranzalgo:tranzalgo@127.0.0.1:5432/tranzalgo
```

Copy it to `backend/.env` if needed. Tables are created automatically when the API starts.

### Backend

```powershell
cd backend
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

> Use **Python 3.11–3.13** (not 3.14 yet) so FastAPI/pydantic wheels install cleanly on Windows.

- API docs: http://127.0.0.1:8000/docs  
- First-time: use **Register** on the login page (or `POST /api/v1/auth/register`)

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

- App: http://127.0.0.1:5173  
- First load opens the **Welcome** screen; continue with Get started or Sign in.

### Quick demo path

See [`docs/viva/`](docs/viva/) (How to Use the App + Demo Shipment Data).

### Tests

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest -q
```

---

## Project structure

```text
Tranz-Algo/
├── docker-compose.yml       # Postgres 16 (docker compose up -d)
├── backend/                 # FastAPI app
│   ├── app/
│   │   ├── api/v1/          # auth, products, shipments, fx, inventory/sales, admin
│   │   ├── core/            # config, security
│   │   ├── models/          # DB models (incl. sales)
│   │   ├── schemas/
│   │   ├── services/        # costing, FX
│   │   └── main.py
│   ├── tests/
│   └── requirements.txt
├── frontend/                # React (Vite) admin
│   ├── public/              # logo assets
│   └── src/pages/           # welcome, login, true-cost, dashboard, products, shipments, stock
├── docs/
│   ├── design/              # architecture, ERD, API, formulas, wireframes, SE principles
│   ├── literature/          # sources, gap, related work (complete)
│   ├── scenarios/           # evaluation oracles
│   └── viva/                # justification + presentation Word guides
└── README.md
```

---

## MVP checklist

- [x] User authentication + admin dashboard
- [x] Products and shipment-batch inventory
- [x] Auto FX + Already-Local cost entry
- [x] Quantity + weight allocation + landed-cost calculation
- [x] Price suggestion with configurable margin (auto or manual accept)
- [x] True-Cost Ledger on commit
- [x] Stock board + simple Record sale
- [x] Dashboard summary + Cost history on commit
- [x] Spreadsheet baseline evaluation pack (`docs/scenarios/`)
- [x] CSV import — products catalogue + full shipment / lines
- [ ] One-click demo seed script (register via UI / Start fresh for now)

### Stretch goals

- Value-based allocation polished in UI
- Scheduled FX / margin alert centre
- Expo mobile companion

---

## How this differs from similar projects / apps

Many student and commercial systems already do inventory, POS, or basic markup pricing. Tranz-Algo keeps a **narrower niche** so it is useful and academically distinct: **explainable landed-cost recovery for import batches**, not a full shop or ERP clone.

### Quick comparison

| Similar project / app type | What it usually does | What Tranz-Algo does differently |
|---|---|---|
| **POS / retail shop apps** | Sell items, take payments, print receipts | Does **not** replace checkout; focuses on **true cost + price decisions**. Optional **Record sale** only reduces stock (no payments). |
| **Normal inventory apps** | Stock in/out counts, low-stock alerts | Tracks stock by **import shipment batch**, with cost history attached to that batch |
| **Shipping / logistics apps** | Book, track, and deliver goods | Does **not** ship anything; **uses** shipper/clearing invoices to split shared costs onto items |
| **Accounting / ERP (Odoo, SAP-like)** | Broad finance, HR, procurement, inventory | Narrow, free, SME-focused **decision support** for landed cost and pricing only |
| **Simple markup calculators / Excel** | One formula, manual and easy to mess up | Automates calculation, compares allocation methods, and keeps an audit trail |
| **Typical final-year inventory projects** | CRUD products + users + basic reports | Adds dual cost-entry modes, allocation comparator, Cost history / True-Cost Ledger, and evaluation vs spreadsheet baseline |

### Unique features (the real difference)

1. **Shipment-batch-first design**  
   The import invoice/batch is the unit of truth. Shared freight and tax are allocated down to items, not ignored.

2. **Dual cost-entry modes**  
   - **Auto FX** when supplier prices are still foreign  
   - **Already-Local** when shippers/agents already converted amounts  
   Most similar apps force one workflow; Tranz-Algo matches real mixed paperwork.

3. **Allocation Comparator**  
   Users can compare weight vs quantity (and later value) allocation and see how each choice changes unit cost and suggested price — not one hidden formula.

4. **Cost history / True-Cost Ledger**  
   After commit, When / What entries show how landed cost and retail were set (margin % or manual), plus paperwork source.

5. **Taxes without a paid customs API**  
   Duty/VAT come from clearing paperwork totals on the shipment — practical and free, while still part of landed cost.

6. **Evidence-based uniqueness**  
   The project is evaluated against a spreadsheet baseline (accuracy, time-to-price), not just claimed as “better inventory.”

### One-line pitch

Most similar apps manage **selling** or **stock counts**.  
Tranz-Algo answers: *“What did this imported item actually cost me, what should I sell it for, and is that price still safe when rates or paperwork change?”*

---

## Academic / project docs

- Original proposal: `tranzalgo proposal.docx`
- Presentation: `Tranz-Algo.pptx`
- Literature pack (complete): `docs/literature/` — start at `README.md`
- Design pack (complete): `docs/design/` — start at `README.md`
- Evaluation scenarios: `docs/scenarios/` (see `eval_note.md`)
- Viva / how-to Word guides: `docs/viva/` (How to Use, Demo Data, Presentation, Q&A)

---

## Licence / status

Final-year project prototype (University of Zambia — Computing and Informatics).  
Build status: **working MVP** (local FastAPI + React + PostgreSQL, SQLite fallback). Design, literature, and evaluation packs are complete.
