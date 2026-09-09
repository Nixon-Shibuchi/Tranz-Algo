# Tranz-Algo frontend

React (Vite) admin dashboard for the working MVP.

**How to use / product workflow:** root [`README.md`](../README.md)  
**Design (as-built):** [`docs/design/`](../docs/design/)

## What’s in the UI

- Welcome carousel, Login / Register, colour modes
- True Cost studio (allocate, suggest or override retail, commit)
- Dashboard (Start fresh), Products, Shipments + detail (lines and costs)
- Stock board + Record sale, Tax profiles
- Confirm dialogs; Margin-Guard on shipment detail

## Setup

```powershell
cd frontend
npm install
npm run dev
```

App: http://127.0.0.1:5173  

API calls go to `/api/v1` and are proxied to `http://127.0.0.1:8000` in dev.  
Backend must be running (see root README).
