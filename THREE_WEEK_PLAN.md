# Tranz-Algo — 3-Week Build Plan (App Complete)

**Period:** Next 3 weeks  
**Goal:** Finish a working MVP web app **and** a usable literature / related-work write-up.  
**Team:** Nixon Shibuchi and Musonda  
**Already done:** Improved proposal, README, first commit, GitHub remote, Musonda added as collaborator.

---

## Definition of “done” after 3 weeks

### App
A demonstrable admin web app where you can:

1. Log in  
2. Register products  
3. Create a shipment batch  
4. Enter costs in **Auto FX** and **Already-Local** modes  
5. Allocate shared shipping (weight + quantity)  
6. See per-item landed cost  
7. Get suggested retail price (configurable margin)  
8. View True-Cost Ledger for the batch  
9. Track basic stock (board + Record sale)  
10. See a simple report / Margin-Guard alert (basic is OK)

### Design (must exist before heavy UI/feature coding)
- [x] ERD + short data dictionary in `docs/design/`  
- [x] API endpoint list  
- [x] Dual-mode cost field notes + worked formula examples  
- [x] Core wireframes (login → products → batch → costs → allocation → prices → ledger)  

### Literature
- [x] Related-work notes covering inventory systems, landed cost, FX/pricing for SMEs, and similar tools — *`sources.md` + `related_work_draft.md`*  
- [x] Comparison table: POS vs inventory vs ERP vs Excel vs Tranz-Algo — *in `sources.md` / related work*  
- [x] Short gap statement — *`gap_statement.md`*  
- [x] Draft literature section — *`related_work_draft.md` → `related_work_v1.md`*

**Out of scope for these 3 weeks:** Full POS payments/checkout, real shipping booking, Expo mobile, CSV import, polished ERP features.  
*(Accepted MVP extra: simple Record sale for stock-out only.)*

---

## Team working rules (keep light)

- Push daily if possible  
- Use branches for big features; small fixes can go to `main` if you both agree  
- Pair on formulas (landed cost / allocation) — highest risk area  
- Freeze scope: if it’s not in the “done” list above, it waits  
- Literature runs **in parallel** with coding (do not leave it all for week 3)

### Suggested ownership

| Area | Lead | Backup |
|---|---|---|
| FastAPI, auth, FX, cost engine | Nixon | Musonda |
| DB schema, inventory, ledger persistence | Musonda | Nixon |
| System design (ERD, API list, wireframes) | Both (pair Day 1) | — |
| React dashboard + forms | Split screens | Both |
| Formula tests + demo scenario pack | Both (pair) | — |
| Literature search + synthesis | Nixon | Musonda reviews / adds inventory & UI-related sources |
| Uniqueness / gap vs similar systems | Both | — |

---

## Literature track (parallel across all 3 weeks)

Keep literature light but continuous so the report is not empty when the app is finished.

### Week 1 literature (foundation)
**Lead: Nixon | Review: Musonda**

- [x] Gather 8–12 sources (papers, textbooks, docs) on:
  - inventory / retail management systems
  - landed cost and import logistics
  - currency risk / exchange rates in trade
  - algorithmic or rule-based retail pricing
  - open-source ERP/inventory tools (for comparison only)
- [x] Create `docs/literature/sources.md` (citation + 2–3 sentence note each)
- [x] Draft comparison table: POS / inventory apps / ERP / Excel / shipping tools / Tranz-Algo
- [x] Write a half-page problem gap: why dual modes + explainable allocation matter
  - Saved in `docs/literature/gap_statement.md`

### Week 2 literature (deepen + link to design)
**Lead: Nixon | Musonda adds inventory/UI-related sources where useful**

- [ ] Expand notes into `docs/literature/related_work_draft.md` (2–4 pages)
- [ ] Explicitly map each Tranz-Algo feature to a gap in related work:
  - dual cost-entry modes
  - allocation comparator
  - True-Cost Ledger
  - Margin-Guard
- [ ] Add references for chosen stack where useful (FastAPI, PostgreSQL, FX data source)
- [ ] Musonda reviews draft for clarity against the built UI/inventory flows

### Week 3 literature (report-ready polish)
**Lead: Nixon | Final read-through: Musonda**

- [ ] Finalise literature draft wording for the academic report (**Nixon**)
- [ ] Ensure every major claim has a source (**Nixon**)
- [ ] Add 2–3 sentences in the demo script that cite the gap (“unlike typical inventory apps…”) (**Nixon**)
- [ ] Store final version in `docs/literature/related_work_v1.md` (**Nixon**)
- [ ] Musonda does a final clarity check against the demo screens

### Literature success check
You are done with literature for these 3 weeks if a supervisor can read `docs/literature/` and understand what exists, what is missing, and why Tranz-Algo is different — without opening the code.

