# Scenario 05 — UI demo path (both demo shipments)

**Handout (viva folder):** [`../viva/Tranz-Algo_Demo_Shipment_Data.docx`](../viva/Tranz-Algo_Demo_Shipment_Data.docx)  
**How to use the app:** [`../viva/Tranz-Algo_How_to_Use_the_App.docx`](../viva/Tranz-Algo_How_to_Use_the_App.docx)  
**Regenerate all viva docs:** `python docs/viva/build_viva_docs.py`  
**Detail oracles:** Scenario 01 (A) · Scenario 02 (B) · Scenario 03 (comparator) · Scenario 04 (floor)

---

## Demo A — Already-Local → Scenario 01

| Field | Value |
|---|---|
| Reference | `SHP-DEMO-LOCAL-ZMW` |
| CSV | `samples/shipment_A_full.csv` |
| Allocation | Quantity · margin **0.30** |
| Landed | **170 / 107 / 160 / 120 / 93** |

## Demo B — Auto FX → Scenario 02

| Field | Value |
|---|---|
| Reference | `SHP-DEMO-AUTO-FX` |
| CSV | `samples/shipment_B_full.csv` |
| FX | Starts at **20** (or last fetched) → Fetch FX or set **27.50** for oracle |
| Allocation | Weight · margin **0.25** |
| Landed @27.50 | **181.25 / 175 / 57.50 / 115** |

---

## Replay (classroom)

1. Products → **Import CSV** (`samples/products_demo.csv`).  
2. Shipments → **Clear drafts** if re-importing → **Import** `shipment_A_full.csv` → True Cost → quantity → commit.  
3. Shipments → **Import** `shipment_B_full.csv` → Fetch FX (optional) → True Cost → weight → commit.  
4. Open a committed shipment → **Cost history** (When / What).  
5. Optional: re-open Demo A draft path and show **quantity vs weight** (Scenario 03) or drag margin below 10% (Scenario 04).

Line-only CSVs (`shipment_A_lines.csv` / `shipment_B_lines.csv`) still work on shipment detail.
