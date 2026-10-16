# Related Work — Tranz-Algo (v1, complete)

**Project:** Tranz-Algo  
**Authors:** Nixon Shibuchi (lead), Musonda Katongo (review)  
**Status:** Complete — report-ready  
**Use:** Paste into final project report “Related Work / Literature Review” (edit voice to match chapter style)  
**Sources:** `sources.md` entries 1–12  

---

## 1. Opening

Import retailers frequently know the supplier invoice and receive clearing documents, yet still cannot state a defensible **per-item true cost**. Shared freight and tax, mixed foreign/local paperwork, and later exchange-rate movement jointly undermine cost-plus pricing. This section reviews related systems and research and situates Tranz-Algo as explainable **shipment-batch costing and price suggestion**, not as a general POS or ERP.

## 2. Landed cost beyond the invoice

Logistics and supply-chain texts treat international cost as multi-component (product, freight, customs, and related charges) rather than supplier price alone (Mangan & Lalwani, 2016). Total landed cost studies argue that incomplete cost scopes distort decisions (Bonanni, 2011). Practitioner inventory guidance defines landed cost as product cost plus freight, duties/taxes, and related fees—including FX—and recognises weight, quantity, or value as allocation bases (NetSuite). ERP/transport literature similarly shows freight allocation changing unit profitability (IJERT, 2023). Together, these sources justify Tranz-Algo’s batch-first design and Allocation Comparator.

## 3. Currency risk and SME pricing

Import-dependent firms can lose profitability under exchange-rate volatility while remaining under-hedged (DiVA import-firm study). Zambian MSME evidence links Kwacha fluctuations to procurement-cost pressure and forced price adjustment (IJRISS, 2025). SME pricing research reports strong FX effects on cost-based pricing behaviour (IJIRMM). Cost-plus markup remains a practical SME pricing posture (Nagle & Müller). Tranz-Algo therefore supports Auto FX with free rate sources (Frankfurter documentation), cache/manual fallback, and suggested retail `Landed × (1 + margin)`, with an auditable Cost history after commit.

## 4. Competing tool classes

**POS applications** excel at checkout but rarely recover shared import charges with an audit trail. **Basic inventory tools** track stock counts more than explainable landed cost. **Spreadsheets** can encode any formula yet are fragile and hard to defend. **Shipping/clearing systems** produce paperwork—they do not set catalogue retail prices. **ERP suites** (for example Odoo landed-cost modules) can implement sophisticated costing but are heavy for many small importers. Tranz-Algo occupies the narrow gap: dual Auto FX / Already-Local entry, allocation comparison, Cost history / True-Cost Ledger, and batch-linked stock—with optional stock-out recording that is **not** a payment POS.

## 5. Contribution relative to the gap

The project’s academic claim is that **explainability under mixed paperwork** is the missing SME capability. Dual modes accept real document mixtures; the comparator makes allocation choice visible; Cost history preserves inputs and outcomes. Evaluation against spreadsheet oracles (`docs/scenarios/`, tolerance ≤ 0.01 ZMW) evidences formula accuracy rather than asserting uniqueness rhetorically.

## 6. Engineering positioning (brief)

Related work on system construction supports clear requirements for financial logic and verification of critical calculations (Pressman & Maxim, 2020). Tranz-Algo implements a FastAPI service core with a React web administrative dashboard and relational persistence (**PostgreSQL** primary via `DATABASE_URL`; **SQLite** fallback). This differs from an early proposal sketch that named React Native as the primary client; the refinement prioritises the costing engine and desk-based admin workflow while preserving the three-tier idea (presentation → API → data). Patterns such as Strategy for allocation/cost modes and a Facade for commit workflows keep the system evolvable (see `docs/design/software_engineering_principles.md`).

## 7. Closing

Most similar apps manage selling or stock counts. Tranz-Algo answers: what did this imported item actually cost, what should it sell for, and is that price still safe when rates or paperwork change?

---

## Feature → gap map (summary)

| Feature | Gap addressed |
|---|---|
| Dual Auto FX / Already-Local | Mixed real-world paperwork |
| Allocation Comparator | Opaque / inconsistent split of shared charges |
| Cost history / True-Cost Ledger | Weak audit trail vs spreadsheets |
| Batch-linked stock + Record sale | Inventory truth after commit (not POS) |

## Bibliography pointer

Cite from `docs/literature/sources.md` (entries 1–12). Prefer academic/practitioner sources over unannotated blogs.