---

## Week 1 — Design freeze, backend foundation + cost engine (+ literature)

**Outcome:** Design artefacts frozen in `docs/design/`. API can create products/batches, compute landed cost + suggested price for both modes. Literature sources list started.

### Day 1 (morning): Design checkpoint — do this before heavy coding
**Both pair (Nixon + Musonda). Keep it fast; ugly sketches are fine.**

Create folder `docs/design/` and produce:

- [x] **ERD** — users, products, tax_profiles, shipment_batches, batch_items, cost_entries, ledger_entries, fx_rate_cache *(+ later accepted: `sales`)*  
- [x] **Data dictionary** — short meaning of each table/field (especially `cost_entry_mode`: `auto_fx` | `already_local`)  
- [x] **API endpoint list** — auth, products, shipments, costs, allocate, suggest-prices, ledger, fx rates  
- [x] **Dual-mode notes** — which fields are required in Auto FX vs Already-Local; how mixed paperwork is stored  
- [x] **Worked formula examples** — one Auto FX batch and one Already-Local batch (3 items each) with weight vs quantity allocation  
- [x] **Wireframes** (paper/Excalidraw/Figma) for:
  1. Login  
  2. Products list/create  
  3. Shipments list  
  4. Create batch + add items  
  5. Cost entry (mode toggle)  
  6. Allocation + landed cost review  
  7. Price suggestion  
  8. True-Cost Ledger  

**Design freeze rule:** After Day 1 morning, do not add major entities/screens unless both agree. Build to this design for the rest of the 3 weeks.

Suggested files:
- `docs/design/erd.md` (or `.png` / `.drawio`) — **done**
- `docs/design/api_endpoints.md` — **done**
- `docs/design/cost_modes_and_formulas.md` — **done**
- `docs/design/wireframes.md` (links/screenshots to sketches) — **done (text wireframes; optional Excalidraw polish later)**

### Days 1–2 (afternoon/evening): Project skeleton
- [x] `backend/` FastAPI project structure (**Nixon**)
- [x] `frontend/` React (Vite) app shell + routing (**Musonda** / scaffolded)
- [x] PostgreSQL via Supabase free tier **or** local Postgres (**SQLite default for local MVP; Postgres via `DATABASE_URL`**)
- [x] DB models/migrations matching the ERD: users, products, shipment_batches, batch_items, tax_profiles (**auto-create on startup**)
- [x] JWT auth: register/login (admin user is enough) (**Nixon**)
- [x] README “Getting started” run instructions (**Nixon**)
- [x] Literature: create `docs/literature/sources.md` and add first 5 sources (**Nixon**) — *already started*

### Days 3–4: Dual-mode cost engine
- [x] Cost entry endpoints for a batch (**Nixon**)
- [x] **Already-Local** path working end-to-end in API (**both pair**)
- [x] **Auto FX** path: Frankfurter (or free FX) + cache + manual override (**Nixon**)
- [x] Shipping allocation: **quantity** and **weight** (**both pair**)
- [x] Landed cost calculation service (**both pair**)
- [x] Price suggestion: `RP = LandedCost × (1 + margin)` (**Musonda** / scaffolded)
- [x] Unit tests for allocation + both modes using Day 1 formula examples (**both**)
- [x] Literature: finish 8–12 sources + first comparison table draft (**Nixon**) — *already started*

### Day 5: Ledger + inventory hooks
- [x] Save True-Cost Ledger rows when a batch calculation is committed (**Musonda** / scaffolded)
- [x] Update stock quantities when a batch is received/committed (**Musonda** / scaffolded)
- [ ] Seed one demo admin user + sample products (**Nixon**) — register via UI/API for now
- [x] Literature: half-page gap statement by Nixon, reviewed by Musonda (**both**) — *already started*

### Week 1 demo checkpoint
**Design:** `docs/design/` contains ERD, API list, formula examples, and wireframes  
**App:** Postman/Swagger shows login → products → batch → costs (both modes) → allocate → suggest prices → ledger  
**Literature:** `sources.md` exists with citations + comparison table started

---

## Week 2 — Frontend dashboard (full MVP UI) (+ related-work draft)

**Outcome:** Browser click-through of the full MVP, following Week 1 wireframes. Related-work draft exists.

### Days 1–2: App shell + master data
- [x] Login page (**Musonda** / implemented) — + Register toggle
- [x] Auth-protected layout/nav (**Musonda** / implemented) — mobile drawer
- [x] Products page list/create/edit (**Musonda** / implemented) — + delete + confirms
- [x] Tax profile simple form (**Nixon** / implemented)
- [x] Shipments list page (**Nixon** / implemented)
- [x] Literature: start `related_work_draft.md` from Week 1 notes (**Nixon**)

