# Week 1 Gap Statement — Why Dual Modes and Explainable Allocation Matter

**Project:** Tranz-Algo  
**Author:** Nixon Shibuchi  
**Reviewer:** Musonda  
**Length:** ~half page (report-ready seed)

---

Import-dependent SMEs, including many Zambian retailers, often know their supplier invoice and receive shipping/clearing documents, yet still fail to recover a trustworthy **per-item true cost**. Literature and practice show that landed cost must include more than purchase price—freight, duty, VAT, and related charges change unit economics and therefore retail viability. At the same time, exchange-rate movements can erase margins after a selling price has already been set, especially for firms that do not use formal FX hedges.

Existing tools only partly solve this. POS and basic inventory systems track sales or stock counts but rarely allocate shared import charges across items with an auditable trail. Spreadsheets can compute landed cost, but methods are inconsistent, opaque, and hard to defend. Shipping and clearing companies may convert some charges into local currency, which helps paperwork, but they do not manage the retailer’s full catalogue pricing decision. Full ERP platforms can include landed-cost modules, yet they are often too broad or heavy for small importers who mainly need a clear path from shipment batch to safe retail price.

The gap Tranz-Algo targets is therefore not “another inventory app.” It is **explainable import-batch costing and price suggestion under mixed real-world paperwork**. Two design choices address that gap directly. First, **dual cost-entry modes** (Auto FX and Already-Local) accept both foreign supplier invoices and shipper/agent-converted local amounts, including mixed batches. Second, an **Allocation Comparator** and **True-Cost Ledger** make shipping/tax allocation visible and traceable, instead of hiding a single formula. Together with Margin-Guard, these features aim to improve accuracy and confidence versus spreadsheet practice—the core academic and practical contribution of the project.

**Status note:** The working MVP implements the above (plus a lightweight Record sale for stock reduction after commit). Full POS checkout remains out of scope; stock-out exists only so inventory stays consistent with goods leaving the shelf.
