# Tranz-Algo — ERD & Data Dictionary

**Design freeze:** Week 1 Day 1  
**Updated:** aligned with implemented MVP (incl. `sales`, `paperwork_source`)  
**Owners:** Nixon + Musonda  
**Status:** Implemented — build matches this dictionary unless noted

---

## Entity relationship overview

```text
┌─────────────┐       ┌─────────────────┐       ┌──────────────────┐
│    users    │       │  tax_profiles   │       │ fx_rate_cache    │
└──────┬──────┘       └────────┬────────┘       └──────────────────┘
       │                       │
       │ creates               │ optional default
       ▼                       ▼
┌──────────────────┐     ┌─────────────┐──────── sales (stock-out)
│ shipment_batches │◄────│  products   │
└────────┬─────────┘     └──────┬──────┘
         │                      │
         │ 1:N                  │ 1:N (via batch_items)
         ▼                      ▼
┌──────────────────┐     ┌──────────────────┐
│   batch_items    │─────│  (product ref)   │
└────────┬─────────┘     └──────────────────┘
         │
         │ costs / results
         ▼
┌──────────────────┐     ┌──────────────────┐
│   cost_entries   │     │  ledger_entries  │
│ (batch + lines)  │     │ (audit trail)    │
└──────────────────┘     └──────────────────┘
```

**Cardinalities (summary)**
- One `user` creates many `shipment_batches`
- One `product` appears in many `batch_items` (across batches)
- One `shipment_batch` has many `batch_items`
- One `shipment_batch` has one active cost calculation set (`cost_entries` / totals) and many `ledger_entries`
- One `product` may link to one default `tax_profile` (optional)
- One `product` has many `sales` (simple stock-out records)
- `fx_rate_cache` is standalone lookup storage for Auto FX

---

## Tables

### 1. `users`
Admin accounts for the dashboard.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID / serial PK | |
| `email` | string, unique | Login identity |
| `full_name` | string | |
| `password_hash` | string | Never store plain passwords |
| `role` | string | MVP: `admin` only |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### 2. `products`
Catalogue items that can be received in import batches.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID / serial PK | |
| `sku` | string, unique | Store code |
| `name` | string | |
| `description` | text, nullable | |
| `category` | string, nullable | e.g. Electronics |
| `brand` | string, nullable | |
| `unit` | string | default `pcs` (carton/kg/pair/set) |
| `barcode` | string, nullable | |
| `origin_country` | string, nullable | |
| `default_weight_kg` | decimal, nullable | Used for weight allocation defaults |
| `reorder_level` | decimal, nullable | Low-stock hint |
| `tax_profile_id` | FK → tax_profiles, nullable | Optional duty/VAT template |
| `stock_on_hand` | decimal/int | + on commit; − on Record sale |
| `active_retail_price` | decimal, nullable | Last accepted selling price |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### 3. `tax_profiles`
Configurable duty/VAT templates (not a live ZRA API).

| Field | Type | Notes |
|---|---|---|
| `id` | UUID / serial PK | |
| `name` | string | e.g. "Electronics", "General goods" |
| `duty_rate` | decimal | e.g. `0.15` for 15% |
| `vat_rate` | decimal | e.g. `0.16` for 16% |
| `notes` | text, nullable | Source of rates / reminder |
| `created_at` | datetime | |

### 4. `shipment_batches`
One import shipment / invoice group — the unit of truth for costing.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID / serial PK | |
| `reference` | string | e.g. `SHP-2026-001` |
| `created_by` | FK → users | |
| `supplier_name` | string, nullable | |
| `invoice_number` | string, nullable | Supplier commercial invoice |
| `clearing_agent` | string, nullable | |
| `carrier_name` | string, nullable | Shipping company |
| `origin_country` | string, nullable | |
| `destination` | string, nullable | default Zambia |
| `expected_arrival_date` | string/date, nullable | |
| `received_date` | string/date, nullable | |
| `status` | string | `draft` \| `costed` \| `committed` |
| `primary_cost_mode` | string | `auto_fx` \| `already_local` \| `mixed` |
| `currency_foreign` | string, nullable | e.g. `USD`, `CNY` (Auto FX) |
| `currency_local` | string | MVP default `ZMW` |
| `exchange_rate` | decimal, nullable | Rate used (API/cache/manual) |
| `exchange_rate_source` | string, nullable | `api` \| `cache` \| `manual` \| `shipper_docs` |
| `exchange_rate_at` | datetime, nullable | When rate was obtained |
| `shipping_total` | decimal, nullable | Shared freight total (local after conversion if needed) |
| `shipping_currency_mode` | string | `auto_fx` \| `already_local` |
| `duty_total` | decimal, nullable | Batch-level duty if entered as total |
| `vat_total` | decimal, nullable | Batch-level VAT if entered as total |
| `allocation_method` | string, nullable | `weight` \| `quantity` \| `value` |
| `profit_margin` | decimal, nullable | e.g. `0.30` for 30% |
| `safety_margin` | decimal, nullable | For Margin-Guard, e.g. `0.10` |
| `paperwork_source` | text, nullable | Clearing/shipping doc reference |
| `notes` | text, nullable | |
| `committed_at` | datetime, nullable | When stock/prices locked in |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### 5. `batch_items`
Lines on a shipment (product + qty + per-line cost inputs/results).