### Days 3–4: Shipment workflow UI
- [x] Create shipment batch + add items (**both**)
- [x] Cost entry screen with mode toggle: **Auto FX | Already-Local** (**Nixon**)
- [x] Enter product costs, shipping total, duty/VAT (**Nixon**)
- [x] Run allocation; show weight vs quantity comparison (**both**) — plain-text results
- [x] Show landed cost table per item (**Musonda**)
- [x] Margin input + suggested prices; save retail prices (**Musonda**) — auto vs manual choice
- [x] Literature: map features → gaps in related work (**Nixon**, Musonda comments)

### Day 5: Ledger, stock, basic report
- [x] True-Cost Ledger page/panel (**Musonda**)
- [x] Inventory/stock view by product (**Musonda**) — stock board + **Record sale**
- [x] Simple dashboard summary cards (**Nixon**) — + Start fresh
- [x] Basic Margin-Guard “recheck” warning (**Nixon**)
- [x] Literature: Musonda review pass on clarity vs built UI/inventory (**Musonda**) — *draft ready for Musonda read-through*
- [x] Quick design check: UI deltas noted in `docs/design/wireframes.md` (+ ERD/API updates)

### Week 2 demo checkpoint
**App:** Full browser walkthrough for Already-Local (and Auto FX) — **done for MVP**  
**Literature:** `related_work_draft.md` (2–4 pages) — **done** (`related_work_v1.md` polished)  
**Design:** Wireframes/ERD/API updated for as-built — **done**

---

## Week 3 — Harden, evaluate, literature polish, present-ready

**Outcome:** Stable demo, tests, docs, literature report-ready, viva script.

### Days 1–2: Bugfix + edge cases
- [ ] Validation errors (missing weight, zero qty, empty batch)
- [ ] FX API down → cached/manual rate (Auto FX)
- [ ] Mixed paperwork case (foreign lines + local freight/duty)
- [ ] Rounding consistency (match spreadsheet within 0.01)
- [ ] Auth protection on all sensitive routes
- [ ] Literature: fill missing citations / weak paragraphs (**Nixon**)

### Days 3–4: Evaluation pack + docs
- [x] `/docs/scenarios/` with 5–8 sample shipments + spreadsheet baseline
- [x] Compare app outputs vs spreadsheet; short eval note
- [x] UI cleanup for demo
- [ ] Sample data seed script for one-click demo reset
- [x] User manual section in README or `docs/USER_MANUAL.md` — *covered in root README “How to use”*
- [x] Literature: finalise `related_work_v1.md` (**Nixon**; Musonda final read-through)

### Day 5: Presentation readiness
- [ ] 5–7 minute demo script (what to click, what to say)
- [ ] Include 30–60 seconds on literature gap / uniqueness
- [ ] Backup plan: screenshots/video if live FX fails
- [ ] Confirm Nixon and Musonda can both run from a clean clone
- [ ] Final push to GitHub; optional tag `v0.1-mvp`

### Week 3 “done” checklist
- [x] Full MVP flow works without explaining code
- [x] Both cost-entry modes demoable
- [x] Ledger visible and understandable
- [x] Tests pass for core formulas
- [x] README run + demo instructions clear
- [x] Literature folder is report-ready (`related_work_v1.md`)
- [x] Design folder matches what was demoed (deltas noted)
- [ ] Nixon and Musonda can present any part (practice)

---

## Daily rhythm (recommended)

| When | What |
|---|---|
| Start of day | 10-min sync (Nixon + Musonda): today’s 1–2 coding targets + 1 literature target |
| During day | Build / review each other’s pushes |
| End of day | Push working code; tick checklist items |
| End of week | Full demo to each other + literature status check |

---

## Risk control

| Risk | Mitigation |
|---|---|
| Scope creep | Only MVP “done” list; stretch after week 3 |
| Formula bugs | Nixon + Musonda pair on engine; spreadsheet oracle tests |
| FX API issues | Cache + manual rate; Already-Local always demoable |
| Literature left to last minute | Weekly literature deliverables above |
| One person blocked | Switch tasks using the ownership table; don’t wait |

---

## Stretch (only if MVP is solid before end of Week 3)

- Value-based allocation  
- CSV invoice import  
- Scheduled Margin-Guard alerts  
- Expo mobile stock lookup  
- Prettier charts/reports  

---

## Immediate next actions

1. **Musonda:** Read `related_work_v1.md` + `docs/scenarios/eval_note.md` for clarity  
2. **Both:** 5–7 minute demo script + practice presenting  
3. Optional seed script (UI Start fresh already clears data)  
4. Push MVP to GitHub; optional tag `v0.1-mvp`

App, literature drafts, and spreadsheet evaluation pack are in place — focus remaining effort on **presentation** and **GitHub**.
