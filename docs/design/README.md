# Design artefacts — complete pack

Design freeze for Tranz-Algo MVP, updated to match the **as-built** system. Use these files in the report and viva.  
**Diagrams refreshed:** 2026-10-15 (ERD, architecture, costing flow, GoF/FX chain, wireframes, status lifecycle).

| File | Contents | Diagrams | Status |
|---|---|---|---|
| [architecture.md](./architecture.md) | Three-tier stack, modules, proposal→as-built deltas | Mermaid: tiers, modules, True Cost flow + ASCII | Complete |
| [erd.md](./erd.md) | ERD + data dictionary (incl. `sales`, ledger) | Mermaid ERD + ASCII + status state diagram | Complete |
| [api_endpoints.md](./api_endpoints.md) | FastAPI `/api/v1` routes + payload shapes | — (tables) | Complete |
| [cost_modes_and_formulas.md](./cost_modes_and_formulas.md) | Dual modes, formulas, worked examples | Mermaid cost-mode flow | Complete |
| [wireframes.md](./wireframes.md) | Screen layouts + as-built UI notes | ASCII screen boxes | Complete |
| [software_engineering_principles.md](./software_engineering_principles.md) | Lehman’s laws + GRASP + GoF mapping | Mermaid layers + GoF class + FX chain | Complete |

**Runtime:** root [`README.md`](../../README.md)  
**Evaluation:** [`../scenarios/`](../scenarios/)  
**Literature:** [`../literature/`](../literature/) (complete pack)  
**Viva aids:** [`../viva/`](../viva/)

### Accepted technology deltas (summary)

- Frontend: **React web** (Vite), not React Native/Expo  
- Database: **PostgreSQL** primary (`DATABASE_URL`); SQLite fallback  
- FX: on-demand providers + cache/manual (not a live ticker)  

Full justification: [`architecture.md`](./architecture.md) and `docs/viva/Tranz-Algo_Technology_Justification_and_Viva_QA.docx`.
