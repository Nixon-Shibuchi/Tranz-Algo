# Tranz-Algo — Wireframes (MVP Screens)

**Design freeze:** Week 1 Day 1  
**Updated:** complete as-built notes for current React web UI  
**Fidelity:** Low (boxes + labels)  
**Platform:** React web admin — mobile drawer + closable desktop sidebar; Day / Night / Sienna themes

---

## Global layout (as built)

```text
Desktop (sidebar open)              Desktop (collapsed) / Mobile
┌────────┬──────────────────┐       ┌──────────────────────────┐
│ Brand  │ Topbar crumbs    │       │ [Menu] Brand   [Theme]   │
│ Nav    ├──────────────────┤       ├──────────────────────────┤
│ Theme  │ Page content     │       │ Page content             │
│ User   │                  │       │ (drawer nav when open)   │
└────────┴──────────────────┘       └──────────────────────────┘
```

**Nav sections (as built)**
- Costing engine: **True Cost** (featured)
- Workspace: Dashboard · Products · Shipments · Stock (Clear drafts on Shipments list)

**Accepted UX deltas vs Day-1 sketch**
- Welcome landing (portal-style) before first login
- Closable desktop sidebar; mobile drawer unchanged
- Confirm dialogs on create / update / delete and costing actions
- Tutorial / workflow copy lives in root README, not in screens
- Colour modes Day / Night / Sienna
- Product **ID** column + optional auto SKU `PRD-000N`
- List caps (≈5) with search / drawer for longer catalogues

---

## 0. Welcome (first visit)

```text
┌ Header: Logo Tranz-Algo              [Sign in] ┐
│                                                │
│  ┌─ Hero card (warehouse image background) ─┐  │
│  │  Landed-cost studio for importers         │  │
│  │  How can Tranz-Algo help you?             │  │
│  │  short explain…                           │  │
│  │  [Get started]  [Sign in]                 │  │
│  └───────────────────────────────────────────┘  │
│                                                │
│  Core capabilities                             │
│  ┌ True Cost ┐ ┌ Dual modes ┐ …               │
│                                                │
└ Footer: brand + one-line purpose ─────────────┘
```

**As built:** Single landing (no carousel). Shown once (`tranzalgo-welcomed`); return via login **← Back to welcome**.

---

## 1. Login / Register

```text
┌─────────────────────────────┐
│  ← Back to welcome          │
│  [logo] Tranz-Algo          │
│   Sign in / Create account  │
│                             │
│  Full name (register only)  │
│  Email    [placeholder]     │
│  Password [placeholder][Show]
│                             │
│        [ Sign in ]          │
│  Need an account? Register  │
└─────────────────────────────┘
```

**As built:** Empty fields with placeholders (not prefilled demos). Register toggle on the same page.

---

## 2. Products

```text
Products
────────────────────────────────────
Form: SKU (optional — auto PRD-000N) · Name *
      weight · unit · reorder · [optional details]
      [Create / Update] [Cancel edit]

Table: ID · SKU · Name · Unit · Weight · Stock(+status) · Retail · Edit/Delete
```

---

## 3. Shipments list

```text
Shipments                              [Import CSV] [Clear drafts]
────────────────────────────────────
Form: New shipment (reference *, primary mode once — Already-Local / Auto FX; foreign currency if Auto FX). Fetch FX is on shipment detail costs.
Table: Ref · Supplier · Mode · Status · Open / Delete
```

Status chips: `draft` / `costed` / `committed`  
Delete only if not committed.  
**Import CSV:** full shipment samples under `docs/scenarios/samples/` (e.g. Demo A/B → `SHP-DEMO-LOCAL-ZMW` / `SHP-DEMO-AUTO-FX`). Products list has a matching product CSV import.

---

## 4–7. Shipment detail + True Cost studio

**Shipment detail** holds lines + costs (Fetch FX only for Auto FX) + open True Cost; after commit, **Cost history**.  
Auto FX: rate seeds from last cache or starter **20** until Fetch FX / manual override.

**True Cost** (`/true-cost`, `/true-cost/:id`) is the featured costing workspace:

```text
True Cost
────────────────────────────────────
Batch picker (2 recent spotlight + archive drawer)

Stages: Lines → Allocate → Price → Commit
  Method [quantity|weight] [Run allocation]
  Waterfall / comparison
  Margin dial · auto or manual retail · safety floor flags
  [Commit batch]
```

---

## 8. Stock (was Inventory)

```text
Stock                    [Record sale] [Shipments]
────────────────────────────────────
Cards: units · available SKUs · low · out
Filters + search · capped card list + drawer
Recent sales (capped) + drawer
```

**Record sale:** product · qty · unit price · note — stock-out only (not POS).

---

## Extra screens

### Dashboard
Summary cards; shelf preview (capped); **Start fresh** (`RESET`).

---

## Interaction rules

1. Show landed unit next to suggested price.  
2. Never allow commit with empty / unallocated items.  
3. Weight allocation needs usable weights.  
4. Already-Local shipping does not require live FX.  
5. After commit, batch is read-only; Cost history shows When / What.  
6. Confirm before destructive or costly actions.  
7. Sales cannot exceed stock on hand.  
8. Mobile: welcome/login CTAs and forms must remain usable without horizontal scroll.

---

## Implementation mapping

| Area | Status |
|---|---|
| Welcome landing + back from login | Implemented |
| Login/Register (Create account), Products, Shipments | Implemented |
| CSV import (products + shipments) | Implemented |
| True Cost studio + safety floor | Implemented |
| Stock board + Record sale | Implemented |
| Dashboard + Start fresh | Implemented |
| Themes + closable sidebar | Implemented |
| Confirm dialogs | Implemented |
| Mobile-friendly welcome/login | Implemented |
