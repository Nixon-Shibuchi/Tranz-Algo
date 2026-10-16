import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useConfirm } from "../components/ConfirmDialog";
import CsvImportButton from "../components/CsvImportButton";
import LoadingState from "../components/LoadingState";
import { mapShipmentLineRows } from "../csvImport";
import { money, modeLabel } from "../format";
import { DEFAULT_STARTER_FX_RATE, modeNeedsFx } from "../costModes";
import { ledgerEventLabel } from "../ledgerFormat";

export default function ShipmentDetailPage() {
  const { id } = useParams();
  const [askConfirm, confirmDialog] = useConfirm();
  const [batch, setBatch] = useState(null);
  const [products, setProducts] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [itemForm, setItemForm] = useState({
    product_id: "",
    quantity: "1",
    weight_kg: "",
    foreign_unit_price: "",
    local_unit_product_cost: "",
  });
  const [costs, setCosts] = useState({
    exchange_rate: "",
    shipping_total: "",
    duty_total: "",
    vat_total: "",
    paperwork_source: "",
  });

  async function load({ quiet = false } = {}) {
    if (!quiet) setLoading(true);
    try {
      const [b, p] = await Promise.all([api(`/shipments/${id}`), api("/products")]);
      setBatch(b);
      setProducts(p);

      let rate = b.exchange_rate;
      // Auto FX: before Fetch FX, show last cached rate or starter 20
      if (modeNeedsFx(b.primary_cost_mode) && (rate == null || rate === "")) {
        const base = b.currency_foreign || "USD";
        const quote = b.currency_local || "ZMW";
        let seed = DEFAULT_STARTER_FX_RATE;
        let source = "manual";
        try {
          const fx = await api(`/fx/rates?base=${base}&quote=${quote}&cache_only=true`);
          seed = fx.rate;
          source = "cache";
        } catch {
          /* no last fetch — keep starter 20 */
        }
        rate = seed;
        try {
          await api(`/shipments/${id}/costs`, {
            method: "PUT",
            body: JSON.stringify({ exchange_rate: seed, exchange_rate_source: source }),
          });
          b.exchange_rate = seed;
          b.exchange_rate_source = source;
          setBatch({ ...b });
        } catch {
          /* still show seed in the form */
        }
      }

      setCosts({
        exchange_rate: rate ?? "",
        shipping_total: b.shipping_total ?? "",
        duty_total: b.duty_total ?? "",
        vat_total: b.vat_total ?? "",
        paperwork_source: b.paperwork_source ?? "",
      });
      try {
        setLedger(await api(`/shipments/${id}/ledger`));
      } catch {
        setLedger([]);
      }
    } finally {
      if (!quiet) setLoading(false);
    }
  }

  useEffect(() => {
    load().catch((e) => {
      setError(e.message);
      setLoading(false);
    });
  }, [id]);

  async function addItem(e) {
    e.preventDefault();
    const product = products.find((p) => String(p.id) === String(itemForm.product_id));
    const label = product ? `${product.sku}` : "this product";
    const confirmed = await askConfirm({
      title: "Add item?",
      message: `Add ${label} (qty ${itemForm.quantity || "1"}) to this shipment?`,
      confirmLabel: "Yes, add",
    });
    if (!confirmed) return;
    setError("");
    setOk("");
    const lineMode =
      batch?.primary_cost_mode === "auto_fx" ? "auto_fx" : "already_local";
    try {
      await api(`/shipments/${id}/items`, {
        method: "POST",
        body: JSON.stringify({
          product_id: Number(itemForm.product_id),
          quantity: Number(itemForm.quantity),
          weight_kg: itemForm.weight_kg ? Number(itemForm.weight_kg) : null,
          line_cost_mode: lineMode,
          foreign_unit_price:
            lineMode === "auto_fx" && itemForm.foreign_unit_price
              ? Number(itemForm.foreign_unit_price)
              : null,
          local_unit_product_cost:
            lineMode === "already_local" && itemForm.local_unit_product_cost
              ? Number(itemForm.local_unit_product_cost)
              : null,
        }),
      });
      setItemForm({
        product_id: "",
        quantity: "1",
        weight_kg: "",
        foreign_unit_price: "",
        local_unit_product_cost: "",
      });
      await load({ quiet: true });
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveCosts(e) {
    e.preventDefault();
    const confirmed = await askConfirm({
      title: "Save costs?",
      message:
        batch?.primary_cost_mode === "auto_fx"
          ? "Update shipping, duty, VAT, and exchange rate on this batch?"
          : "Update shipping, duty, and VAT on this batch?",
      confirmLabel: "Yes, save",
    });
    if (!confirmed) return;
    setError("");
    setOk("");
    try {
      await api(`/shipments/${id}/costs`, {
        method: "PUT",
        body: JSON.stringify({
          exchange_rate: costs.exchange_rate === "" ? null : Number(costs.exchange_rate),
          exchange_rate_source: costs.exchange_rate === "" ? null : "manual",
          shipping_total: costs.shipping_total === "" ? null : Number(costs.shipping_total),
          duty_total: costs.duty_total === "" ? null : Number(costs.duty_total),
          vat_total: costs.vat_total === "" ? null : Number(costs.vat_total),
          paperwork_source: costs.paperwork_source || null,
        }),
      });
      await load({ quiet: true });
      setOk("Costs saved.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function fetchFx() {
    const confirmed = await askConfirm({
      title: "Fetch FX rate?",
      message: "Look up the current rate and save it on this shipment?",
      confirmLabel: "Yes, fetch",
    });
    if (!confirmed) return;
    setError("");
    setOk("");
    try {
      const base = batch?.currency_foreign || "USD";
      const quote = batch?.currency_local || "ZMW";
      const fx = await api(`/fx/rates?base=${base}&quote=${quote}`);
      setCosts((c) => ({ ...c, exchange_rate: String(fx.rate) }));
      await api(`/shipments/${id}/costs`, {
        method: "PUT",
        body: JSON.stringify({
          exchange_rate: fx.rate,
          exchange_rate_source: fx.source,
        }),
      });
      await load({ quiet: true });
      setOk(`FX rate saved: ${money(fx.rate)}`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function importLinesCsv(text) {
    setError("");
    setOk("");
    if (!text.trim()) {
      setError("Could not read that CSV file.");
      return;
    }
    const batchMode =
      batch?.primary_cost_mode === "auto_fx" ? "auto_fx" : "already_local";
    const { ready: mapped, errors } = mapShipmentLineRows(text, products, batchMode);
    // Mode was chosen once on the shipment — ignore any mode column in the CSV.
    const ready = mapped.map((row) => ({ ...row, line_cost_mode: batchMode }));
    if (!ready.length) {
      setError(
        errors[0] ||
          (batchMode === "auto_fx"
            ? "No line rows found. Need sku, qty, and foreign_unit (USD)."
            : "No line rows found. Need sku, qty, and local_unit (ZMW).")
      );
      return;
    }
    const preview = ready
      .slice(0, 5)
      .map((r) => `${r.__sku} ×${r.quantity}`)
      .join("; ");
    const more = ready.length > 5 ? ` … +${ready.length - 5} more` : "";
    const warn = errors.length ? ` ${errors.length} row(s) skipped.` : "";
    const confirmed = await askConfirm({
      title: `Import ${ready.length} line(s)?`,
      message: `${preview}${more}.${warn}`,
      confirmLabel: "Yes, import",
    });
    if (!confirmed) return;
    setImporting(true);
    let okCount = 0;
    const fail = [...errors];
    try {
      for (const row of ready) {
        const { __row, __sku, ...payload } = row;
        try {
          await api(`/shipments/${id}/items`, {
            method: "POST",
            body: JSON.stringify(payload),
          });
          okCount += 1;
        } catch (err) {
          fail.push(`Row ${__row} (${__sku}): ${err.message}`);
        }
      }
      await load({ quiet: true });
      if (okCount) setOk(`Imported ${okCount} line(s) from CSV.`);
      if (fail.length) setError(fail.slice(0, 4).join(" · "));
    } finally {
      setImporting(false);
    }
  }

  if (loading || !batch) {
    return (
      <div>
        <div className="page-head">
          <div>
            <span className="page-kicker">Shipment</span>
            <h1>Opening batch</h1>
          </div>
        </div>
        {error && <p className="error">{error}</p>}
        <LoadingState
          label="Loading shipment"
          tips={["Fetching lines and costs…", "Preparing paperwork fields…"]}
        />
      </div>
    );
  }

  const locked = batch.status === "committed";
  const isAutoFx = batch.primary_cost_mode === "auto_fx";
  const needsFx = modeNeedsFx(batch.primary_cost_mode);

  const historyRows = (() => {
    const rows = ledger.filter((r) => r.event_type !== "margin_alert");
    const landed = rows.filter((r) => r.event_type === "landed_cost");
    const rest = rows.filter((r) => r.event_type !== "landed_cost");
    const out = [];
    if (landed.length === 1) {
      const item = batch.items.find((i) => i.id === landed[0].batch_item_id);
      const prod = item ? products.find((p) => p.id === item.product_id) : null;
      out.push({
        key: `l-${landed[0].id}`,
        created_at: landed[0].created_at,
        label: ledgerEventLabel(landed[0], prod),
      });
    } else if (landed.length > 1) {
      out.push({
        key: `l-group-${landed[0].id}`,
        created_at: landed[0].created_at,
        label: `Landed costs recorded (${landed.length} lines)`,
      });
    }
    for (const row of rest) {
      const item = batch.items.find((i) => i.id === row.batch_item_id);
      const prod = item ? products.find((p) => p.id === item.product_id) : null;
      out.push({
        key: `e-${row.id}`,
        created_at: row.created_at,
        label: ledgerEventLabel(row, prod),
      });
    }
    return out;
  })();

  return (
    <div>
      {confirmDialog}

      <div className="page-head">
        <div>
          <Link className="back-link" to="/shipments">
            ← Shipments
          </Link>
          <span className="page-kicker">Shipment batch</span>
          <h1>{batch.reference}</h1>
          <p className="muted">
            <span className="badge">{modeLabel(batch.primary_cost_mode)}</span>{" "}
            <span className={`badge status-${batch.status}`}>{batch.status}</span>
          </p>
        </div>
      </div>

      <div className="card">
        <div className="meta-grid">
          <div>
            <span>Supplier</span>
            <strong>{batch.supplier_name || "—"}</strong>
          </div>
          <div>
            <span>Invoice</span>
            <strong>{batch.invoice_number || "—"}</strong>
          </div>
          <div>
            <span>Clearing agent</span>
            <strong>{batch.clearing_agent || "—"}</strong>
          </div>
          <div>
            <span>Carrier</span>
            <strong>{batch.carrier_name || "—"}</strong>
          </div>
          <div>
            <span>Local currency</span>
            <strong>{batch.currency_local || "ZMW"}</strong>
          </div>
          {needsFx && (
            <div>
              <span>Foreign currency</span>
              <strong>{batch.currency_foreign || "—"}</strong>
            </div>
          )}
          <div>
            <span>Origin</span>
            <strong>{batch.origin_country || "—"}</strong>
          </div>
          <div>
            <span>Destination</span>
            <strong>{batch.destination || "—"}</strong>
          </div>
          <div>
            <span>Expected</span>
            <strong>{batch.expected_arrival_date || "—"}</strong>
          </div>
          <div>
            <span>Received</span>
            <strong>{batch.received_date || "—"}</strong>
          </div>
        </div>
      </div>

      {importing && (
        <LoadingState
          label="Importing"
          tips={["Adding lines from CSV…", "Remote database can take a moment…"]}
        />
      )}
      {error && <p className="error">{error}</p>}
      {ok && <p className="success">{ok}</p>}

      {!locked && (
        <form className="card form-grid" onSubmit={addItem}>
          <div className="span-2 table-head" style={{ margin: 0, padding: 0, border: "none" }}>
            <h2 style={{ margin: 0 }}>Add item</h2>
            <CsvImportButton
              label="Import lines CSV"
              hint={
                isAutoFx
                  ? "Columns: sku, qty, foreign_unit, optional weight_kg"
                  : "Columns: sku, qty, local_unit, optional weight_kg"
              }
              disabled={products.length === 0}
              busy={importing}
              onText={importLinesCsv}
            />
          </div>
          {products.length === 0 ? (
            <p className="span-2 muted">
              No products yet. <Link to="/products">Products</Link> (or import a products CSV there
              first).
            </p>
          ) : (
            <>
              <p className="span-2 muted" style={{ marginTop: 0 }}>
                This shipment is locked to <strong>{modeLabel(batch.primary_cost_mode)}</strong>{" "}
                (chosen when it was created). Lines and CSV imports use that mode.
              </p>
              <label>
                Product
                <select
                  required
                  value={itemForm.product_id}
                  onChange={(e) => setItemForm({ ...itemForm, product_id: e.target.value })}
                >
                  <option value="">Select…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.id} · {p.sku} — {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Qty
                <input
                  required
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                />
              </label>
              <label>
                Weight kg (line total)
                <input
                  value={itemForm.weight_kg}
                  onChange={(e) => setItemForm({ ...itemForm, weight_kg: e.target.value })}
                />
              </label>
              {isAutoFx ? (
                <label>
                  Foreign unit price ({batch.currency_foreign || "USD"})
                  <input
                    required
                    value={itemForm.foreign_unit_price}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, foreign_unit_price: e.target.value })
                    }
                  />
                </label>
              ) : (
                <label>
                  Local unit product cost (ZMW)
                  <input
                    required
                    value={itemForm.local_unit_product_cost}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, local_unit_product_cost: e.target.value })
                    }
                  />
                </label>
              )}
              <button className="btn primary span-2" style={{ width: "fit-content" }}>
                Add item
              </button>
            </>
          )}
        </form>
      )}

      <div className="card table-wrap">
        <div className="table-head">
          <h2>Lines</h2>
          <span className="muted">{batch.items.length} line(s)</span>
        </div>
        {batch.items.length === 0 ? (
          <p className="muted empty-state">No lines yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                {isAutoFx ? <th>Foreign unit</th> : null}
                <th>Local unit</th>
                <th>Ship share</th>
                <th>Duty</th>
                <th>VAT</th>
                <th>Landed unit</th>
                <th>Suggested</th>
              </tr>
            </thead>
            <tbody>
              {batch.items.map((i) => {
                const product = products.find((p) => p.id === i.product_id);
                return (
                  <tr key={i.id}>
                    <td>
                      {product ? (
                        <>
                          <span className="mono-id">#{product.id}</span> {product.sku}
                        </>
                      ) : (
                        i.product_id
                      )}
                    </td>
                    <td>{i.quantity}</td>
                    {isAutoFx ? <td>{money(i.foreign_unit_price)}</td> : null}
                    <td>{money(i.local_unit_product_cost)}</td>
                    <td>{money(i.shipping_share)}</td>
                    <td>{money(i.duty_amount)}</td>
                    <td>{money(i.vat_amount)}</td>
                    <td>{money(i.landed_unit_cost)}</td>
                    <td>{money(i.suggested_retail_price)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!locked && (
        <form className="card form-grid" onSubmit={saveCosts}>
          <h2>Costs</h2>
          {needsFx ? (
            <div className="span-2 field-with-action">
              <label>
                Exchange rate ({batch.currency_foreign || "USD"} → ZMW)
                <input
                  value={costs.exchange_rate}
                  onChange={(e) => setCosts({ ...costs, exchange_rate: e.target.value })}
                />
                <span className="form-field-hint">
                  Starts at {DEFAULT_STARTER_FX_RATE} or the last fetched rate. Use Fetch FX for a
                  live rate (demo oracle often uses 27.50).
                </span>
              </label>
              <button type="button" className="btn" onClick={fetchFx}>
                Fetch FX
              </button>
            </div>
          ) : null}
          <label>
            Shipping total (ZMW)
            <input
              value={costs.shipping_total}
              onChange={(e) => setCosts({ ...costs, shipping_total: e.target.value })}
            />
          </label>
          <label>
            Duty total (ZMW)
            <input
              value={costs.duty_total}
              onChange={(e) => setCosts({ ...costs, duty_total: e.target.value })}
            />
          </label>
          <label>
            VAT total (ZMW)
            <input
              value={costs.vat_total}
              onChange={(e) => setCosts({ ...costs, vat_total: e.target.value })}
            />
          </label>
          <label>
            Paperwork source
            <input
              value={costs.paperwork_source}
              onChange={(e) => setCosts({ ...costs, paperwork_source: e.target.value })}
            />
          </label>
          <div className="span-2">
            <button className="btn primary">Save costs</button>
          </div>
        </form>
      )}

      <div className="card sd-handoff">
        <div>
          <span className="tc-panel-kicker">Costing engine</span>
          <h2>Landed cost &amp; pricing</h2>
          <p className="muted">
            {locked
              ? "See the cost build-up for this committed batch. Cost history below shows how retail was set."
              : "Allocate shipping, duty and VAT, then set retail in True Cost. After you commit, a short cost history appears here."}
          </p>
        </div>
        <Link className="btn primary" to={`/true-cost/${batch.id}`}>
          {locked ? "View true cost" : "Open True Cost"}
        </Link>
      </div>

      {locked ? (
        <div className="card table-wrap">
          <div className="table-head">
            <h2>Cost history</h2>
            <span className="muted">{historyRows.length} note(s)</span>
          </div>
          {historyRows.length === 0 ? (
            <p className="muted empty-state">No history for this batch yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>What happened</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map((row) => (
                  <tr key={row.key}>
                    <td>{new Date(row.created_at).toLocaleString()}</td>
                    <td>{row.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null}
    </div>
  );
}
