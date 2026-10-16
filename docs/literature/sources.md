# Tranz-Algo — Literature Sources (complete)

**Owner:** Nixon Shibuchi (literature lead)  
**Reviewer:** Musonda Katongo  
**Status:** Complete  
**Purpose:** Annotated source list for related work on inventory systems, landed cost, FX risk, pricing rules, and comparable tools.

---

## How to use this file

- Each entry has a citation, topic tag(s), and a short note on relevance to Tranz-Algo.
- Narrative write-up: **`related_work_v1.md`** (canonical).
- Prefer citing the academic/practitioner sources below in the final report; blog posts are supporting context only.

---

## Annotated sources (12)

### 1. Software engineering / system development
**R. S. Pressman and B. R. Maxim, *Software Engineering: A Practitioner’s Approach*, 9th ed. McGraw-Hill, 2020.**  
**Tags:** methodology, requirements, verification  

Supports the project’s engineering approach: clear requirements freeze for financial formulas, module verification, and testing of critical calculation logic before integration. Useful when justifying Waterfall-with-checks for landed-cost correctness.

### 2. Python implementation reference
**B. Lubanovic, *Introducing Python: Modern Computing in Simple Packages*, 2nd ed. O’Reilly Media, 2019.**  
**Tags:** implementation, Python  

Background reference for the FastAPI/Python backend. Not a domain paper, but valid technical support for language choice and maintainable numeric/service code in the prototype.

### 3. Global logistics & supply chain (landed cost context)
**J. Mangan and C. Lalwani, *Global Logistics and Supply Chain Management*. John Wiley & Sons, 2016.**  
**Tags:** logistics, import costs, supply chain  

Establishes that international retail cost is broader than supplier invoice price: freight, customs, and related logistics costs affect landed cost and commercial decisions. Frames why inventory systems for importers must handle shared shipment charges.

### 4. Total landed cost modelling (academic case study)
**A. Bonanni, “Total Landed Cost for Tactical Supply Chain Decisions,” M.Sc. thesis, Politecnico di Milano, 2011.**  
Available: https://www.politesi.polimi.it/  
**Tags:** landed cost, cost allocation, decision support  

Shows that limited cost scopes lead to weak decisions, and that a wider landed-cost view (transport, customs, handling, inventory-related costs) improves understanding of profitability. Supports Tranz-Algo’s focus on transparent total cost before retail pricing.

### 5. Landed cost in inventory/ERP practice
**Oracle NetSuite, “Why You Need to Calculate Landed Cost,” Inventory Management resource.**  
https://www.netsuite.com/portal/resource/articles/inventory-management/landed-cost.shtml  
**Tags:** landed cost, inventory systems, commercial practice  

Practitioner definition of landed cost (unit cost + freight + duties/taxes + related fees, including FX effects). Notes that weight, value, or quantity can drive fee allocation—directly relevant to Tranz-Algo’s Allocation Comparator.

### 6. Freight allocation impact on landed cost (industry/technical)
**“Maximizing Profitability through Landed Cost Optimization with SAP Transportation Management,” *International Journal of Engineering Research & Technology (IJERT)*, vol. 12, no. 7, 2023.**  
https://www.ijert.org/research/maximizing-profitability-through-landed-cost-optimization-with-sap-transportation-management-IJERTV12IS070092.pdf  
**Tags:** allocation, freight, ERP  

Illustrates that allocating freight into item landed cost materially changes unit economics (reported average freight uplift around 14% in their example). Reinforces why SMEs need per-item allocation, not only a shipment total.

### 7. FX volatility and import-dependent firm profitability
**Thesis: “The Impact of Exchange Rate Volatility on Profitability and Hedging Behavior of Import Dependent Firms,” DiVA / emerging-market firm-level study (Colombo Stock Exchange context).**  
https://www.diva-portal.org/smash/get/diva2:2012289/FULLTEXT01.pdf  
**Tags:** FX risk, import firms, profitability  

Finds exchange-rate volatility can significantly hurt profitability for import-dependent firms, while formal hedging uptake is limited. Supports operational FX tools (Fetch FX / manual rate) and cost-plus repricing, not only financial hedges.

### 8. Zambian MSMEs and Kwacha fluctuations (local relevance)
**“Exploring the Influence of Kwacha Fluctuations on Medium Small and Micro Enterprises (MMSMEs) Profitability: A Case of Choma District, Southern Zambia,” *International Journal of Research and Innovation in Social Science (IJRISS)*, 2025.**  
https://doi.org/10.47772/ijriss.2025.91100274  
**Tags:** Zambia, MSMEs, FX, pricing  

Local evidence that currency fluctuations raise procurement costs and force pricing/margin adjustments for MSMEs. Strong justification for a Zambia-oriented import pricing support tool and for keeping FX-aware features in Tranz-Algo.

