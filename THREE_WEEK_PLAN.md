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
9. Track basic stock by batch  
10. See a simple report / Margin-Guard alert (basic is OK)

### Literature
- [ ] Related-work notes covering inventory systems, landed cost, FX/pricing for SMEs, and similar tools  
- [ ] Comparison table: POS vs inventory vs ERP vs Excel vs Tranz-Algo  
- [ ] Short gap statement: what existing work misses and how Tranz-Algo fills it  
- [ ] Draft literature section saved in `docs/literature/` (ready to paste into the final report later)

**Out of scope for these 3 weeks:** POS payments, real shipping booking, Expo mobile, CSV import, polished ERP features.

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

## Week 1 — Backend foundation + cost engine (+ literature start)

**Outcome:** API can create products/batches, compute landed cost + suggested price for both modes. Literature sources list started.

### Days 1–2: Project skeleton
- [ ] `backend/` FastAPI project structure (**Nixon**)
- [ ] `frontend/` React (Vite) app shell + routing (**Musonda**)
- [ ] PostgreSQL via Supabase free tier **or** local Postgres (**both decide Day 1**)
- [ ] DB models/migrations: users, products, shipment_batches, batch_items, tax_profiles (**Musonda**)
- [ ] JWT auth: register/login (admin user is enough) (**Nixon**)
- [ ] README “Getting started” run instructions (**Nixon**)
- [ ] Literature: create `docs/literature/sources.md` and add first 5 sources (**Nixon**)

### Days 3–4: Dual-mode cost engine
- [ ] Cost entry endpoints for a batch (**Nixon**)
- [ ] **Already-Local** path working end-to-end in API (**both pair**)
- [ ] **Auto FX** path: Frankfurter (or free FX) + cache + manual override (**Nixon**)
- [ ] Shipping allocation: **quantity** and **weight** (**both pair**)
- [ ] Landed cost calculation service (**both pair**)
- [ ] Price suggestion: `RP = LandedCost × (1 + margin)` (**Musonda**)
- [ ] Unit tests for allocation + both modes (**both**)
- [ ] Literature: finish 8–12 sources + first comparison table draft (**Nixon**)

### Day 5: Ledger + inventory hooks
- [ ] Save True-Cost Ledger rows when a batch calculation is committed (**Musonda**)
- [ ] Update stock quantities when a batch is received/committed (**Musonda**)
- [ ] Seed one demo admin user + sample products (**Nixon**)
- [ ] Literature: half-page gap statement by Nixon, reviewed by Musonda (**both**)

### Week 1 demo checkpoint
**App:** Postman/Swagger shows login → products → batch → costs (both modes) → allocate → suggest prices → ledger  
**Literature:** `sources.md` exists with citations + comparison table started

---

## Week 2 — Frontend dashboard (full MVP UI) (+ related-work draft)

**Outcome:** Browser click-through of the full MVP. Related-work draft exists.

### Days 1–2: App shell + master data
- [ ] Login page (**Musonda**)
- [ ] Auth-protected layout/nav (**Musonda**)
- [ ] Products page list/create/edit (**Musonda**)
- [ ] Tax profile simple form (**Nixon**)
- [ ] Shipments list page (**Nixon**)
- [ ] Literature: start `related_work_draft.md` from Week 1 notes (**Nixon**)

### Days 3–4: Shipment workflow UI
- [ ] Create shipment batch + add items (**both**)
- [ ] Cost entry screen with mode toggle: **Auto FX | Already-Local** (**Nixon**)
- [ ] Enter product costs, shipping total, duty/VAT (**Nixon**)
- [ ] Run allocation; show weight vs quantity comparison (**both**)
- [ ] Show landed cost table per item (**Musonda**)
- [ ] Margin input + suggested prices; save retail prices (**Musonda**)
- [ ] Literature: map features → gaps in related work (**Nixon**, Musonda comments)

### Day 5: Ledger, stock, basic report
- [ ] True-Cost Ledger page/panel (**Musonda**)
- [ ] Inventory/stock view by product/batch (**Musonda**)
- [ ] Simple dashboard summary cards (**Nixon**)
- [ ] Basic Margin-Guard “recheck” warning (**Nixon**)
- [ ] Literature: Musonda review pass on clarity vs built UI/inventory (**Musonda**)

### Week 2 demo checkpoint
**App:** Full browser walkthrough for one Already-Local batch and one Auto FX batch  
**Literature:** `related_work_draft.md` (2–4 pages) ready for polish

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
- [ ] `/docs/scenarios/` with 5–8 sample shipments + spreadsheet baseline
- [ ] Compare app outputs vs spreadsheet; short eval note
- [ ] UI cleanup for demo
- [ ] Sample data seed script for one-click demo reset
- [ ] User manual section in README or `docs/USER_MANUAL.md`
- [ ] Literature: finalise `related_work_v1.md` (**Nixon**; Musonda final read-through)

### Day 5: Presentation readiness
- [ ] 5–7 minute demo script (what to click, what to say)
- [ ] Include 30–60 seconds on literature gap / uniqueness
- [ ] Backup plan: screenshots/video if live FX fails
- [ ] Confirm Nixon and Musonda can both run from a clean clone
- [ ] Final push to GitHub; optional tag `v0.1-mvp`

### Week 3 “done” checklist
- [ ] Full MVP flow works without explaining code
- [ ] Both cost-entry modes demoable
- [ ] Ledger visible and understandable
- [ ] Tests pass for core formulas
- [ ] README run + demo instructions clear
- [ ] Literature folder is report-ready
- [ ] Nixon and Musonda can present any part

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

## Immediate next actions (today / tomorrow)

1. Create `backend/`, `frontend/`, and `docs/literature/` folders  
2. Decide DB: Supabase free **or** local Postgres  
3. **Nixon:** FastAPI + auth + models; start `docs/literature/sources.md` (literature lead)  
4. **Musonda:** React shell + products UI stub  
5. Pair: agree JSON shape for shipment + cost entry  

If you want, next step can be scaffolding the actual `backend/` and `frontend/` starter code in this repo.
