# Literature pack — complete

Report-ready literature for Tranz-Algo. Use these files for the Related Work / Literature Review chapter and viva.

| File | Role | Status |
|---|---|---|
| [sources.md](./sources.md) | Annotated citations (1–12) + comparison table | Complete |
| [gap_statement.md](./gap_statement.md) | Half-page research gap | Complete |
| [related_work_v1.md](./related_work_v1.md) | Report-ready related work narrative | Complete (canonical) |
| [Tranz-Algo_Contribution_Split.docx](./Tranz-Algo_Contribution_Split.docx) | Nixon / Musonda work division (design joint; code mostly Nixon) | Complete (also in `../viva/`) |

**Also cite in report / viva**

- Evaluation evidence: [`../scenarios/`](../scenarios/) (`eval_note.md` + scenarios 01–05)  
- Design/tech positioning: [`../design/architecture.md`](../design/architecture.md)  
- Oral rehearsal: [`../viva/`](../viva/)  
- Contribution declaration: [Tranz-Algo_Contribution_Split.docx](./Tranz-Algo_Contribution_Split.docx)

### Claims the literature pack supports

1. Landed cost is multi-component (product + freight + tax + related charges).  
2. FX volatility pressures import SME margins (incl. Zambia-relevant evidence).  
3. POS / basic inventory / spreadsheets / clearing tools / heavy ERP leave a niche gap.  
4. Tranz-Algo’s dual modes, allocation explainability, and Cost history / True-Cost Ledger address that gap.  
5. MVP evaluation uses spreadsheet oracles (≤ 0.01 ZMW), not rhetorical uniqueness alone.

**App alignment (as built):** dual modes (Already-Local / Auto FX), True Cost studio, Allocation Comparator, Cost history on commit, stock board, Record sale (stock-out only — **not** POS). Frontend is **React web**; DB is **PostgreSQL** (SQLite fallback).
