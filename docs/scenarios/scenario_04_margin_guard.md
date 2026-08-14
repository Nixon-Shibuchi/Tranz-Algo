# Scenario 04 — Margin-Guard

**Purpose:** Demonstrate alert when active retail falls below safe floor.

## Setup

Use Scenario 01 item FAN-A after commit with accepted retail **880.00** (suggested at 25%).

Assume a later recompute (or hypothetical landed increase) gives:

| Field | Value |
|---|---:|
| Active retail | 880.00 |
| Recomputed landed unit | 820.00 |
| Safety margin | 0.10 |

## Spreadsheet floor

```text
Floor = 820.00 × (1 + 0.10) = 902.00
880.00 < 902.00 → ALERT
```

## App replay

1. Commit Scenario 01 with suggested prices (FAN = 880).  
2. On shipment detail, run **Margin-Guard → Recheck** after adjusting conditions that raise landed cost *or* document the numerical floor check in the viva using this oracle if live recompute path differs.  
3. Expected conceptual outcome: alert when active < floor.

## Pass criterion

Floor arithmetic matches `landed × (1 + safety)` within 0.01; alert fires when active retail is below floor.
