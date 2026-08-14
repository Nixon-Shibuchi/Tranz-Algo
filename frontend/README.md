# Tranz-Algo frontend

React (Vite) admin dashboard for the working MVP.

**How to use / product workflow:** root [`README.md`](../README.md)  
**Design (as-built):** [`docs/design/`](../docs/design/)

## What’s in the UI

- Login / Register, Dashboard (Start fresh), Products, Shipments + detail workflow
- Stock board + Record sale, Tax profiles
- Confirm dialogs; allocation results; suggest auto vs manual retail

## Setup

```powershell
cd frontend
npm install
npm run dev
```

App: http://127.0.0.1:5173  

API calls go to `/api/v1` and are proxied to `http://127.0.0.1:8000` in dev.  
Backend must be running (see root README).
