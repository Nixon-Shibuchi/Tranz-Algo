import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useConfirm } from "../components/ConfirmDialog";
import { money, modeLabel } from "../format";
import { LINE_COST_MODES } from "../costModes";

export default function ShipmentDetailPage() {
  const { id } = useParams();
  const [askConfirm, confirmDialog] = useConfirm();
  const [batch, setBatch] = useState(null);
  const [products, setProducts] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [itemForm, setItemForm] = useState({
    product_id: "",
    quantity: "1",
    weight_kg: "",
    line_cost_mode: "already_local",
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

  async function load() {
    const [b, p] = await Promise.all([api(`/shipments/${id}`), api("/products")]);
    setBatch(b);
    setProducts(p);
    setCosts({
      exchange_rate: b.exchange_rate ?? "",
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
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
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
    try {
      await api(`/shipments/${id}/items`, {
        method: "POST",
        body: JSON.stringify({
          product_id: Number(itemForm.product_id),
          quantity: Number(itemForm.quantity),
          weight_kg: itemForm.weight_kg ? Number(itemForm.weight_kg) : null,
          line_cost_mode: itemForm.line_cost_mode,
          foreign_unit_price: itemForm.foreign_unit_price
            ? Number(itemForm.foreign_unit_price)
            : null,
          local_unit_product_cost: itemForm.local_unit_product_cost
            ? Number(itemForm.local_unit_product_cost)
            : null,
        }),
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveCosts(e) {
    e.preventDefault();
    const confirmed = await askConfirm({
      title: "Save costs?",
      message: "Update shipping, duty, VAT, and exchange rate on this batch?",
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
      await load();
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
      await load();
      setOk(`FX rate saved: ${money(fx.rate)}`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function recheckMargins() {
    const confirmed = await askConfirm({
      title: "Recheck margins?",
      message: "Run Margin-Guard against current landed costs and retail prices?",
      confirmLabel: "Yes, recheck",
    });
    if (!confirmed) return;
    setError("");
    setOk("");
    try {
      const res = await api(`/shipments/${id}/margin-guard/recheck`, { method: "POST" });
      setAlerts(res.alerts || []);
      setLedger(await api(`/shipments/${id}/ledger`));
    } catch (err) {
      setError(err.message);
    }
  }

  if (!batch) return <p className="pad">Loading shipment…</p>;

  const locked = batch.status === "committed";

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
          <div>
            <span>Foreign currency</span>
            <strong>{batch.currency_foreign || "—"}</strong>
          </div>
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

      {error && <p className="error">{error}</p>}
      {ok && <p className="success">{ok}</p>}

      {!locked && (
        <form className="card form-grid" onSubmit={addItem}>
          <h2>Add item</h2>
          {products.length === 0 ? (
            <p className="span-2 muted">
              No products yet. <Link to="/products">Products</Link>
            </p>
          ) : (
            <>
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
              <label>
                Line mode
                <select
                  value={itemForm.line_cost_mode}
                  onChange={(e) => setItemForm({ ...itemForm, line_cost_mode: e.target.value })}
                >
                  {LINE_COST_MODES.map((mode) => (
                    <option key={mode.id} value={mode.id}>
                      {mode.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Foreign unit price
                <input
                  value={itemForm.foreign_unit_price}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, foreign_unit_price: e.target.value })
                  }
                />
              </label>
              <label>
                Local unit product cost (ZMW)
                <input
                  value={itemForm.local_unit_product_cost}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, local_unit_product_cost: e.target.value })
                  }
                />
              </label>
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
                <th>Mode</th>
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
                    <td>{modeLabel(i.line_cost_mode)}</td>
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
          <div className="span-2 field-with-action">
            <label>
              Exchange rate ({batch.currency_foreign || "USD"} → ZMW)
              <input
                value={costs.exchange_rate}
                onChange={(e) => setCosts({ ...costs, exchange_rate: e.target.value })}
              />
            </label>
            <button type="button" className="btn" onClick={fetchFx}>
              Fetch FX
            </button>
          </div>
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
              ? "See the full cost build-up and price ladder for this committed batch."
              : "Allocate shipping, duty and VAT, then set a safe retail price in the True Cost studio."}
          </p>
        </div>
        <Link className="btn primary" to={`/true-cost/${batch.id}`}>
          {locked ? "View true cost" : "Open True Cost"}
        </Link>
      </div>

      <div className="card">
        <div className="table-head">
          <h2>Margin-Guard</h2>
          <button type="button" className="btn" onClick={recheckMargins}>
            Recheck
          </button>
        </div>
        {alerts.length === 0 ? (
          <p className="muted empty-state">No alerts.</p>
        ) : (
          <ul className="result-list">
            {alerts.map((a, idx) => {
              const product = products.find((p) => p.id === a.product_id);
              return (
                <li key={idx}>
                  <div className="result-title">
                    {product ? `${product.sku} — ${product.name}` : `Product #${a.product_id}`}
                  </div>
                  <div className="result-detail">
                    Active {money(a.active_retail_price)} below floor {money(a.floor)} (landed{" "}
                    {money(a.landed_unit_cost)}).
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="card table-wrap">
        <div className="table-head">
          <h2>True-Cost Ledger</h2>
          <span className="muted">{ledger.length} event(s)</span>
        </div>
        {ledger.length === 0 ? (
          <p className="muted empty-state">No ledger events yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Event</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.created_at).toLocaleString()}</td>
                  <td>{row.event_type}</td>
                  <td>
                    <code className="ledger-detail" title={JSON.stringify(row.payload_json)}>
                      {JSON.stringify(row.payload_json)}
                    </code>
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
