import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useConfirm } from "../components/ConfirmDialog";
import { money, modeLabel } from "../format";

function productLabel(products, item) {
  const product = products.find((p) => p.id === item.product_id);
  return product ? `${product.sku} — ${product.name}` : `Item #${item.product_id}`;
}

export default function ShipmentDetailPage() {
  const { id } = useParams();
  const [askConfirm, confirmDialog] = useConfirm();
  const [batch, setBatch] = useState(null);
  const [products, setProducts] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [allocDone, setAllocDone] = useState(false);
  const [suggestChoiceOpen, setSuggestChoiceOpen] = useState(false);
  const [priceMode, setPriceMode] = useState(null); // "auto" | "manual" | null
  const [manualPrices, setManualPrices] = useState({});
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
  const [method, setMethod] = useState("quantity");
  const [margin, setMargin] = useState("0.30");

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
    setMethod(b.allocation_method || "quantity");
    if (b.profit_margin != null) setMargin(String(b.profit_margin));
    if (b.items?.some((i) => i.landed_unit_cost != null)) setAllocDone(true);
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

  async function runAllocate() {
    const confirmed = await askConfirm({
      title: "Run allocation?",
      message: `Allocate costs using the ${method} method? Existing landed costs will be recalculated.`,
      confirmLabel: "Yes, allocate",
    });
    if (!confirmed) return;
    setError("");
    setOk("");
    setPriceMode(null);
    setSuggestChoiceOpen(false);
    try {
      const res = await api(`/shipments/${id}/allocate`, {
        method: "POST",
        body: JSON.stringify({ method, compare: true }),
      });
      setComparison(res.comparison);
      setBatch(res.shipment);
      setAllocDone(true);
      setOk("Allocation complete — see results below.");
      window.setTimeout(() => {
        document.getElementById("alloc-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } catch (err) {
      setError(err.message);
    }
  }

  async function runSuggest() {
    const confirmed = await askConfirm({
      title: "Suggest prices?",
      message: `Calculate suggested retail prices with profit margin ${margin}?`,
      confirmLabel: "Yes, suggest",
    });
    if (!confirmed) return;
    setError("");
    setOk("");
    try {
      const b = await api(`/shipments/${id}/suggest-prices`, {
        method: "POST",
        body: JSON.stringify({
          profit_margin: Number(margin),
          safety_margin: 0.1,
        }),
      });
      setBatch(b);
      setSuggestChoiceOpen(true);
    } catch (err) {
      setError(err.message);
    }
  }

  function useSuggestedAsRetail() {
    setPriceMode("auto");
    setSuggestChoiceOpen(false);
    setOk("Using suggested retail prices.");
  }

  function openManualPrices() {
    const next = {};
    for (const item of batch.items) {
      next[item.id] =
        item.suggested_retail_price != null ? String(item.suggested_retail_price) : "";
    }
    setManualPrices(next);
    setPriceMode("manual");
    setSuggestChoiceOpen(false);
    setOk("Enter retail prices below.");
    window.setTimeout(() => {
      document.getElementById("manual-prices")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  async function commit() {
    if (!batch.items?.some((i) => i.suggested_retail_price != null) && priceMode !== "manual") {
      setError("Suggest prices first.");
      return;
    }
    if (priceMode === "manual") {
      const missing = batch.items.filter((i) => {
        const v = manualPrices[i.id];
        return v === undefined || v === "" || Number.isNaN(Number(v));
      });
      if (missing.length) {
        setError("Enter a retail price for every line.");
        return;
      }
    }
    if (priceMode == null) {
      setError("Choose automatic or manual retail prices.");
      setSuggestChoiceOpen(true);
      return;
    }

    const confirmed = await askConfirm({
      title: "Commit batch?",
      message: "Lock this shipment and apply stock and retail prices? This cannot be undone.",
      confirmLabel: "Yes, commit",
      danger: true,
    });
    if (!confirmed) return;
    setError("");
    setOk("");
    try {
      const body =
        priceMode === "manual"
          ? {
              accept_suggestions: false,
              item_price_overrides: batch.items.map((i) => ({
                item_id: i.id,
                accepted_retail_price: Number(manualPrices[i.id]),
              })),
            }
          : { accept_suggestions: true, item_price_overrides: [] };

      const b = await api(`/shipments/${id}/commit`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setBatch(b);
      setLedger(await api(`/shipments/${id}/ledger`));
      setPriceMode(null);
      setOk("Batch committed. Stock and retail prices updated.");
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
  const selectedMethod = batch.allocation_method || method;
  const otherMethod = selectedMethod === "weight" ? "quantity" : "weight";
  const otherRows = comparison?.[otherMethod];

  return (
    <div>
      {confirmDialog}

      {suggestChoiceOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setSuggestChoiceOpen(false)}
        >
          <div
            className="modal-card card wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="suggest-choice-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="suggest-choice-title">Suggested retail prices</h2>
            <ul className="result-list">
              {batch.items.map((item) => (
                <li key={item.id}>
                  <div className="result-title">{productLabel(products, item)}</div>
                  <div className="result-detail">
                    Landed unit {money(item.landed_unit_cost)} → suggested retail{" "}
                    <strong>{money(item.suggested_retail_price)}</strong>
                  </div>
                </li>
              ))}
            </ul>
            <div className="modal-actions">
              <button type="button" className="btn primary" onClick={useSuggestedAsRetail}>
                Use these automatically
              </button>
              <button type="button" className="btn" onClick={openManualPrices}>
                Enter prices manually
              </button>
              <button type="button" className="btn" onClick={() => setSuggestChoiceOpen(false)}>
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-head">
        <div>
          <Link className="back-link" to="/shipments">
            ← Shipments
          </Link>
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
                      {p.sku} — {p.name}
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
                  <option value="already_local">Already-Local</option>
                  <option value="auto_fx">Auto FX</option>
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
                    <td>{product ? `${product.sku}` : i.product_id}</td>
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

      {!locked && (
        <div className="card pricing-bar">
          <h2>Allocation & pricing</h2>
          <div className="form-grid" style={{ marginBottom: 0 }}>
            <label>
              Method
              <select value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="quantity">Quantity</option>
                <option value="weight">Weight</option>
              </select>
            </label>
            <label>
              Profit margin
              <input value={margin} onChange={(e) => setMargin(e.target.value)} />
            </label>
            <div className="span-2 pricing-actions">
              <button type="button" className="btn" onClick={runAllocate}>
                Run allocation
              </button>
              <button type="button" className="btn" onClick={runSuggest}>
                Suggest prices
              </button>
              <button type="button" className="btn primary" onClick={commit}>
                Commit batch
              </button>
            </div>
          </div>
        </div>
      )}

      {allocDone && batch.items.some((i) => i.landed_unit_cost != null) && (
        <div className="card notice-card" id="alloc-results">
          <div>
            <strong>Allocated · {selectedMethod}</strong>
            {Array.isArray(otherRows) && otherRows.length > 0 && (
              <p className="muted">
                {otherMethod}:{" "}
                {otherRows
                  .map((row) => {
                    const item = batch.items.find((i) => i.id === row.item_id);
                    const label = item
                      ? products.find((p) => p.id === item.product_id)?.sku || `#${row.item_id}`
                      : `#${row.item_id}`;
                    return `${label} ${money(row.landed_unit_cost)}`;
                  })
                  .join(" · ")}
              </p>
            )}
          </div>
        </div>
      )}

      {!locked && priceMode === "auto" && (
        <div className="card notice-card">
          <div>
            <strong>Retail: use suggested prices</strong>
            <p className="muted">Applied on commit.</p>
          </div>
          <button type="button" className="btn" onClick={() => setSuggestChoiceOpen(true)}>
            Change
          </button>
        </div>
      )}

      {!locked && priceMode === "manual" && (
        <div className="card result-card" id="manual-prices">
          <h2>Retail prices</h2>
          <div className="manual-price-grid">
            {batch.items.map((item) => (
              <div className="manual-price-row" key={item.id}>
                <div>
                  <div className="result-title">{productLabel(products, item)}</div>
                  <div className="result-detail">
                    Landed {money(item.landed_unit_cost)} · suggested{" "}
                    {money(item.suggested_retail_price)}
                  </div>
                </div>
                <label>
                  Retail price (ZMW)
                  <input
                    required
                    value={manualPrices[item.id] ?? ""}
                    onChange={(e) =>
                      setManualPrices((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                  />
                </label>
              </div>
            ))}
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={() => setSuggestChoiceOpen(true)}>
              Back to suggestions
            </button>
          </div>
        </div>
      )}

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
