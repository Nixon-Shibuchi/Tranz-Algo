import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useConfirm } from "../components/ConfirmDialog";
import {
  FormActions,
  FormField,
  FormFold,
  FormPanel,
  FormSection,
  ModeCards,
} from "../components/WorkspaceForm";
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

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const showFx = form.primary_cost_mode === "auto_fx" || form.primary_cost_mode === "mixed";

  return (
    <div>
      {confirmDialog}
      <div className="page-head">
        <div>
          <span className="page-kicker">Batches</span>
          <h1>Shipments</h1>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {ok && <p className="success">{ok}</p>}

      <FormPanel
        kicker="New batch"
        title="Create shipment"
        hint="Start with a reference and cost mode. You will add lines and paperwork totals on the next screen."
        onSubmit={onCreate}
      >
        <FormSection columns={2}>
          <FormField label="Reference" required id="ship-ref" hint="Your internal batch code.">
            <input
              id="ship-ref"
              required
              placeholder="SHP-LOC-2026-01"
              value={form.reference}
              onChange={set("reference")}
            />
          </FormField>
          <FormField label="Supplier" id="ship-supplier">
            <input
              id="ship-supplier"
              placeholder="Cape Clean Supplies"
              value={form.supplier_name}
              onChange={set("supplier_name")}
            />
          </FormField>
        </FormSection>

        <FormSection>
          <ModeCards
            value={form.primary_cost_mode}
            onChange={(mode) => setForm({ ...form, primary_cost_mode: mode })}
          />
        </FormSection>

        <FormSection columns={showFx ? 2 : 1}>
          {showFx && (
            <FormField label="Foreign currency" id="ship-fx" hint="Supplier invoice currency.">
              <input
                id="ship-fx"
                placeholder="USD"
                value={form.currency_foreign}
                onChange={set("currency_foreign")}
              />
            </FormField>
          )}
          <FormField label="Local currency" id="ship-local">
            <input id="ship-local" value="ZMW" readOnly className="readonly" />
          </FormField>
        </FormSection>

        <FormFold
          open={showMore}
          onToggle={() => setShowMore((v) => !v)}
          label={showMore ? "Hide logistics details" : "Logistics and paperwork"}
          badge="8 fields"
        >
          <FormSection columns={2}>
            <FormField label="Supplier invoice no." id="ship-invoice">
              <input id="ship-invoice" value={form.invoice_number} onChange={set("invoice_number")} />
            </FormField>
            <FormField label="Clearing agent" id="ship-agent">
              <input id="ship-agent" value={form.clearing_agent} onChange={set("clearing_agent")} />
            </FormField>
            <FormField label="Carrier / shipper" id="ship-carrier">
              <input id="ship-carrier" value={form.carrier_name} onChange={set("carrier_name")} />
            </FormField>
            <FormField label="Origin country" id="ship-origin">
              <input id="ship-origin" value={form.origin_country} onChange={set("origin_country")} />
            </FormField>
            <FormField label="Destination" id="ship-dest">
              <input id="ship-dest" value={form.destination} onChange={set("destination")} />
            </FormField>
            <FormField label="Expected arrival" id="ship-eta">
              <input
                id="ship-eta"
                type="date"
                value={form.expected_arrival_date}
                onChange={set("expected_arrival_date")}
              />
            </FormField>
            <FormField label="Received date" id="ship-received">
              <input
                id="ship-received"
                type="date"
                value={form.received_date}
                onChange={set("received_date")}
              />
            </FormField>
            <FormField label="Notes" id="ship-notes" className="span-2">
              <textarea
                id="ship-notes"
                rows={2}
                value={form.notes}
                onChange={set("notes")}
                placeholder="Anything your team should remember about this batch"
              />
            </FormField>
          </FormSection>
        </FormFold>

        <FormActions>
          <button className="btn primary">Create shipment</button>
        </FormActions>
      </FormPanel>

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
