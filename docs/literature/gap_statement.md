# Gap Statement — Why Dual Modes and Explainable Allocation Matter

**Project:** Tranz-Algo  
**Author:** Nixon Shibuchi  
**Reviewer:** Musonda Katongo  
**Status:** Complete (report-ready)  
**Length:** ~half page

---

Import-dependent SMEs, including many Zambian retailers, often know the supplier invoice and receive shipping/clearing documents, yet still fail to recover a trustworthy **per-item true cost**. Literature and practice show that landed cost must include more than purchase price—freight, duty, VAT, and related charges change unit economics and therefore retail viability. At the same time, exchange-rate movements can erase margins after a selling price has already been set, especially for firms that do not use formal FX hedges.

Existing tools only partly solve this. POS and basic inventory systems track sales or stock counts but rarely allocate shared import charges across items with an auditable trail. Spreadsheets can compute landed cost, but methods are inconsistent, opaque, and hard to defend. Shipping and clearing companies may convert some charges into local currency, which helps paperwork, but they do not manage the retailer’s full catalogue pricing decision. Full ERP platforms can include landed-cost modules, yet they are often too broad or heavy for small importers who mainly need a clear path from shipment batch to safe retail price.

The gap Tranz-Algo targets is therefore not “another inventory app.” It is **explainable import-batch costing and price suggestion under mixed real-world paperwork**. Two design choices address that gap directly. First, **dual cost-entry modes** (Auto FX and Already-Local) accept both foreign supplier invoices and shipper/agent-converted local amounts. Second, an **Allocation Comparator** and **Cost history / True-Cost Ledger** make shipping/tax allocation visible and traceable, instead of hiding a single formula. Together these features aim to improve accuracy and confidence versus spreadsheet practice—the core academic and practical contribution of the project.

**Implementation note:** The working MVP realises the above in a FastAPI + React web admin on **PostgreSQL** (SQLite fallback), with Cost history on commit, a safety floor on True Cost price adjust (`Landed × 1.1`), and a lightweight Record sale for stock reduction after commit. Full POS checkout and legal customs assessment APIs remain out of scope.
