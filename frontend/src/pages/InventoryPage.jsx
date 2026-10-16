import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useConfirm } from "../components/ConfirmDialog";
import {
  LIST_PREVIEW_LIMIT,
  ListCapBar,
  ListDrawer,
} from "../components/ListDrawer";
import LoadingState from "../components/LoadingState";
import { money } from "../format";
import { STOCK_STATUS_LABEL, stockQty, stockStatus } from "../stock";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "low", label: "Low" },
  { id: "out", label: "Out" },
];

const emptySale = { product_id: "", quantity: "1", unit_price: "", note: "" };

export default function InventoryPage() {
  const [askConfirm, confirmDialog] = useConfirm();
  const [rows, setRows] = useState([]);
  const [sales, setSales] = useState([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [saleOpen, setSaleOpen] = useState(false);
  const [saleForm, setSaleForm] = useState(emptySale);
  const [busy, setBusy] = useState(false);
  const [stockDrawerOpen, setStockDrawerOpen] = useState(false);
  const [salesDrawerOpen, setSalesDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load({ quiet = false } = {}) {
    if (!quiet) setLoading(true);
    try {
      const [inv, recent] = await Promise.all([
        api("/inventory"),
        api("/inventory/sales?limit=50"),
      ]);
      setRows(inv);
      setSales(recent);
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

  const sellable = useMemo(
    () => rows.filter((p) => stockQty(p) > 0).sort((a, b) => a.sku.localeCompare(b.sku)),
    [rows]
  );

  const selected = useMemo(
    () => rows.find((p) => String(p.id) === String(saleForm.product_id)) || null,
    [rows, saleForm.product_id]
  );

  const available = selected ? stockQty(selected) : 0;
  const qtyNum = Number(saleForm.quantity);
  const priceNum =
    saleForm.unit_price === "" ? null : Number(saleForm.unit_price);
  const linePreview =
    selected && !Number.isNaN(qtyNum) && priceNum != null && !Number.isNaN(priceNum)
      ? qtyNum * priceNum
      : selected && !Number.isNaN(qtyNum) && selected.active_retail_price != null
        ? qtyNum * Number(selected.active_retail_price)
        : null;

  const maxStock = useMemo(
    () => Math.max(1, ...rows.map((p) => stockQty(p))),
    [rows]
  );

  const totals = useMemo(() => {
    let units = 0;
    let availableCount = 0;
    let low = 0;
    let out = 0;
    let value = 0;
    for (const p of rows) {
      const qty = stockQty(p);
      units += qty;
      const s = stockStatus(p);
      if (s === "available") availableCount += 1;
      else if (s === "low") low += 1;
      else out += 1;
      if (p.active_retail_price != null && qty > 0) {
        value += qty * Number(p.active_retail_price);
      }
    }
    return { units, available: availableCount, low, out, value, skus: rows.length };
  }, [rows]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((p) => {
        const s = stockStatus(p);
        if (filter !== "all" && s !== filter) return false;
        if (!needle) return true;
        return (
          p.sku.toLowerCase().includes(needle) ||
          p.name.toLowerCase().includes(needle) ||
          String(p.id).includes(needle) ||
          (p.category || "").toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => {
        const rank = { available: 0, low: 1, out: 2 };
        const sa = stockStatus(a);
        const sb = stockStatus(b);
        if (rank[sa] !== rank[sb]) return rank[sa] - rank[sb];
        return stockQty(b) - stockQty(a);
      });
  }, [rows, filter, q]);

  const previewStock = useMemo(() => {
    if (q.trim()) return visible;
    return visible.slice(0, LIST_PREVIEW_LIMIT);
  }, [visible, q]);

  const previewSales = useMemo(() => sales.slice(0, LIST_PREVIEW_LIMIT), [sales]);

  function renderStockCard(p) {
    const qty = stockQty(p);
    const status = stockStatus(p);
    const pct = Math.min(100, Math.round((qty / maxStock) * 100));
    return (
      <article key={p.id} className={`card stock-card status-${status}`}>
        <div className="stock-card-top">
          <div>
            <div className="stock-sku">
              <span className="mono-id">#{p.id}</span> {p.sku}
            </div>
            <h2 className="stock-name">{p.name}</h2>
            {(p.category || p.unit) && (
              <p className="muted stock-meta">
                {[p.category, p.unit || "pcs"].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <span className={`badge stock-badge stock-${status}`}>
            {STOCK_STATUS_LABEL[status]}
          </span>
        </div>

        <div className="stock-qty-row">
          <div className="stock-qty">{qty}</div>
          <div className="stock-qty-label">units available</div>
        </div>

        <div
          className="stock-meter"
          role="img"
          aria-label={`${qty} of relative max ${maxStock}`}
        >
          <div className={`stock-meter-fill stock-${status}`} style={{ width: `${pct}%` }} />
        </div>

        <div className="stock-card-foot">
          <div>
            <span className="muted">Retail</span>
            <strong>{money(p.active_retail_price)}</strong>
          </div>
          <div>
            <span className="muted">Reorder at</span>
            <strong>{p.reorder_level ?? "—"}</strong>
          </div>
        </div>

        {qty > 0 && (
          <div className="stock-card-actions">
            <button type="button" className="btn primary" onClick={() => openSale(p)}>
              Sell
            </button>
          </div>
        )}
      </article>
    );
  }

  function renderSalesTable(items) {
    return (
      <table>
        <thead>
          <tr>
            <th>When</th>
            <th>SKU</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Total</th>
            <th>Left</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id}>
              <td>{new Date(s.created_at).toLocaleString()}</td>
              <td>
                <div>{s.sku}</div>
                <div className="cell-sub">{s.name}</div>
              </td>
              <td>{s.quantity}</td>
              <td>{money(s.unit_price)}</td>
              <td>{money(s.line_total)}</td>
              <td>{s.stock_after}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function openSale(product) {
    setError("");
    setOk("");
    if (product) {
      setSaleForm({
        product_id: String(product.id),
        quantity: "1",
        unit_price:
          product.active_retail_price != null ? String(product.active_retail_price) : "",
        note: "",
      });
    } else {
      const first = sellable[0];
      setSaleForm(
        first
          ? {
              product_id: String(first.id),
              quantity: "1",
              unit_price:
                first.active_retail_price != null ? String(first.active_retail_price) : "",
              note: "",
            }
          : emptySale
      );
    }
    setSaleOpen(true);
  }

  function closeSale() {
    if (busy) return;
    setSaleOpen(false);
  }

  function onPickProduct(id) {
    const p = rows.find((x) => String(x.id) === String(id));
    setSaleForm((f) => ({
      ...f,
      product_id: id,
      unit_price: p?.active_retail_price != null ? String(p.active_retail_price) : "",
    }));
  }

  async function submitSale(e) {
    e.preventDefault();
    if (!selected) {
      setError("Select a product.");
      return;
    }
    if (!qtyNum || Number.isNaN(qtyNum) || qtyNum <= 0) {
      setError("Enter a valid quantity.");
      return;
    }
    if (qtyNum > available) {
      setError(`Only ${available} unit(s) available.`);
      return;
    }

    const confirmed = await askConfirm({
      title: "Record sale?",
      message: `Sell ${qtyNum} × ${selected.sku} (${selected.name})? Stock will drop to ${
        available - qtyNum
      }.`,
      confirmLabel: "Yes, record sale",
    });
    if (!confirmed) return;

    setBusy(true);
    setError("");
    setOk("");
    try {
      const sale = await api("/inventory/sales", {
        method: "POST",
        body: JSON.stringify({
          product_id: Number(saleForm.product_id),
          quantity: qtyNum,
          unit_price: saleForm.unit_price === "" ? null : Number(saleForm.unit_price),
          note: saleForm.note.trim() || null,
        }),
      });
      setSaleOpen(false);
      setOk(`Sold ${sale.quantity} × ${sale.sku}. ${sale.stock_after} left.`);
      await load({ quiet: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="page-head">
          <div>
            <span className="page-kicker">Inventory</span>
            <h1>Stock</h1>
          </div>
        </div>
        <LoadingState
          label="Loading stock board"
          tips={["Counting units on hand…", "Fetching recent sales…"]}
        />
      </div>
    );
  }

  return (
    <div>
      {confirmDialog}

      {saleOpen && (
        <div className="modal-backdrop" role="presentation" onClick={closeSale}>
          <div
            className="modal-card card wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sale-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="sale-title">Record sale</h2>
            {sellable.length === 0 ? (
              <p className="muted">Nothing in stock to sell.</p>
            ) : (
              <form className="form-grid" onSubmit={submitSale}>
                <label>
                  Product
                  <select
                    required
                    value={saleForm.product_id}
                    onChange={(e) => onPickProduct(e.target.value)}
                  >
                    <option value="">Select…</option>
                    {sellable.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.id} · {p.sku} — {p.name} ({stockQty(p)} left)
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Quantity
                  <input
                    required
                    inputMode="decimal"
                    value={saleForm.quantity}
                    onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })}
                  />
                </label>
                <label>
                  Unit price (ZMW)
                  <input
                    inputMode="decimal"
                    placeholder={
                      selected?.active_retail_price != null
                        ? String(selected.active_retail_price)
                        : "Optional"
                    }
                    value={saleForm.unit_price}
                    onChange={(e) => setSaleForm({ ...saleForm, unit_price: e.target.value })}
                  />
                </label>
                <label className="span-2">
                  Note
                  <input
                    value={saleForm.note}
                    onChange={(e) => setSaleForm({ ...saleForm, note: e.target.value })}
                    placeholder="Optional"
                  />
                </label>

                {selected && (
                  <div className="sale-preview span-2">
                    <div>
                      <span className="muted">Available</span>
                      <strong>{available}</strong>
                    </div>
                    <div>
                      <span className="muted">After sale</span>
                      <strong>
                        {!Number.isNaN(qtyNum) && qtyNum > 0 ? Math.max(0, available - qtyNum) : "—"}
                      </strong>
                    </div>
                    <div>
                      <span className="muted">Line total</span>
                      <strong>{money(linePreview)}</strong>
                    </div>
                  </div>
                )}

                <div className="span-2 modal-actions">
                  <button type="button" className="btn" onClick={closeSale} disabled={busy}>
                    Cancel
                  </button>
                  <button className="btn primary" disabled={busy || !selected}>
                    {busy ? "Saving…" : "Record sale"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="page-head">
        <div>
          <span className="page-kicker">Shelf</span>
          <h1>Stock</h1>
        </div>
        <div className="actions-inline">
          <button
            type="button"
            className="btn primary"
            onClick={() => openSale(null)}
            disabled={sellable.length === 0}
          >
            Record sale
          </button>
          <Link className="btn" to="/shipments">
            Shipments
          </Link>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {ok && <p className="success">{ok}</p>}

      <div className="cards stock-summary">
        <div className="card stat">
          <div className="stat-label">Units on hand</div>
          <div className="stat-value">{totals.units}</div>
          <p className="stat-note">
            {totals.skus} SKU(s)
            {totals.value > 0 ? ` · ~${money(totals.value)} retail` : ""}
          </p>
        </div>
        <div className="card stat">
          <div className="stat-label">Available SKUs</div>
          <div className="stat-value stock-ok">{totals.available}</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Low stock</div>
          <div className="stat-value stock-warn">{totals.low}</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Out of stock</div>
          <div className="stat-value stock-bad">{totals.out}</div>
        </div>
      </div>

      <div className="stock-toolbar">
        <div className="filter-chips" role="tablist" aria-label="Stock filter">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={`chip ${filter === f.id ? "active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              {f.id === "all"
                ? ` (${totals.skus})`
                : f.id === "available"
                  ? ` (${totals.available})`
                  : f.id === "low"
                    ? ` (${totals.low})`
                    : ` (${totals.out})`}
            </button>
          ))}
        </div>
        <label className="stock-search">
          Search
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="SKU, name, category…"
          />
        </label>
      </div>

      {rows.length === 0 ? (
        <div className="card empty-state">
          <p className="muted">No products yet.</p>
          <Link className="btn primary" to="/products">
            Add products
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="card empty-state">
          <p className="muted">No items match this filter.</p>
        </div>
      ) : (
        <>
          <div className="stock-board">{previewStock.map(renderStockCard)}</div>
          {!q.trim() && visible.length > LIST_PREVIEW_LIMIT && (
            <ListCapBar
              total={visible.length}
              shown={previewStock.length}
              noun="items"
              onOpen={() => setStockDrawerOpen(true)}
            />
          )}
        </>
      )}

      <ListDrawer
        open={stockDrawerOpen}
        onClose={() => setStockDrawerOpen(false)}
        title="All stock items"
        subtitle="Use search and filters on the main page, then browse the full list here."
      >
        <div className="stock-board">{visible.map(renderStockCard)}</div>
      </ListDrawer>

      <div className="card table-wrap" style={{ marginTop: "1rem" }}>
        <div className="table-head">
          <h2>Recent sales</h2>
          <span className="muted">{sales.length} recorded</span>
        </div>
        {sales.length === 0 ? (
          <p className="muted empty-state">No sales recorded yet.</p>
        ) : (
          <>
            {renderSalesTable(previewSales)}
            {sales.length > LIST_PREVIEW_LIMIT && (
              <ListCapBar
                total={sales.length}
                shown={previewSales.length}
                noun="sales"
                onOpen={() => setSalesDrawerOpen(true)}
              />
            )}
          </>
        )}
      </div>

      <ListDrawer
        open={salesDrawerOpen}
        onClose={() => setSalesDrawerOpen(false)}
        title="Recent sales"
        subtitle="Full sale history loaded from your workspace."
      >
        {renderSalesTable(sales)}
      </ListDrawer>
    </div>
  );
}
