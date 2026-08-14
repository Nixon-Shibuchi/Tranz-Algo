# Tranz-Algo — API Endpoint List

**Design freeze:** Week 1 Day 1  
**Updated:** matches implemented FastAPI routes  
**Backend:** FastAPI  
**Auth:** JWT Bearer token unless marked public  

Base URL (local): `http://127.0.0.1:8000/api/v1`  
Interactive docs: `http://127.0.0.1:8000/docs`

---

## Auth

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Create admin user |
| `POST` | `/auth/login` | Public | Return access token (JSON body) |
| `POST` | `/auth/token` | Public | OAuth2 form login (Swagger “Authorize”) |
| `GET` | `/auth/me` | JWT | Current user profile |

**Login body (example)**
```json
{ "email": "admin@example.com", "password": "admin123" }
```

**Login response (example)**
```json
{ "access_token": "<jwt>", "token_type": "bearer" }
```

---

## Admin

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/admin/reset-business-data` | JWT | Clear products, shipments, tax profiles, sales, ledger, FX cache; **keeps users** |

Used by Dashboard **Start fresh** (UI requires typing `RESET`).

---

## Tax profiles

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/tax-profiles` | JWT | List profiles |
| `POST` | `/tax-profiles` | JWT | Create profile |
| `GET` | `/tax-profiles/{id}` | JWT | Get one |
| `PUT` | `/tax-profiles/{id}` | JWT | Update |
| `DELETE` | `/tax-profiles/{id}` | JWT | Delete |

---

## Products

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/products` | JWT | List products + stock |
| `POST` | `/products` | JWT | Create product |
| `GET` | `/products/{id}` | JWT | Get one |
| `PUT` | `/products/{id}` | JWT | Update |
| `DELETE` | `/products/{id}` | JWT | Hard-delete (MVP) |

**Create product body (example)**
```json
{
  "sku": "FAN-001",
  "name": "Standing Fan 16in",
  "default_weight_kg": 5,
  "reorder_level": 3,
  "tax_profile_id": 1
}
```

---

## Shipments (batches)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/shipments` | JWT | List batches |
| `POST` | `/shipments` | JWT | Create draft batch |
| `GET` | `/shipments/{id}` | JWT | Batch detail + items |
| `PUT` | `/shipments/{id}` | JWT | Update header fields |
| `DELETE` | `/shipments/{id}` | JWT | Delete non-committed only |

**Create shipment body (example)**
```json
{
  "reference": "SHP-2026-001",
  "supplier_name": "Guangzhou Supplies",
  "primary_cost_mode": "already_local",
  "currency_foreign": "USD",
  "currency_local": "ZMW"
}
```

---

## Batch items

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/shipments/{id}/items` | JWT | Add product line |
| `PUT` | `/shipments/{id}/items/{item_id}` | JWT | Update qty/weight/prices |
| `DELETE` | `/shipments/{id}/items/{item_id}` | JWT | Remove line |

---

## Costs, FX, allocation, pricing

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/fx/rates` | JWT | Get rate (`base`, `quote`); API → cache → error |
| `POST` | `/fx/rates/manual` | JWT | Set/override manual rate + cache as last known good |
| `PUT` | `/shipments/{id}/costs` | JWT | Save shipping/duty/VAT/exchange + paperwork source |
| `POST` | `/shipments/{id}/allocate` | JWT | Allocate; optional compare other method |
| `POST` | `/shipments/{id}/suggest-prices` | JWT | Apply margin; write suggested prices |
| `POST` | `/shipments/{id}/commit` | JWT | Ledger + stock up + apply accepted prices |
| `POST` | `/shipments/{id}/margin-guard/recheck` | JWT | Alert if active retail below safe floor |

**Allocate body (example)**
```json
{ "method": "quantity", "compare": true }
```

**Allocate response (example shape)**
```json
{
  "selected_method": "quantity",
  "comparison": { "selected": [], "quantity": [], "weight": [] },
  "shipment": { }
}
```

**Suggest prices body (example)**
```json
{ "profit_margin": 0.30, "safety_margin": 0.10 }
```

**Commit body (example)**
```json
{
  "accept_suggestions": true,
  "item_price_overrides": [
    { "item_id": 1, "accepted_retail_price": 1200.00 }
  ]
}
```

UI: after suggest, user chooses **use suggestions automatically** (`accept_suggestions: true`) or **manual prices** (overrides).

---

## Ledger, inventory & sales

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/shipments/{id}/ledger` | JWT | True-Cost Ledger for batch |
| `GET` | `/inventory` | JWT | Products with stock + active retail |
| `GET` | `/inventory/sales` | JWT | Recent sales (`?limit=20`) |
| `POST` | `/inventory/sales` | JWT | Record sale — reduce stock |
| `GET` | `/reports/summary` | JWT | Counts: products, shipments, drafts, committed |

**Record sale body (example)**
```json
{
  "product_id": 1,
  "quantity": 2,
  "unit_price": 1066.0,
  "note": optional
}
```

**Sale response includes:** `sku`, `name`, `line_total`, `stock_after`.

**Summary response**
```json
{
  "products": 3,
  "shipments": 1,
  "draft_shipments": 0,
  "committed_shipments": 1
}
```

---

## Health

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/health` | Public | App up check |

---

## Error conventions

- `401` unauthorized  
- `404` not found  
- `422` validation (friendly messages where possible: missing weight, oversell, empty batch, etc.)  
- `409` invalid status transition (e.g. commit twice, delete committed batch)

---

## Implementation notes (as built)

1. Default DB is **SQLite** (`tranzalgo.db`); Postgres via `DATABASE_URL`.  
2. Tables auto-create on startup; SQLite also gets additive column migrate for older DBs.  
3. Value-based allocation remains stretch (engine may support; UI uses quantity/weight).  
4. Admin reset clears business data including `sales`.