| Field | Type | Notes |
|---|---|---|
| `id` | UUID / serial PK | |
| `batch_id` | FK → shipment_batches | |
| `product_id` | FK → products | |
| `quantity` | decimal/int | Units received |
| `weight_kg` | decimal, nullable | Line weight (defaults from product if empty) |
| `foreign_unit_price` | decimal, nullable | Auto FX supplier unit price |
| `local_unit_product_cost` | decimal, nullable | Already-Local / after conversion |
| `line_cost_mode` | string | `auto_fx` \| `already_local` |
| `tax_profile_id` | FK → tax_profiles, nullable | Override product default |
| `duty_amount` | decimal, nullable | Computed or manual |
| `vat_amount` | decimal, nullable | Computed or manual |
| `shipping_share` | decimal, nullable | Allocated share |
| `landed_unit_cost` | decimal, nullable | Result |
| `landed_line_cost` | decimal, nullable | Result (`landed_unit_cost * qty` or sum of parts) |
| `suggested_retail_price` | decimal, nullable | Result |
| `accepted_retail_price` | decimal, nullable | User-accepted price |
| `created_at` | datetime | |

### 6. `cost_entries`
Optional structured record of charge headers / paperwork sources for a batch (supports dual modes + audit).

| Field | Type | Notes |
|---|---|---|
| `id` | UUID / serial PK | |
| `batch_id` | FK → shipment_batches | |
| `charge_type` | string | `product` \| `shipping` \| `duty` \| `vat` \| `other` |
| `entry_mode` | string | `auto_fx` \| `already_local` |
| `amount` | decimal | |
| `currency` | string | |
| `paperwork_source` | string, nullable | e.g. "Clearing agent invoice #12" |
| `notes` | text, nullable | |
| `created_at` | datetime | |

> MVP can store main totals on `shipment_batches` and still use `cost_entries` for source audit. Prefer writing `cost_entries` when committing a calculation.

### 7. `ledger_entries`
**True-Cost Ledger** — immutable-style audit rows explaining a calculation.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID / serial PK | |
| `batch_id` | FK → shipment_batches | |
| `batch_item_id` | FK → batch_items, nullable | Null for batch-level events |
| `event_type` | string | `rate_set` \| `allocated` \| `landed_cost` \| `price_suggested` \| `price_accepted` \| `margin_alert` |
| `payload_json` | JSON | Snapshot: inputs, mode, method, intermediates, outputs |
| `created_by` | FK → users, nullable | |
| `created_at` | datetime | |

### 8. `fx_rate_cache`
Cached FX for Auto FX mode + fallback.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID / serial PK | |
| `base_currency` | string | e.g. `USD` |
| `quote_currency` | string | e.g. `ZMW` |
| `rate` | decimal | |
| `source` | string | `frankfurter` \| `manual` \| provider name |
| `fetched_at` | datetime | |
| `is_last_known_good` | boolean | For downtime fallback |

### 9. `sales`
Simple **stock-out** when goods leave the shelf. Not a POS (no payments, receipts, or customers).

| Field | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `product_id` | FK → products | |
| `quantity` | decimal | Units sold |
| `unit_price` | decimal, nullable | Snapshot (defaults to active retail) |
| `stock_after` | decimal | On-hand after this sale |
| `note` | string, nullable | Optional |
| `created_by` | FK → users, nullable | |
| `created_at` | datetime | |

---

## Status meanings (`shipment_batches.status`)

| Status | Meaning |
|---|---|
| `draft` | Editable setup — items/costs can change; stock & retail prices not updated |
| `costed` | Allocation (+ usually suggestion) computed; not yet applied to stock/prices |
| `committed` | Ledger saved; stock updated; accepted prices applied; batch read-only |

---

## Indexes (recommended)

- `products.sku` unique  
- `shipment_batches.reference` unique  
- `batch_items(batch_id)`, `batch_items(product_id)`  
- `ledger_entries(batch_id, created_at)`  
- `fx_rate_cache(base_currency, quote_currency, fetched_at)`  
- `sales(product_id)`, `sales(created_at)`  

---

## Out of ERD (intentionally)

- Full POS (customers, payments, receipts, carts)  
- Payment transactions  
- Courier tracking / shipment booking  
- Multi-warehouse transfers (MVP single stock pool)

> **Accepted delta:** a lightweight `sales` table exists for stock truth after commit. It is **not** a POS module.
