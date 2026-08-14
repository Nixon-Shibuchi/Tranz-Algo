# Related Work Draft — Tranz-Algo

**Project:** Tranz-Algo — Explainable landed-cost inventory orchestration with Margin-Guard  
**Author:** Nixon Shibuchi  
**Reviewer:** Musonda  
**Status:** Week 2 draft (expandable into final report Chapter “Related Work”)  
**Sources:** See `sources.md` (entries 1–12)

---

## 1. Introduction

Import-dependent retailers face a pricing problem that ordinary inventory and POS systems rarely solve well: shared freight, duty, and VAT must be recovered **per item**, often from mixed paperwork (foreign supplier invoices plus local clearing documents), while exchange-rate movement can later erase the intended margin. Literature and industry practice agree that **landed cost** is broader than purchase price, yet small and medium enterprises (SMEs) commonly rely on opaque spreadsheets or skip formal allocation altogether.

Tranz-Algo is positioned in the decision-support niche **between clearing paperwork and the selling price**. This draft reviews related systems and research, then maps each of Tranz-Algo’s core features to a concrete gap.

---

## 2. Landed cost and import logistics

Global logistics literature treats international procurement as a multi-cost journey: product, transport, customs, and related charges jointly determine commercial viability (Mangan & Lalwani, 2016). Academic modelling of total landed cost likewise warns that narrow cost scopes produce weak tactical decisions (Bonanni, 2011). Commercial inventory guidance defines landed cost as unit product cost plus freight, duties/taxes, and related fees—including FX effects—and notes that allocation drivers may be weight, quantity, or value (NetSuite). Industry ERP/transport case material further shows that folding freight into item cost materially changes unit economics (IJERT, 2023).

**Implication for Tranz-Algo:** shipment-batch costing with explicit shipping/tax allocation is not optional decoration; it is the economic core for import retailers.

---

## 3. FX risk and SME pricing behaviour

Exchange-rate volatility can significantly damage profitability for import-dependent firms, while formal hedging uptake is often limited (firm-level import study, DiVA). Local Zambian evidence similarly links Kwacha fluctuations to higher procurement costs and forced pricing adjustments among MSMEs (IJRISS, 2025). SME pricing studies report that base-currency movements strongly affect cost-based pricing operations (IJIRMM Enugu SME study). Classic pricing texts frame cost-plus markup as a practical starting point for many retailers, even when value-based methods are conceptually preferred (Nagle & Müller).

**Implication for Tranz-Algo:** a free FX data path (Frankfurter / fallback), manual rate override, and a post-pricing **Margin-Guard** are justified as operational tools for SMEs that do not run treasury hedges.

---

## 4. Comparable systems

### 4.1 POS and shop apps
POS systems optimise selling, payments, and receipts. They rarely allocate shared import charges with an auditable trail. Tranz-Algo deliberately does **not** replace checkout. The MVP’s optional **Record sale** only reduces stock for inventory truth; it is not a POS.

### 4.2 Basic inventory apps
Stock-in/stock-out apps track quantities and reorder points. They seldom encode dual paperwork modes or explain how shipping/duty was split across SKUs.

### 4.3 Spreadsheets
Excel can compute anything, but methods vary by user, formulas break silently, and viva/audit defence is weak. Tranz-Algo automates a frozen formula set and logs inputs in a True-Cost Ledger.

### 4.4 Shipping and clearing tools
These partners produce invoices and may convert some charges to local currency. They do not manage the retailer’s catalogue pricing decision or Margin-Guard rechecks.

### 4.5 ERP platforms (e.g. Odoo / SAP-class)
Full ERPs can include landed-cost modules and are powerful, but heavy to configure and often disproportionate for a small importer who mainly needs batch → true cost → suggested retail. Tranz-Algo is intentionally narrow and free-to-run (FastAPI + React + SQLite by default).

### Comparison summary

| System type | Import batch true cost? | Dual Auto FX / Already-Local? | Allocation comparator? | Margin recheck? | Fit for small import retailer |
|---|---|---|---|---|---|
| POS | Rarely | No | No | No | Selling-focused |
| Basic inventory | Weak | Usually no | Usually no | No | Quantity-focused |
| Excel | Possible, fragile | Manual only | Opaque | Rare | Common but risky |
| Shipping/clearing | Paperwork only | Partial conversion | No retail pricing | No | Partner, not pricing system |
| ERP | Often yes | Varies | Possible, heavy | Possible | Often too broad |
| **Tranz-Algo** | **Yes** | **Yes** | **Yes** | **Yes (Margin-Guard)** | **Built for this niche** |

---

## 5. Feature-to-gap mapping

| Tranz-Algo feature | Gap in related work | How the feature responds |
|---|---|---|
| **Dual cost-entry modes** (Auto FX / Already-Local / mixed) | Tools usually force one workflow; real paperwork is mixed | Accept foreign unit prices *or* shipper-local amounts on the same batch |
| **Allocation Comparator** (quantity vs weight) | Allocation method is hidden or single-choice without comparison | Show how method choice changes landed unit cost |
| **True-Cost Ledger** | Spreadsheet/POS results lack explainable audit trail | Persist event snapshots (rates, shares, suggestions, commits) |
| **Price suggestion** `RP = Landed × (1 + margin)` | Markup often ad-hoc | Configurable, reproducible rule with optional manual override |
| **Margin-Guard** | Prices set once; FX later ignored | Recheck active retail vs safe floor |
| **Stock board + Record sale** | Inventory apps lack cost story; POS lacks true cost | Stock rises on commit, falls on simple stock-out—without becoming a till |

---

## 6. Engineering and stack context

The prototype follows practitioner software-engineering emphasis on verifiable critical logic (Pressman & Maxim): costing formulas are unit-tested against worked examples. Implementation uses Python/FastAPI and React (Vite), with SQLite for zero-setup local demo and optional Postgres via `DATABASE_URL`. Auto FX uses free Frankfurter rates with fallback/cache/manual override so the project remains free-to-build.

---

## 7. Conclusion

Related systems either sell (POS), count stock (inventory), move goods (shipping), compute ad-hoc (Excel), or do everything (ERP). Few free, SME-scale tools combine **mixed import paperwork**, **comparable allocation**, **auditable true cost**, and **post-pricing FX safety**. That is the gap Tranz-Algo fills.

---

## References (short form)

Full annotated bibliography: `docs/literature/sources.md`.  
Gap seed paragraph: `docs/literature/gap_statement.md`.
