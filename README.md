# Tranz-Algo

**Explainable landed-cost inventory orchestration with Margin-Guard price suggestion for import-dependent SMEs.**

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

## How to use the app

In-app screens stay focused on data and actions. This section is the full how-to.

Paperwork lives on **Shipments**. Allocation, suggested retail, and commit live on **True Cost** — the top-level costing studio.

### First visit

1. Open the app. A skippable **Welcome to Tranz-Algo** carousel explains true cost, cost modes, Margin-Guard, and the ledger. It is shown once (stored in the browser); **Skip** or **Get started** goes to sign-in.
2. **Register** an admin, then **sign in**. There is no shared demo password — each machine creates its own account.
3. After sign-in, a sidebar (drawer on mobile) is the main navigation. Colour modes **Day / Night / Sienna** sit in the top bar (not on the sign-in screen).

### Main screens

| Screen | What you do |
|---|---|
| **Welcome** | First-visit intro carousel (skippable). Not shown again once dismissed. |
| **True Cost** | Featured tab. Pick a batch, allocate shipping/duty/VAT, set margin, accept or override suggested retail, then **commit**. |
| **Dashboard** | Overview of units available, low/out stock, draft vs committed shipments. **Start fresh** clears business data (type `RESET`). |
| **Products** | Catalogue CRUD (SKU + name required). Optional: weight, reorder level, category, tax profile (under extra fields). |
| **Shipments** | Create a batch, open it, or delete non-committed batches. |
| **Shipment detail** | Add lines and **save costs** (FX, shipping, duty, VAT, paperwork source). Then **Open True Cost**. After commit: view ledger and **Margin-Guard** recheck. |
| **Stock** | Available / low / out board. **Record sale** / **Sell** reduces units (not a full POS). Qty rises on **commit**. Low = at or below reorder level. |
| **Tax profiles** | Optional duty/VAT % templates. You can still paste duty/VAT totals on a shipment from clearing paperwork. |

### Day-to-day workflow

1. **Add products** (SKU, name; set default weight if using weight allocation).
2. **Create a shipment** and choose a primary cost mode:
   - **Already-Local** — paste local amounts from shipper/agent (easiest demo).
   - **Auto FX** — foreign unit prices + exchange rate (Fetch FX or manual).
   - **Mixed** — combine modes per line.
3. On **shipment detail**, **add items** (qty, local or foreign unit cost) and **save costs** — shipping total, optional duty/VAT totals, paperwork source.
4. Open **True Cost** (sidebar, dashboard, or **Open True Cost** on the shipment). If several batches exist, pick one from the batch rail.
5. **Run allocation** (quantity or weight) — see the cost waterfall per unit, plus a comparison if you used the other method.
6. **Set profit margin** (e.g. `0.30` = 30%) and **suggest prices**, or **enter prices manually**. True Cost shows projected revenue/profit and the **Margin-Guard floor**.
7. **Commit batch** — locks the shipment, writes the True-Cost Ledger, increases stock, applies retail prices. Suggested retail is based on **this batch’s** landed cost × margin (it does not blend older batches or sales history). Committing a new batch for the same product overwrites that product’s active retail price.
8. Check **Stock**. Use **Record sale** / **Sell** when units leave the shelf (reduces stock; not a full POS).
9. Run **Margin-Guard** from shipment detail as needed (recheck against current landed cost and retail).

### Shipment statuses

| Status | Meaning |
|---|---|
| **draft** | Editable; stock and retail not applied yet. |
| **costed** | Allocation (and usually suggestions) done; can still adjust before lock. |
| **committed** | Read-only; ledger written, stock increased, retail applied. |

### Demo path (Already-Local)

Example numbers used in testing (enter lines and costs on the shipment, then allocate/price/commit in **True Cost**):

- Products: FAN-001 (5 kg), BLD-002 (3 kg), KTL-003 (1.5 kg)
- Lines: 10×520, 5×780, 10×260
- Costs: shipping 4500, duty 1200, VAT 1800
- Allocate by **quantity**, margin **0.30**

Expected landed units ≈ 820 / 1080 / 560; suggested retail ≈ 1066 / 1404 / 728.

---

## How taxes and cost modes work

### When to use it

| Timing | Useful? | Why |
|---|---|---|
| Before buying / booking a shipper | Limited | Rough what-if only if you estimate costs |
| After invoices/paperwork exist | **Primary** | True landed cost needs real figures |
| After prices are set | Yes | Margin-Guard + inventory/batch reporting |

### How taxes are handled

The app **does not** call a live ZRA/customs assessment API.

Taxes come from:

1. **Already-Local paperwork** — duty/VAT totals from clearing/shipping documents.
2. **Configurable duty/VAT profiles** — admin-defined templates.
3. **Manual override** — exact amounts on a batch when needed.

Tranz-Algo **stores, applies, allocates, and explains** tax costs. It does **not** legally assess customs.

### Dual cost-entry modes

| Mode | Input | FX API? | Best when |
|---|---|---|---|
| **Auto FX** | Foreign product prices | Yes (cache/manual fallback) | Supplier invoice still in USD/CNY/etc. |
| **Already-Local** | Local amounts from shipper/agent | Not required for those fields | Freight/duty already converted |

Mixed paperwork is supported (e.g. Auto FX on supplier lines + Already-Local on freight/duty).

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

**Margin-Guard (concept)**

If active retail price falls below recomputed landed cost × (1 + safety margin), raise an alert.

---

