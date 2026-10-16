# Tranz-Algo frontend

React (Vite) admin dashboard for the working MVP.

**How to use / viva:** [`docs/viva/`](../docs/viva/) (Word guides)  
**Design (as-built):** [`docs/design/`](../docs/design/)

## What’s in the UI

- Welcome landing, Login / Register, colour modes
- True Cost studio (allocate, suggest or override retail, commit)
- Dashboard (Start fresh), Products, Shipments + detail (lines and costs)
- Stock board + Record sale
- Cost history on committed shipments; Clear drafts on Shipments
- Confirm dialogs; Fetch FX only for Auto FX batches

## Setup

```powershell
cd frontend
npm install
npm run dev
```

App: http://127.0.0.1:5173  

API calls go to `/api/v1` and are proxied to `http://127.0.0.1:8000` in dev.  
Backend must be running (see root README).
