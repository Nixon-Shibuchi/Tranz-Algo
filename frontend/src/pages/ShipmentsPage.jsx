import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useConfirm } from "../components/ConfirmDialog";
import CsvImportButton from "../components/CsvImportButton";
import {
  FormActions,
  FormField,
  FormFold,
  FormPanel,
  FormSection,
  ModeCards,
} from "../components/WorkspaceForm";
import { mapShipmentLineRows, parseFullShipmentCsv } from "../csvImport";
import LoadingState from "../components/LoadingState";
import { modeLabel } from "../format";
import { modeNeedsFx } from "../costModes";

export default function ShipmentsPage() {
  const navigate = useNavigate();
  const [askConfirm, confirmDialog] = useConfirm();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [importing, setImporting] = useState(false);

  async function load({ quiet = false } = {}) {
    if (!quiet) setLoading(true);
    try {
      setRows(await api("/shipments"));
    } finally {
      if (!quiet) setLoading(false);
    }
  }

  useEffect(() => {
    load().catch((e) => {
      setError(e.message);
      setLoading(false);
    });
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
      await load({ quiet: true });
    } catch (err) {
      setError(err.message);
    }
  }

  async function importFullShipmentCsv(text) {
    setError("");
    setOk("");
    if (!text.trim()) {
      setError("Could not read that CSV file.");
      return;
    }
    const parsed = parseFullShipmentCsv(text);
    if (parsed.errors.length && !parsed.header?.reference) {
      setError(parsed.errors[0]);
      return;
    }
    let products;
    try {
      products = await api("/products");
    } catch (err) {
      setError(err.message);
      return;
    }
    const lineDefault =
      parsed.header.primary_cost_mode === "auto_fx" ? "auto_fx" : "already_local";
    const { ready: lines, errors: lineErrors } = mapShipmentLineRows(
      parsed.linesText,
      products,
      lineDefault
    );
    const allErrors = [...parsed.errors, ...lineErrors];
    if (!lines.length) {
      setError(allErrors[0] || "No valid lines in shipment CSV.");
      return;
    }
    const confirmed = await askConfirm({
      title: `Import shipment ${parsed.header.reference}?`,
      message: `Creates the batch, saves costs, and adds ${lines.length} line(s). SKUs must already exist under Products.${
        allErrors.length ? ` ${allErrors.length} warning(s).` : ""
      }`,
      confirmLabel: "Yes, import",
    });
    if (!confirmed) return;

    setImporting(true);
    try {
      const c = parsed.costs || {};
      const hasCosts =
        c.exchange_rate != null ||
        c.shipping_total != null ||
        c.duty_total != null ||
        c.vat_total != null ||
        c.paperwork_source;
      const items = lines.map(({ __row, __sku, ...payload }) => payload);
      const result = await api("/shipments/import", {
        method: "POST",
        body: JSON.stringify({
          shipment: parsed.header,
          costs: hasCosts
            ? {
                exchange_rate: c.exchange_rate,
                exchange_rate_source: c.exchange_rate != null ? "manual" : null,
                shipping_total: c.shipping_total,
                duty_total: c.duty_total,
                vat_total: c.vat_total,
                paperwork_source: c.paperwork_source,
              }
            : null,
          items,
        }),
      });
      const fail = [...allErrors, ...(result.errors || [])];
      const created = result.shipment;
      setOk(
        `Imported ${created.reference} with ${result.items_created} line(s). Open True Cost to allocate.`
      );
      if (fail.length) setError(fail.slice(0, 4).join(" · "));
      await load({ quiet: true });
      navigate(`/shipments/${created.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  }

  async function clearDrafts() {
    const drafts = rows.filter((r) => r.status === "draft" || r.status === "costed");
    if (!drafts.length) {
      setOk("No draft or costed shipments to clear.");
      return;
    }
    const confirmed = await askConfirm({
      title: `Clear ${drafts.length} draft shipment(s)?`,
      message:
        "Deletes unfinished batches (draft / costed), including CSV imports that were never committed. Committed shipments stay.",
      confirmLabel: "Yes, clear drafts",
      danger: true,
    });
    if (!confirmed) return;
    setError("");
    setOk("");
    const fail = [];
    let okCount = 0;
    for (const r of drafts) {
      try {
        await api(`/shipments/${r.id}`, { method: "DELETE" });
        okCount += 1;
      } catch (err) {
        fail.push(`${r.reference}: ${err.message}`);
      }
    }
    await load({ quiet: true });
    if (okCount) setOk(`Cleared ${okCount} draft shipment(s).`);
    if (fail.length) setError(fail.slice(0, 3).join(" · "));
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const showFx = modeNeedsFx(form.primary_cost_mode);
  const draftCount = rows.filter((r) => r.status === "draft" || r.status === "costed").length;

  if (loading) {
    return (
      <div>
        <div className="page-head">
          <div>
            <span className="page-kicker">Batches</span>
            <h1>Shipments</h1>
          </div>
        </div>
        <LoadingState
          label="Loading shipments"
          tips={["Fetching batches…", "Checking draft and committed status…"]}
        />
      </div>
    );
  }

  return (
    <div>
      {confirmDialog}
      <div className="page-head">
        <div>
          <span className="page-kicker">Batches</span>
          <h1>Shipments</h1>
        </div>
        <div className="page-head-actions">
          <button
            type="button"
            className="btn ghost"
            disabled={!draftCount}
            onClick={clearDrafts}
            title="Delete draft and costed shipments (not committed)"
          >
            Clear drafts{draftCount ? ` (${draftCount})` : ""}
          </button>
          <CsvImportButton
            label="Import shipment CSV"
            hint="Meta field,value rows + sku line table. Samples in docs/scenarios/samples/"
            busy={importing}
            onText={importFullShipmentCsv}
          />
        </div>
      </div>
      {importing && (
        <LoadingState
          label="Importing"
          tips={["Creating shipment and lines…", "Remote database can take a moment…"]}
        />
      )}
      {error && <p className="error">{error}</p>}
      {ok && <p className="success">{ok}</p>}

      <FormPanel
        kicker="New batch"
        title="Create shipment"
        hint="Pick the cost mode once here (Already-Local or Auto FX). Lines and CSV imports on the next screen follow that mode."
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