## What is in scope vs out of scope

### In scope

- Web admin dashboard (React)
- Auth (JWT register/login)
- Product + shipment-batch inventory
- Dual cost-entry modes (Auto FX / Already-Local / mixed)
- Landed-cost engine + allocation comparator (quantity + weight)
- Price suggestion + auto/manual accept before commit
- True-Cost Ledger / audit trail
- Stock board (available / low / out) + **simple Record sale** (stock-out only)
- Margin-Guard recheck
- Admin **Start fresh** (clear business data)
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
| Database | **SQLite** (default) | Zero-setup local MVP; demo-ready |
| Database (optional) | PostgreSQL / Supabase | Set `DATABASE_URL` for deploy |
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
- Supabase account (optional) **or** local PostgreSQL **or** SQLite for local MVP (**default**)
- Internet access for FX API in Auto FX mode (Already-Local can work offline for conversion)

**Hardware**

- A laptop for development and presentation
- Optional smartphone only if building the Expo stretch goal

**Accounts / keys (free)**

- Optional Supabase/Postgres URL (SQLite works out of the box)
- No paid FX key required (Frankfurter + open.er-api.com fallback; manual rate always available)
- Optional: free hosting later for demo (not required for viva if run locally)

---

## Current implementation status

Working local MVP (FastAPI + React + SQLite):

- Welcome carousel (first visit), JWT auth, colour modes (Day / Night / Sienna)
- Products, tax profiles, shipments (items + costs on shipment detail)
- **True Cost** studio: allocate, suggest or override retail, commit, ledger
- Dual cost modes + FX fetch/cache/manual
- Stock board + Record sale
- Margin-Guard recheck, dashboard, Start fresh
- Confirm dialogs on create/update/delete and costing actions
- Costing unit tests (`backend/tests/test_costing.py`)

Still open for viva prep: demo script practice, optional seed script, GitHub push/tag. Literature + evaluation pack are written.

---

## Getting started


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
- First load opens the **Welcome** carousel; skip or finish it to reach sign-in.

### Quick demo path

See **How to use the app** above (workflow + demo numbers).

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
│   └── src/pages/           # welcome, login, true-cost, dashboard, products, shipments, stock, tax
├── docs/
│   ├── design/              # ERD, API, formulas, wireframes
│   └── literature/          # sources + gap statement
├── README.md
└── THREE_WEEK_PLAN.md
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
- [x] Margin-Guard recheck + dashboard summary
- [x] Spreadsheet baseline evaluation pack (`docs/scenarios/`)
- [ ] One-click demo seed script (register via UI / Start fresh for now)

### Stretch goals

- Value-based allocation polished in UI
- Scheduled Margin-Guard FX re-check / alert centre
- CSV invoice import
- Expo mobile companion
- Duty/VAT profile presets for common local categories

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
| **Simple markup calculators / Excel** | One formula, manual and easy to mess up | Automates calculation, compares allocation methods, keeps an audit trail, and guards margins when FX moves |
| **Typical final-year inventory projects** | CRUD products + users + basic reports | Adds dual cost-entry modes, allocation comparator, True-Cost Ledger, Margin-Guard, and evaluation vs spreadsheet baseline |

### Unique features (the real difference)

1. **Shipment-batch-first design**  
   The import invoice/batch is the unit of truth. Shared freight and tax are allocated down to items, not ignored.

2. **Dual cost-entry modes**  
   - **Auto FX** when supplier prices are still foreign  
   - **Already-Local** when shippers/agents already converted amounts  
   Most similar apps force one workflow; Tranz-Algo matches real mixed paperwork.

3. **Allocation Comparator**  
   Users can compare weight vs quantity (and later value) allocation and see how each choice changes unit cost and suggested price — not one hidden formula.

4. **True-Cost Ledger**  
   Every suggested price can be traced to inputs, entry mode, FX rate or paperwork source, and allocation method. Good for trust, debugging, and viva demonstration.

5. **Margin-Guard**  
   Beyond `price = cost × (1 + margin)`, the system can warn when later FX movement erodes the safety margin.

6. **Taxes without a paid customs API**  
   Duty/VAT come from clearing paperwork, configurable profiles, and manual entry — practical and free, while still part of landed cost.

7. **Evidence-based uniqueness**  
   The project is evaluated against a spreadsheet baseline (accuracy, time-to-price, margin protection), not just claimed as “better inventory.”

### One-line pitch

Most similar apps manage **selling** or **stock counts**.  
Tranz-Algo answers: *“What did this imported item actually cost me, what should I sell it for, and is that price still safe when rates or paperwork change?”*

---

## Academic / project docs

- Original proposal: `tranzalgo proposal.docx`
- Improved plan: `Tranz-Algo Improved Final Year Project Plan.docx`
- Work plan (collaborative notes): `Tranz-Algo Work plan V1.0.docx`
- Next 3 weeks plan: `THREE_WEEK_PLAN.md`
- Week 1 literature: `docs/literature/sources.md`, `docs/literature/gap_statement.md`
- Related work: `docs/literature/related_work_draft.md`, `docs/literature/related_work_v1.md`
- Evaluation scenarios: `docs/scenarios/` (see `eval_note.md`)
- Design artefacts: `docs/design/` — see `docs/design/README.md`

---

## Licence / status

Final-year project prototype (University of Zambia — Computing and Informatics).  
Build status: **working MVP** (local FastAPI + React + SQLite). Evaluation pack and literature Week 2–3 drafts still in progress.
