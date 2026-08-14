import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useConfirm } from "../components/ConfirmDialog";
import { modeLabel } from "../format";

export default function ShipmentsPage() {
  const navigate = useNavigate();
  const [askConfirm, confirmDialog] = useConfirm();
  const [rows, setRows] = useState([]);
  const [showMore, setShowMore] = useState(false);
  const [form, setForm] = useState({
    reference: "",
    supplier_name: "",
    invoice_number: "",
    clearing_agent: "",
    carrier_name: "",
    origin_country: "",
    destination: "Zambia",
    expected_arrival_date: "",
    received_date: "",
    primary_cost_mode: "already_local",
    currency_foreign: "USD",
    currency_local: "ZMW",
    notes: "",
  });
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    setRows(await api("/shipments"));
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    const confirmed = await askConfirm({
      title: "Create shipment?",
      message: `Create batch ${form.reference || "with these details"}?`,
      confirmLabel: "Yes, create",
    });
    if (!confirmed) return;
    setError("");
    try {
      const created = await api("/shipments", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          currency_local: "ZMW",
          invoice_number: form.invoice_number || null,
          clearing_agent: form.clearing_agent || null,
          carrier_name: form.carrier_name || null,
          origin_country: form.origin_country || null,
          destination: form.destination || "Zambia",
          expected_arrival_date: form.expected_arrival_date || null,
          received_date: form.received_date || null,
          notes: form.notes || null,
        }),
      });
      navigate(`/shipments/${created.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function onDelete(r) {
    if (r.status === "committed") {
      setError("Committed shipments cannot be deleted.");
      return;
    }
    const confirmed = await askConfirm({
      title: "Delete shipment?",
      message: `Permanently delete ${r.reference}? This cannot be undone.`,
      confirmLabel: "Yes, delete",
      danger: true,
    });
    if (!confirmed) return;
    setError("");
    setOk("");
    try {
      await api(`/shipments/${r.id}`, { method: "DELETE" });
      setOk("Shipment deleted.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      {confirmDialog}
      <div className="page-head">
        <div>
          <h1>Shipments</h1>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {ok && <p className="success">{ok}</p>}

      <form className="card form-grid" onSubmit={onCreate}>
        <h2>New shipment</h2>
        <label>
          Reference *
          <input
            required
            placeholder="SHP-2026-001"
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
          />
        </label>
        <label>
          Supplier
          <input
            value={form.supplier_name}
            onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
          />
        </label>
        <label>
          Primary mode
          <select
            value={form.primary_cost_mode}
            onChange={(e) => setForm({ ...form, primary_cost_mode: e.target.value })}
          >
            <option value="already_local">Already-Local</option>
            <option value="auto_fx">Auto FX</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>
        <label>
          Foreign currency
          <input
            value={form.currency_foreign}
            onChange={(e) => setForm({ ...form, currency_foreign: e.target.value })}
          />
        </label>
        <label>
          Local currency
          <input value="ZMW" readOnly />
        </label>

        <div className="span-2 actions-inline">
          <button type="button" className="btn link" onClick={() => setShowMore((v) => !v)}>
            {showMore ? "Hide extra fields" : "Show extra fields"}
          </button>
        </div>

        {showMore && (
          <>
            <label>
              Supplier invoice #
              <input
                value={form.invoice_number}
                onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
              />
            </label>
            <label>
              Clearing agent
              <input
                value={form.clearing_agent}
                onChange={(e) => setForm({ ...form, clearing_agent: e.target.value })}
              />
            </label>
            <label>
              Carrier / shipper
              <input
                value={form.carrier_name}
                onChange={(e) => setForm({ ...form, carrier_name: e.target.value })}
              />
            </label>
            <label>
              Origin country
              <input
                value={form.origin_country}
                onChange={(e) => setForm({ ...form, origin_country: e.target.value })}
              />
            </label>
            <label>
              Destination
              <input
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
              />
            </label>
            <label>
              Expected arrival
              <input
                type="date"
                value={form.expected_arrival_date}
                onChange={(e) => setForm({ ...form, expected_arrival_date: e.target.value })}
              />
            </label>
            <label>
              Received date
              <input
                type="date"
                value={form.received_date}
                onChange={(e) => setForm({ ...form, received_date: e.target.value })}
              />
            </label>
            <label className="span-2">
              Notes
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </label>
          </>
        )}

        <div className="span-2 actions-inline">
          <button className="btn primary">Create shipment</button>
        </div>
      </form>

      <div className="card table-wrap">
        <div className="table-head">
          <h2>Shipment list</h2>
          <span className="muted">{rows.length} shipment(s)</span>
        </div>
        {rows.length === 0 ? (
          <p className="muted empty-state">No shipments yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ref</th>
                <th>Supplier</th>
                <th>Mode</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.reference}</td>
                  <td>{r.supplier_name || "—"}</td>
                  <td>
                    <span className="badge">{modeLabel(r.primary_cost_mode)}</span>
                  </td>
                  <td>
                    <span className={`badge status-${r.status}`}>{r.status}</span>
                  </td>
                  <td className="row-actions">
                    <Link className="btn ghost" to={`/shipments/${r.id}`}>
                      Open
                    </Link>
                    {r.status !== "committed" && (
                      <button
                        type="button"
                        className="btn ghost danger-text"
                        onClick={() => onDelete(r)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
