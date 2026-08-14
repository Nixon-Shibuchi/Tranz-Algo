# Related Work — Tranz-Algo (v1)

**Project:** Tranz-Algo  
**Authors:** Nixon Shibuchi (lead), Musonda (review)  
**Status:** Report-ready polish of `related_work_draft.md`  
**Use:** Paste into final project report “Related Work / Literature Review” section (edit voice to match chapter style)

---

## Opening

Import retailers frequently know the supplier invoice and receive clearing documents, yet still cannot state a defensible **per-item true cost**. Shared freight and tax, mixed foreign/local paperwork, and later exchange-rate movement jointly undermine cost-plus pricing. This section reviews related systems and research and situates Tranz-Algo as explainable **shipment-batch costing and price suggestion**, not as a general POS or ERP.

## Landed cost beyond the invoice

Logistics and supply-chain texts treat international cost as multi-component (product, freight, customs, and related charges) rather than supplier price alone (Mangan & Lalwani, 2016). Total landed cost studies argue that incomplete cost scopes distort decisions (Bonanni, 2011). Practitioner inventory guidance defines landed cost as product cost plus freight, duties/taxes, and related fees—including FX—and recognises weight, quantity, or value as allocation bases (NetSuite). ERP/transport literature similarly shows freight allocation changing unit profitability (IJERT, 2023). Together, these sources justify Tranz-Algo’s batch-first design and Allocation Comparator.

## Currency risk and SME pricing

Import-dependent firms can lose profitability under exchange-rate volatility while remaining under-hedged (DiVA import-firm study). Zambian MSME evidence links Kwacha fluctuations to procurement-cost pressure and forced price adjustment (IJRISS, 2025). SME pricing research reports strong FX effects on cost-based pricing behaviour (IJIRMM). Cost-plus markup remains a practical SME pricing posture (Nagle & Müller). Tranz-Algo therefore supports Auto FX with free rate sources (Frankfurter documentation), cache/manual fallback, suggested retail `Landed × (1 + margin)`, and Margin-Guard alerts when active prices fall below a safety floor.

## Competing tool classes

**POS applications** excel at checkout but rarely recover shared import charges with an audit trail. **Basic inventory tools** track stock counts more than explainable landed cost. **Spreadsheets** can encode any formula yet are fragile and hard to defend. **Shipping/clearing systems** produce paperwork—they do not set catalogue retail prices. **ERP suites** (for example Odoo landed-cost modules) can implement sophisticated costing but are heavy for many small importers. Tranz-Algo occupies the narrow gap: dual Auto FX / Already-Local entry, allocation comparison, True-Cost Ledger, Margin-Guard, and batch-linked stock—with optional stock-out recording that is **not** a payment POS.

## Contribution relative to the gap

The project’s academic claim is that **explainability under mixed paperwork** is the missing SME capability. Dual modes accept real document mixtures; the comparator makes allocation choice visible; the ledger preserves inputs and outcomes; Margin-Guard addresses post-pricing FX risk. Evaluation against spreadsheet oracles (see `docs/scenarios/`) is intended to evidence accuracy rather than assert uniqueness rhetorically.

## Closing

Most similar apps manage selling or stock counts. Tranz-Algo answers: what did this imported item actually cost, what should it sell for, and is that price still safe when rates or paperwork change?

---

## Bibliography pointer

Cite from `docs/literature/sources.md` (entries 1–12). Do not rely on unannotated blog posts as primary academic evidence.
