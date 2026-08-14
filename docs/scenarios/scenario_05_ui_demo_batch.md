# Scenario 05 — UI demo batch (FAN / BLD / KTL)

**Purpose:** Match the live Already-Local demo used in the app.  
**Local currency:** ZMW

## Inputs

| Field | Value |
|---|---|
| Shipment | SHP-2026-DEMO (or any ref) |
| Mode | Already-Local |
| Allocation | Quantity |
| Shipping | 4500 |
| Duty | 1200 |
| VAT | 1800 |
| Margin | 0.30 |

| SKU | Name | Qty | Weight/unit | Local unit |
|---|---|---:|---:|---:|
| FAN-001 | Standing Fan 16in | 10 | 5 | 520 |
| BLD-002 | Blender 1.5L | 5 | 3 | 780 |
| KTL-003 | Electric Kettle 2L | 10 | 1.5 | 260 |

## Spreadsheet expected (quantity)

Shares of 25 units:

| SKU | Ship | Duty | VAT | Product line | Landed unit | Suggested (×1.30) |
|---|---:|---:|---:|---:|---:|---:|
| FAN-001 | 1800 | 480 | 720 | 5200 | **820.00** | **1066.00** |
| BLD-002 | 900 | 240 | 360 | 3900 | **1080.00** | **1404.00** |
| KTL-003 | 1800 | 480 | 720 | 2600 | **560.00** | **728.00** |

## App replay

Products → shipment → items → save costs → allocate quantity → suggest 0.30 → choose auto or manual → commit → Stock / Record sale as needed.

## Result log

| Field | Spreadsheet | App | Pass? |
|---|---:|---:|---|
| FAN landed | 820.00 | | |
| BLD landed | 1080.00 | | |
| KTL landed | 560.00 | | |
| FAN suggested | 1066.00 | | |
| BLD suggested | 1404.00 | | |
| KTL suggested | 728.00 | | |
