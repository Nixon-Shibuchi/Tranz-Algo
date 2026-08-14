# Tranz-Algo — Wireframes (MVP Screens)

**Design freeze:** Week 1 Day 1  
**Updated:** as-built notes for current React UI  
**Fidelity:** Low (boxes + labels)  
**Platform:** React web admin — **mobile-first drawer nav** (not desktop-only top nav)

---

## Global layout (as built)

```text
┌──────────────────────────────────────────┐
│ [Menu]  Tranz-Algo              [Logout] │
├──────────────────────────────────────────┤
│ Drawer (when open):                      │
│  Dashboard · Products · Shipments ·      │
│  Stock · Tax profiles                    │
├──────────────────────────────────────────┤
│ Page title                    [actions]  │
│ Main content                             │
└──────────────────────────────────────────┘
```

**Accepted UX deltas vs Day-1 sketch**
- Nav label **Stock** (was Inventory)
- Confirm dialogs on create / update / delete and costing actions
- Tutorial / workflow copy lives in root README, not in screens
- Logo / brand mark on login and header

---

## 1. Login / Register

```text
┌─────────────────────────────┐
│  [logo] Tranz-Algo          │
│   Import true-cost pricing  │
│                             │
│  Email    [..............]  │
│  Password [..............] [Show]
│                             │
│        [ Sign in ]          │
│  Need an account? Register  │
└─────────────────────────────┘
```

**As built:** Register toggle on the same page (no seed-only admin assumption).

---

## 2. Products

```text
Products
────────────────────────────────────
Form: SKU * · Name * · weight · unit
      [Show extra fields] category, brand,
      origin, reorder, tax profile, barcode…
      [Create / Update] [Cancel edit]

Table: SKU · Name · Unit · Weight · Stock(+status) · Retail · Edit/Delete
```

---

## 3. Shipments list

```text
Shipments
────────────────────────────────────
Form: New shipment (reference *, mode, currency…)
Table: Ref · Supplier · Mode · Status · Open / Delete
```

Status chips: `draft` / `costed` / `committed`  
Delete only if not committed.

---

## 4–7. Shipment detail (combined as built)

One page covers items → costs → allocate → suggest → commit → ledger:

```text
SHP-2026-001   [mode badge] [status badge]
meta: supplier, invoice, agent, carrier, dates…

[+ Add item] product · qty · weight · line mode · prices

Lines table (landed + suggested columns)

Costs: FX [Fetch FX] · shipping · duty · VAT · paperwork · [Save]

Allocation & pricing:
  Method [quantity|weight] [Run allocation]
  Margin [0.30] [Suggest prices] [Commit batch]

Allocation results (plain text per SKU + comparison line)

After Suggest → modal:
  list landed → suggested
  [Use these automatically] [Enter prices manually] [Not now]

Manual prices card (if chosen) → editable retail fields

Margin-Guard [Recheck]
True-Cost Ledger table
```

---

## 8. Stock (was Inventory)

```text
Stock                    [Record sale] [Shipments]
────────────────────────────────────
Cards: units · available SKUs · low · out

Filters: All | Available | Low | Out   Search […]

Stock cards:
  SKU · name · status badge
  large qty · meter bar
  retail · reorder
  [Sell]  (if qty > 0)

Recent sales table: when · SKU · qty · unit · total · left
```

**Record sale modal:** product · qty · unit price (default retail) · note · available/after/total preview.

---

## Extra screens

### Dashboard
Cards: units available, low/out, drafts, committed.  
Shelf list (top in-stock SKUs).  
**Start fresh** → type `RESET` → `POST /admin/reset-business-data`.

### Tax profiles
CRUD form + table (name, duty, VAT, notes).

---

## Interaction rules (still apply)

1. Show landed unit next to suggested price.  
2. Never allow commit with empty / unallocated items.  
3. Weight allocation needs usable weights.  
4. Already-Local shipping does not require live FX.  
5. After commit, batch is read-only except Margin-Guard recheck.  
6. Confirm before destructive or costly actions.  
7. Sales cannot exceed stock on hand.

---

## Implementation mapping

| Area | Status |
|---|---|
| Login/Register, Products, Tax, Shipments | Implemented |
| Shipment costing / allocate / suggest / commit / ledger | Implemented |
| Stock board + Record sale | Implemented |
| Dashboard + Start fresh | Implemented |
| Confirm dialogs | Implemented |
