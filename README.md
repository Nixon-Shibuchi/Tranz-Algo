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

## How the app will work

### Typical flow (after goods/shipment costs are known)

1. **Admin signs in** to the web dashboard.
2. **Register products** (SKU, name, weight/qty attributes, optional tax profile).
3. **Create a shipment batch** and attach products received in that import.
4. **Choose a cost-entry mode** for the batch (or mix modes on one batch):
   - **Auto FX** — enter foreign supplier prices; the app converts using a free FX API (with cached/manual fallback).
   - **Already-Local** — paste amounts already converted by the shipper/clearing agent (no forced API conversion).
5. **Enter shared charges** — shipping invoice, customs duty, import VAT (from paperwork and/or tax profiles).
6. **Allocate shared costs** using the Allocation Comparator:
   - weight-based
   - quantity-based
   - value-based (stretch / later)
7. **Review landed cost per item** and the **True-Cost Ledger** (inputs, mode, rate/source, allocation method).
8. **Get a suggested retail price**:
   - `Suggested RP = Landed Cost × (1 + Profit Margin)`
9. **Accept / adjust the selling price**, then track stock against that batch.
10. **Margin-Guard** (where enabled) warns if FX movement later erodes the safety margin.

### When to use it

| Timing | Useful? | Why |
|---|---|---|
| Before buying / booking a shipper | Limited | Can do rough what-if only if you estimate costs |
| After invoices/paperwork exist | **Primary** | True landed cost needs real product, freight, duty/VAT figures |
| After prices are set | Yes | Margin-Guard + inventory/batch reporting |

### How taxes are handled

The app **does not** call a live ZRA/customs assessment API.

Taxes come from:

1. **Already-Local paperwork** — duty/VAT totals from the clearing/shipping documents.
2. **Configurable duty/VAT profiles** — admin-defined templates (e.g. category → duty % + VAT %).
3. **Manual override** — exact amounts typed per batch/item when needed.

Tranz-Algo **stores, applies, allocates, and explains** tax costs. It does **not** legally assess customs for the government.

### Dual cost-entry modes (important)

| Mode | Input | FX API? | Best when |
|---|---|---|---|
| **Auto FX** | Foreign product (and optionally freight) prices | Yes (with cache/manual fallback) | Supplier invoice is still in USD/CNY/etc. |
| **Already-Local** | Local amounts from shipper/agent/bank | Not required for those fields | Freight/duty already converted for you |

Mixed paperwork is supported (example: Auto FX on supplier lines + Already-Local on shipper freight/duty).

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

- Web admin dashboard
- Auth (JWT)
- Product + shipment-batch inventory
- Dual cost-entry modes
- Landed-cost engine + allocation comparator
- Price suggestion + Margin-Guard
- True-Cost Ledger / audit trail
- Basic inventory and financial summary reports
- Evaluation against a spreadsheet baseline

### Out of scope

- Booking/tracking international transport
- Payment gateway / card processing
- Full POS checkout for customers
- Automated legal HS-code customs filing
- Paid trade/ERP platforms

---

## Technology stack (free-to-build)

| Layer | Technology | Why |
|---|---|---|
| Language | Python 3 | Numeric logic + APIs |
| Backend | FastAPI + Uvicorn | Fast, free, auto OpenAPI docs |
| Database | PostgreSQL (Supabase free tier) | Relational data; free tier |
| Frontend | React (Vite) web admin | Best for tables, ledgers, demos |
| Optional mobile | React Native / Expo | Stretch goal for stock lookup |
| FX data | Frankfurter.app (or similar free FX API) | Auto FX mode; no paid FX licence |
| Auth | JWT | Secure admin access |
| Testing | pytest + scenario packs | Verify formulas |
| IDE | VS Code | Free |

### What you need to run / build it

**Software**

- Git
- Python 3.11+ (recommended)
- Node.js LTS + npm
- VS Code (or similar)
- Supabase account (free) **or** local PostgreSQL
- Internet access for FX API in Auto FX mode (Already-Local can work offline for conversion)

**Hardware**

- A laptop for development and presentation
- Optional smartphone only if building the Expo stretch goal

**Accounts / keys (free)**

- Supabase project URL + anon/service keys (or local DB URL)
- No paid FX key required if using Frankfurter-style open rates
- Optional: free hosting later for demo (not required for viva if run locally)

---

## Suggested project structure (planned)

```text
Tranz-Algo/
├── backend/                 # FastAPI app
│   ├── app/
│   │   ├── api/             # routes (auth, products, shipments, pricing)
│   │   ├── core/            # config, security, FX client
│   │   ├── models/          # DB models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # landed cost, allocation, suggestion, margin-guard
│   │   └── main.py
│   ├── tests/
│   └── requirements.txt
├── frontend/                # React (Vite) admin dashboard
│   ├── src/
│   └── package.json
├── docs/                    # design notes, ledger examples, evaluation pack
├── README.md
└── Tranz-Algo Improved Final Year Project Plan.docx
```

---

## MVP checklist

- [ ] User authentication + admin dashboard
- [ ] Products and shipment-batch inventory
- [ ] Auto FX + Already-Local cost entry
- [ ] At least two allocation methods + landed-cost calculation
- [ ] Price suggestion with configurable margin
- [ ] True-Cost Ledger (mode, inputs, source, allocation)
- [ ] Basic reports
- [ ] Spreadsheet baseline evaluation for both modes

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
| **POS / retail shop apps** | Sell items, take payments, print receipts | Does **not** replace checkout; focuses on **true cost + price decisions** before/while stock is sold elsewhere |
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

---

## Licence / status

Final-year project prototype (University of Zambia — Computing and Informatics).  
Build status: planning / design stage (implementation not started in this repo yet).