### 9. Exchange rate effects on SME pricing behaviour
**Study on exchange rate and SME pricing operations (Enugu State SME manufacturing sample; cost-based pricing findings).**  
*International Journal of Interdisciplinary Research in Marketing and Management (IJIRMM)* — “Effect of Exchange Rate on Pricing in Business Operations of SMEs in Enugu State.”  
https://sadijournals.org/index.php/IJIRMM/article/view/643  
**Tags:** SME pricing, cost-plus, FX pass-through  

Reports that base-currency/exchange movements significantly affect cost-based pricing. Aligns with Tranz-Algo’s rule `Suggested RP = Landed Cost × (1 + margin)` as a practical SME pricing response to cost shocks.

### 10. Cost-oriented retail / markup pricing (conceptual)
**Nagle, T. T., and Müller, G., *The Strategy and Tactics of Pricing*, (recent ed.). Pearson.**  
**Tags:** pricing, margin, cost-plus  

Classic pricing reference distinguishing cost-plus and value-based approaches. Tranz-Algo intentionally starts from cost-plus with safety margin (SME-practical), while remaining open to later competitive overrides entered manually.

### 11. Open-source ERP inventory comparison (Odoo)
**Odoo Documentation — Inventory / Purchase / Landed Costs applications.**  
https://www.odoo.com/documentation/  
**Tags:** ERP, inventory, comparison baseline  

Represents full ERP capability (including landed costs in broader suites). Useful contrast: powerful but heavy for many student/SME contexts. Tranz-Algo is intentionally narrower—explainable import-batch costing and price suggestion without full ERP scope.

### 12. Free FX reference data (technical source for Auto FX mode)
**Frankfurter API documentation (ECB reference rates).**  
https://www.frankfurter.app/docs/  
**Tags:** FX API, free data, Auto FX mode  

Documents a free exchange-rate source suitable for Auto FX mode. Supports the project’s zero paid-licence goal and the need for cache/fallback when live FX is unavailable.

---

## Comparison table

| System type | Main job | Handles import shipment batch costing? | Dual Auto FX / Already-Local entry? | Explainable allocation comparison? | Audit / margin guard after pricing? | Fit for small import retailer |
|---|---|---|---|---|---|---|
| **POS / shop apps** | Sell & take payment | Rarely | No | No | No | Good for selling, weak for true import cost |
| **Basic inventory apps** | Stock in/out | Weak / manual | Usually no | Usually no | No | Tracks quantity more than true cost |
| **Excel / spreadsheets** | Ad-hoc calculation | Possible but fragile | Manual only | Possible but opaque | Rarely automated | Common, error-prone, hard to audit |
| **Shipping / clearing tools** | Move/clear goods; produce invoices | Produces cost paperwork | Shipper may convert some charges | Does not price your retail catalogue | No | Necessary logistics partner, not a pricing system |
| **ERP (e.g. Odoo/SAP-class)** | Broad enterprise ops | Often yes (complex setup) | Varies; enterprise workflows | Possible but heavy | Possible with config | Often too costly/complex for small SMEs |
| **Tranz-Algo** | Import true-cost → suggested price → batch inventory | **Yes (core)** | **Yes (core)** | **Yes (comparator)** | Cost history + safety floor on adjust | Built for this niche |

### Reading the table
Most similar student projects stop at inventory CRUD or simple markup. Commercial ERPs can do landed cost but are broad and heavy. Shipping companies may convert freight to local currency, but they do not allocate all import costs across a retailer’s SKUs or guard margins later. **Tranz-Algo’s difference is the decision-support niche between paperwork and selling price.**

**Implementation note (current MVP):** Tranz-Algo now includes a simple **Record sale** stock-out so on-hand quantities stay truthful after commit. This is **not** a POS—there are no payments, customers, or receipts. Sales remain out of the core academic claim; the claim stays landed-cost explanation + dual modes + Cost history / True-Cost Ledger.

---

## Source coverage checklist

| Required topic | Sources covering it | Done |
|---|---|---|
| Inventory / retail management systems | 5, 11 | Yes |
| Landed cost and import logistics | 3, 4, 5, 6 | Yes |
| Currency risk / exchange rates in trade | 7, 8, 9, 12 | Yes |
| Algorithmic / rule-based retail pricing | 9, 10 | Yes |
| Open-source ERP/inventory tools (comparison) | 11 | Yes |
| Engineering / implementation support | 1, 2 | Yes |

---

## Pack completeness

- [x] Annotated sources 1–12  
- [x] Comparison table (tool classes vs Tranz-Algo)  
- [x] Gap statement (`gap_statement.md`)  
- [x] Related work narrative (`related_work_v1.md`)  
- [x] Evaluation scenarios linked (`docs/scenarios/`, `eval_note.md`)
