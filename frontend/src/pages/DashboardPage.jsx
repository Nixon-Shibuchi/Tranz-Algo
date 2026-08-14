import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { STOCK_STATUS_SHORT, stockStatus } from "../stock";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [s, inv] = await Promise.all([api("/reports/summary"), api("/inventory")]);
    setSummary(s);
    setInventory(inv);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  const stockSnap = useMemo(() => {
    let units = 0;
    let low = 0;
    let out = 0;
    const top = [...inventory]
      .filter((p) => Number(p.stock_on_hand || 0) > 0)
      .sort((a, b) => Number(b.stock_on_hand || 0) - Number(a.stock_on_hand || 0))
      .slice(0, 4);
    for (const p of inventory) {
      units += Number(p.stock_on_hand || 0);
      const s = stockStatus(p);
      if (s === "low") low += 1;
      if (s === "out") out += 1;
    }
    return { units, low, out, top };
  }, [inventory]);

  function openConfirm() {
    setError("");
    setOk("");
    setConfirmText("");
    setConfirmOpen(true);
  }

  function closeConfirm() {
    if (busy) return;
    setConfirmOpen(false);
    setConfirmText("");
  }

  async function confirmStartFresh() {
    if (confirmText.trim().toUpperCase() !== "RESET") return;
    setBusy(true);
    setError("");
    setOk("");
    try {
      const res = await api("/admin/reset-business-data", { method: "POST" });
      setOk(res.message || "Data cleared.");
      setConfirmOpen(false);
      setConfirmText("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
        </div>
        <div className="actions-inline">
          <button type="button" className="btn" onClick={openConfirm}>
            Start fresh
          </button>
          <Link className="btn primary" to="/products">
            Add products
          </Link>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {ok && <p className="success">{ok}</p>}

      <div className="cards">
        <div className="card stat">
          <div className="stat-label">Units available</div>
          <div className="stat-value">{stockSnap.units}</div>
          <p className="stat-note">
            <Link to="/inventory">View stock</Link>
          </p>
        </div>
        <div className="card stat">
          <div className="stat-label">Low / out</div>
          <div className="stat-value">
            <span className="stock-warn">{stockSnap.low}</span>
            <span className="muted"> / </span>
            <span className="stock-bad">{stockSnap.out}</span>
          </div>
        </div>
        <div className="card stat">
          <div className="stat-label">Drafts</div>
          <div className="stat-value">{summary?.draft_shipments ?? "—"}</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Committed</div>
          <div className="stat-value">{summary?.committed_shipments ?? "—"}</div>
        </div>
      </div>

      <div className="card dash-stock">
        <div className="table-head">
          <h2>On the shelf</h2>
          <Link to="/inventory">See all</Link>
        </div>
        {stockSnap.top.length === 0 ? (
          <p className="muted empty-state">No stock yet.</p>
        ) : (
          <ul className="dash-stock-list">
            {stockSnap.top.map((p) => (
              <li key={p.id}>
                <div>
                  <strong>{p.sku}</strong>
                  <div className="muted">{p.name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong>{p.stock_on_hand}</strong>
                  <div>
                    <span className={`badge stock-badge stock-${stockStatus(p)}`}>
                      {STOCK_STATUS_SHORT[stockStatus(p)]}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {confirmOpen && (
        <div className="modal-backdrop" role="presentation" onClick={closeConfirm}>
          <div
            className="modal-card card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="reset-title">Confirm start fresh</h2>
            <p>
              This permanently clears all products, shipments, tax profiles, and ledgers. Your
              login stays.
            </p>
            <p className="muted">Type <strong>RESET</strong> to continue.</p>
            <label>
              Confirmation
              <input
                autoFocus
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type RESET"
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={closeConfirm} disabled={busy}>
                Cancel
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={busy || confirmText.trim().toUpperCase() !== "RESET"}
                onClick={confirmStartFresh}
              >
                {busy ? "Clearing…" : "Yes, clear data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
