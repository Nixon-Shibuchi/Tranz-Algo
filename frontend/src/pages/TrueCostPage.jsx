import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useConfirm } from "../components/ConfirmDialog";
import CountUp from "../components/CountUp";
import LoadingState from "../components/LoadingState";
import { LOCAL_CURRENCY, money, modeLabel, percent } from "../format";

const SEGMENTS = [
  { key: "goods", label: "Goods", field: "goods" },
  { key: "ship", label: "Shipping", field: "shipping_share" },
  { key: "duty", label: "Duty", field: "duty_amount" },
  { key: "vat", label: "Import VAT", field: "vat_amount" },
];

const DEFAULT_SAFETY = 0.1;
const VISIBLE_BATCH_COUNT = 2;

function splitBatches(batches, activeId, visibleCount = VISIBLE_BATCH_COUNT) {
  const sorted = [...batches].sort((a, b) => b.id - a.id);
  if (sorted.length <= visibleCount) {
    return { visible: sorted, archive: [] };
  }

  let visible = sorted.slice(0, visibleCount);
  let archive = sorted.slice(visibleCount);

  if (activeId != null) {
    const aid = String(activeId);
    if (!visible.some((b) => String(b.id) === aid)) {
      const active = sorted.find((b) => String(b.id) === aid);
      if (active) {
        const companion = sorted.find((b) => String(b.id) !== aid);
        visible = [active, companion].filter(Boolean).slice(0, visibleCount);
        archive = sorted.filter((b) => !visible.some((v) => v.id === b.id));
      }
    }
  }

  return { visible, archive };
}

function BatchCard({ batch, active, onSelect }) {
  const lineCount = batch.items?.length ?? 0;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={`tc-batch-card${active ? " active" : ""}`}
      onClick={() => onSelect(batch.id)}
    >
      <span className="tc-batch-card-top">
        <span className="tc-batch-ref">{batch.reference}</span>
        <span className={`badge status-${batch.status}`}>{batch.status}</span>
      </span>
      <span className="tc-batch-card-meta">
        {batch.supplier_name || "No supplier"} · {modeLabel(batch.primary_cost_mode)}
      </span>
      <span className="tc-batch-card-foot">
        {lineCount} line{lineCount === 1 ? "" : "s"}
      </span>
    </button>
  );
}

function BatchPicker({ batches, activeId, onSelect }) {
  const [archiveOpen, setArchiveOpen] = useState(false);
  const { visible, archive } = useMemo(
    () => splitBatches(batches, activeId),
    [batches, activeId]
  );

  useEffect(() => {
    setArchiveOpen(false);
  }, [activeId]);

  useEffect(() => {
    if (!archiveOpen) return undefined;
    function onKey(e) {
      if (e.key === "Escape") setArchiveOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [archiveOpen]);

  function pick(batchId) {
    onSelect(batchId);
    setArchiveOpen(false);
  }

  return (
    <div className="tc-batch-picker">
      <div className="tc-batch-spotlight" role="tablist" aria-label="Recent shipment batches">
        {visible.map((b) => (
          <BatchCard
            key={b.id}
            batch={b}
            active={String(b.id) === String(activeId)}
            onSelect={pick}
          />
        ))}
      </div>

      {archive.length > 0 && (
        <>
          <button
            type="button"
            className="tc-archive-trigger"
            aria-expanded={archiveOpen}
            aria-controls="tc-batch-archive"
            onClick={() => setArchiveOpen(true)}
          >
            <span className="tc-archive-stack" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="tc-archive-copy">
              <span className="tc-archive-kicker">Batch archive</span>
              <span className="tc-archive-count">
                {archive.length} older batch{archive.length === 1 ? "" : "es"}
              </span>
            </span>
            <svg className="tc-archive-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M9 6l6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {archiveOpen && (
            <button
              type="button"
              className="tc-archive-backdrop"
              aria-label="Close batch archive"
              onClick={() => setArchiveOpen(false)}
            />
          )}

          <aside
            id="tc-batch-archive"
            className={`tc-archive-drawer${archiveOpen ? " open" : ""}`}
            aria-hidden={!archiveOpen}
            aria-labelledby="tc-archive-title"
          >
            <header className="tc-archive-head">
              <div>
                <p id="tc-archive-title" className="tc-archive-title">
                  Earlier batches
                </p>
                <p className="tc-archive-sub muted">
                  Pull an older shipment into True Cost without cluttering the spotlight.
                </p>
              </div>
              <button type="button" className="btn ghost" onClick={() => setArchiveOpen(false)}>
                Close
              </button>
            </header>

            <ul className="tc-archive-list">
              {archive.map((b, i) => {
                const active = String(b.id) === String(activeId);
                const lineCount = b.items?.length ?? 0;
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      className={`tc-archive-row${active ? " active" : ""}`}
                      style={{ "--d": `${i * 45}ms` }}
                      onClick={() => pick(b.id)}
                    >
                      <span className="tc-archive-row-main">
                        <span className="tc-batch-ref">{b.reference}</span>
                        <span className="tc-archive-row-meta">
                          {b.supplier_name || "No supplier"}
                          {b.origin_country ? ` · ${b.origin_country}` : ""}
                        </span>
                      </span>
                      <span className="tc-archive-row-side">
                        <span className={`badge status-${b.status}`}>{b.status}</span>
                        <span className="tc-archive-lines">
                          {lineCount} line{lineCount === 1 ? "" : "s"}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>
        </>
      )}
    </div>
  );
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function stageOf(batch) {
  if (!batch) return 0;
  if (batch.status === "committed") return 4;
  if (!batch.items?.length) return 0;
  const allocated = batch.items.every((i) => i.landed_unit_cost != null);
  if (!allocated) return 1;
  const priced = batch.items.some((i) => i.suggested_retail_price != null);
  return priced ? 3 : 2;
}

export default function TrueCostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [askConfirm, confirmDialog] = useConfirm();

  const [batches, setBatches] = useState([]);
  const [batch, setBatch] = useState(null);
  const [products, setProducts] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [method, setMethod] = useState("quantity");
  const [margin, setMargin] = useState(0.3);
  const [priceMode, setPriceMode] = useState(null);
  const [manualPrices, setManualPrices] = useState({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(false);
  const batchesRef = useRef(batches);
  batchesRef.current = batches;
  const idRef = useRef(id);
  idRef.current = id;

  // List once on mount — do not re-hit the remote DB on every batch tab switch
  useEffect(() => {
    let alive = true;
    Promise.all([api("/shipments"), api("/products")])
      .then(([b, p]) => {
        if (!alive) return;
        setBatches(b);
        setProducts(p);
        if (!idRef.current && b.length) {
          const preferred = b.find((x) => x.status !== "committed") || b[0];
          navigate(`/true-cost/${preferred.id}`, { replace: true });
        }
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [navigate]);

  const applyBatch = useCallback((b) => {
    setBatch(b);
    setMethod(b.allocation_method || "quantity");
    if (b.profit_margin != null) setMargin(num(b.profit_margin));
  }, []);

  const loadBatch = useCallback(async () => {
    if (!id) return;
    const b = await api(`/shipments/${id}`);
    applyBatch(b);
    setBatches((prev) => {
      const i = prev.findIndex((x) => String(x.id) === String(b.id));
      if (i < 0) return [b, ...prev];
      const next = [...prev];
      next[i] = b;
      return next;
    });
  }, [id, applyBatch]);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setComparison(null);
    setPriceMode(null);
    setManualPrices({});
    setError("");
    setOk("");

    // Instant swap from list cache so previous batch costs don't linger on screen
    const cached = batchesRef.current.find((x) => String(x.id) === String(id));
    if (cached) {
      applyBatch(cached);
    } else {
      setBatch(null);
    }

    setBatchLoading(true);
    loadBatch()
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setBatchLoading(false));
    return () => {
      alive = false;
    };
  }, [id, loadBatch, applyBatch]);

  const locked = batch?.status === "committed";
  const stage = stageOf(batch);
  const safety = num(batch?.safety_margin) || DEFAULT_SAFETY;

  const rows = useMemo(() => {
    if (!batch?.items?.length) return [];
    return batch.items.map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      const qty = num(item.quantity);
      const goods = round2(num(item.local_unit_product_cost) * qty);
      const shipping_share = num(item.shipping_share);
      const duty_amount = num(item.duty_amount);
      const vat_amount = num(item.vat_amount);
      const landedLine =
        num(item.landed_line_cost) || goods + shipping_share + duty_amount + vat_amount;
      const landedUnit = num(item.landed_unit_cost) || (qty ? landedLine / qty : 0);
      const preview = round2(landedUnit * (1 + margin));
      const floor = round2(landedUnit * (1 + safety));
      return {
        item,
        product,
        sku: product?.sku || `#${item.product_id}`,
        name: product?.name || "",
        qty,
        goods,
        shipping_share,
        duty_amount,
        vat_amount,
        landedLine,
        landedUnit,
        preview,
        floor,
        belowFloor: preview + 0.001 < floor,
        profitUnit: round2(preview - landedUnit),
        allocated: item.landed_unit_cost != null,
      };
    });
  }, [batch, products, margin, safety]);

  const totals = useMemo(() => {
    const t = { goods: 0, shipping_share: 0, duty_amount: 0, vat_amount: 0, landed: 0, units: 0 };
    for (const r of rows) {
      t.goods += r.goods;
      t.shipping_share += r.shipping_share;
      t.duty_amount += r.duty_amount;
      t.vat_amount += r.vat_amount;
      t.landed += r.landedLine;
      t.units += r.qty;
    }
    t.overhead = t.shipping_share + t.duty_amount + t.vat_amount;
    t.uplift = t.goods > 0 ? t.overhead / t.goods : 0;
    t.revenue = rows.reduce((s, r) => s + r.preview * r.qty, 0);
    t.profit = t.revenue - t.landed;
    return t;
  }, [rows]);

  const hasAllocation = rows.length > 0 && rows.every((r) => r.allocated);
  const marginBelowSafety = hasAllocation && margin + 0.0001 < safety;
  const suggestBelowFloor = hasAllocation && rows.some((r) => r.belowFloor);
  const manualBelowFloor =
    priceMode === "manual" &&
    rows.some((r) => {
      const v = Number(manualPrices[r.item.id]);
      return Number.isFinite(v) && v + 0.001 < r.floor;
    });
  const pricingBelowFloor = suggestBelowFloor || manualBelowFloor;

  async function runAllocate() {
    const confirmed = await askConfirm({
      title: "Run allocation?",
      message: `Spread shipping, duty and VAT across every line using the ${method} method?`,
      confirmLabel: "Yes, allocate",
    });
    if (!confirmed) return;
    setBusy("allocate");
    setError("");
    setOk("");
    try {
      const res = await api(`/shipments/${id}/allocate`, {
        method: "POST",
        body: JSON.stringify({ method, compare: true }),
      });
      setComparison(res.comparison);
      setBatch(res.shipment);
      setOk("Allocation complete. Landed cost recalculated for every line.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function saveSuggestions() {
    const floorNote = suggestBelowFloor
      ? ` Warning: at ${percent(margin)} some suggested prices sit below the ${percent(safety)} safety floor.`
      : "";
    const confirmed = await askConfirm({
      title: "Lock in these prices?",
      message: `Save suggested retail prices at a ${percent(margin)} profit margin?${floorNote}`,
      confirmLabel: "Yes, save prices",
      danger: suggestBelowFloor,
    });
    if (!confirmed) return;
    setBusy("suggest");
    setError("");
    setOk("");
    try {
      const b = await api(`/shipments/${id}/suggest-prices`, {
        method: "POST",
        body: JSON.stringify({
          profit_margin: margin,
          safety_margin: num(batch?.safety_margin) || DEFAULT_SAFETY,
        }),
      });
      setBatch(b);
      setPriceMode("auto");
      setOk("Suggested prices saved. They apply when you commit the batch.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  function startManual() {
    const next = {};
    for (const r of rows) {
      next[r.item.id] =
        r.item.suggested_retail_price != null
          ? String(r.item.suggested_retail_price)
          : String(r.preview);
    }
    setManualPrices(next);
    setPriceMode("manual");
    setOk("Enter your own retail price for each line, then commit.");
  }

  async function commit() {
    if (!hasAllocation) {
      setError("Run allocation before committing.");
      return;
    }
    if (priceMode == null && !batch.items.some((i) => i.suggested_retail_price != null)) {
      setError("Save suggested prices or enter manual prices first.");
      return;
    }
    if (priceMode === "manual") {
      const bad = rows.filter((r) => {
        const v = manualPrices[r.item.id];
        return v === undefined || v === "" || Number.isNaN(Number(v));
      });
      if (bad.length) {
        setError("Enter a retail price for every line.");
        return;
      }
    }
    const floorNote = pricingBelowFloor
      ? " Some retail prices are below the safety floor (landed × (1 + safety))."
      : "";
    const confirmed = await askConfirm({
      title: "Commit batch?",
      message:
        `Lock this shipment, write Cost history, raise stock and apply retail prices. This cannot be undone.${floorNote}`,
      confirmLabel: "Yes, commit",
      danger: true,
    });
    if (!confirmed) return;
    setBusy("commit");
    setError("");
    setOk("");
    try {
      const body =
        priceMode === "manual"
          ? {
              accept_suggestions: false,
              item_price_overrides: rows.map((r) => ({
                item_id: r.item.id,
                accepted_retail_price: Number(manualPrices[r.item.id]),
              })),
            }
          : { accept_suggestions: true, item_price_overrides: [] };
      const b = await api(`/shipments/${id}/commit`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setBatch(b);
      setPriceMode(null);
      setOk("Batch committed. Stock raised and retail prices applied.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return (
      <div>
        <div className="page-head">
          <div>
            <span className="page-kicker">Costing engine</span>
            <h1>True Cost</h1>
          </div>
        </div>
        <LoadingState
          label="Preparing True Cost"
          tips={["Loading batches…", "Warming the costing workspace…"]}
        />
      </div>
    );
  }

  if (!batches.length) {
    return (
      <div>
        <div className="page-head">
          <div>
            <span className="page-kicker">Costing engine</span>
            <h1>True Cost</h1>
          </div>
        </div>
        <div className="card tc-empty">
          <h2>No shipment batches yet</h2>
          <p className="muted">
            The true-cost engine works on a shipment batch. Create one, add your lines and
            paperwork totals, then come back here.
          </p>
          <Link className="btn primary" to="/shipments">
            Create a shipment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="true-cost">
      {confirmDialog}

      <div className="page-head">
        <div>
          <span className="page-kicker">Costing engine</span>
          <h1>True Cost</h1>
          <p className="muted tc-sub">
            Turn shipping, duty and VAT into an explainable landed cost per unit — then a safe
            retail price.
          </p>
        </div>
      </div>

      <BatchPicker
        batches={batches}
        activeId={id}
        onSelect={(batchId) => navigate(`/true-cost/${batchId}`)}
      />
      {batchLoading && batch && String(batch.id) === String(id) && (
        <p className="muted tc-batch-refresh" aria-live="polite">
          Refreshing batch from server…
        </p>
      )}
      {batchLoading && !batch && (
        <LoadingState tips={["Loading selected batch…", "Remote database can take a moment…"]} />
      )}

      {error && <p className="error">{error}</p>}
      {ok && <p className="success">{ok}</p>}

      {!batch ? (
        <p className="muted">Select a batch above.</p>
      ) : (
        <>
          <ol className="tc-stages" aria-label="Progress">
            {["Lines & costs", "Allocate", "Price", "Commit"].map((label, i) => (
              <li
                key={label}
                className={`tc-stage${stage > i ? " done" : ""}${stage === i ? " current" : ""}`}
              >
                <span className="tc-stage-dot">{stage > i ? "✓" : i + 1}</span>
                <span className="tc-stage-label">{label}</span>
              </li>
            ))}
          </ol>

          {rows.length === 0 ? (
            <div className="card tc-empty">
              <h2>{batch.reference} has no lines</h2>
              <p className="muted">
                Add the products in this shipment and your paperwork totals first.
              </p>
              <Link className="btn primary" to={`/shipments/${batch.id}`}>
                Open batch to add lines
              </Link>
            </div>
          ) : (
            <>
              {/* ── Hero ── */}
              <section className={`tc-hero${hasAllocation ? " is-live" : ""}`}>
                <div className="tc-hero-main">
                  <span className="tc-hero-label">Total landed cost · {batch.reference}</span>
                  <p className="tc-hero-value">
                    <span className="tc-hero-currency">{LOCAL_CURRENCY}</span>
                    <CountUp value={totals.landed} />
                  </p>
                  <p className="tc-hero-note">
                    {hasAllocation ? (
                      <>
                        {totals.units.toLocaleString()} units ·{" "}
                        <strong>{percent(totals.uplift)}</strong> added on top of goods by
                        shipping, duty and VAT
                      </>
                    ) : (
                      "Run allocation to reveal the true cost of every unit."
                    )}
                  </p>
                </div>

                <div className="tc-hero-split">
                  {SEGMENTS.map((seg) => {
                    const value =
                      seg.field === "goods" ? totals.goods : totals[seg.field] ?? 0;
                    const pct = totals.landed > 0 ? (value / totals.landed) * 100 : 0;
                    return (
                      <div className="tc-hero-seg" key={seg.key}>
                        <span className={`tc-swatch seg-${seg.key}`} aria-hidden="true" />
                        <span className="tc-hero-seg-label">{seg.label}</span>
                        <strong>{money(value)}</strong>
                        <span className="tc-hero-seg-pct">{pct.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>

                {hasAllocation && (
                  <div className="tc-hero-bar" aria-hidden="true">
                    {SEGMENTS.map((seg) => {
                      const value = seg.field === "goods" ? totals.goods : totals[seg.field] ?? 0;
                      const pct = totals.landed > 0 ? (value / totals.landed) * 100 : 0;
                      return (
                        <span
                          key={seg.key}
                          className={`tc-hero-bar-seg seg-${seg.key}`}
                          style={{ width: `${pct}%` }}
                        />
                      );
                    })}
                  </div>
                )}
              </section>

              {/* ── Allocation ── */}
              <section className="card tc-panel">
                <div className="tc-panel-head">
                  <div>
                    <span className="tc-panel-kicker">Step 1</span>
                    <h2>Spread the shared costs</h2>
                    <p className="muted">
                      Shipping, duty and VAT arrive as batch totals. Choose how they are split
                      across the lines.
                    </p>
                  </div>
                  {!locked && (
                    <div className="tc-alloc-actions">
                      <div className="tc-method-toggle" role="group" aria-label="Allocation basis">
                        {["quantity", "weight"].map((m) => (
                          <button
                            key={m}
                            type="button"
                            className={`tc-method${method === m ? " active" : ""}`}
                            aria-pressed={method === m}
                            onClick={() => setMethod(m)}
                          >
                            By {m}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="btn primary"
                        onClick={runAllocate}
                        disabled={busy === "allocate"}
                      >
                        {busy === "allocate" ? "Allocating…" : "Run allocation"}
                      </button>
                    </div>
                  )}
                </div>

                {!hasAllocation ? (
                  <p className="muted tc-waiting">
                    Nothing allocated yet — pick a basis and run the allocation to see the
                    build-up.
                  </p>
                ) : (
                  <>
                    <div className="tc-legend">
                      {SEGMENTS.map((seg) => (
                        <span className="tc-legend-item" key={seg.key}>
                          <span className={`tc-swatch seg-${seg.key}`} aria-hidden="true" />
                          {seg.label}
                        </span>
                      ))}
                      <span className="tc-legend-note">
                        Basis: <strong>{batch.allocation_method || method}</strong> ·{" "}
                        {modeLabel(batch.primary_cost_mode)}
                      </span>
                    </div>

                    <ul className="tc-waterfall">
                      {rows.map((r, idx) => (
                        <li
                          className="tc-line"
                          key={r.item.id}
                          style={{ "--i": idx }}
                        >
                          <div className="tc-line-head">
                            <div className="tc-line-id">
                              <strong>{r.sku}</strong>
                              <span className="muted">{r.name}</span>
                            </div>
                            <div className="tc-line-unit">
                              <span className="tc-line-unit-label">Landed / unit</span>
                              <strong>
                                <CountUp value={r.landedUnit} />
                              </strong>
                            </div>
                          </div>

                          <div className="tc-bar" role="img"
                            aria-label={`${r.sku}: goods ${money(r.goods)}, shipping ${money(
                              r.shipping_share
                            )}, duty ${money(r.duty_amount)}, VAT ${money(r.vat_amount)}`}
                          >
                            {SEGMENTS.map((seg) => {
                              const value = seg.field === "goods" ? r.goods : r[seg.field];
                              const pct = r.landedLine > 0 ? (value / r.landedLine) * 100 : 0;
                              if (pct <= 0) return null;
                              return (
                                <span
                                  key={seg.key}
                                  className={`tc-bar-seg seg-${seg.key}`}
                                  style={{ width: `${pct}%` }}
                                  title={`${seg.label}: ${money(value)}`}
                                />
                              );
                            })}
                          </div>

                          <div className="tc-line-foot">
                            <span>
                              {r.qty} × {money(r.item.local_unit_product_cost)} goods
                            </span>
                            <span>+ {money(r.shipping_share)} ship</span>
                            <span>+ {money(r.duty_amount)} duty</span>
                            <span>+ {money(r.vat_amount)} VAT</span>
                            <span className="tc-line-total">= {money(r.landedLine)} line</span>
                          </div>
                        </li>
                      ))}
                    </ul>

                    {comparison && <MethodCompare comparison={comparison} rows={rows} chosen={batch.allocation_method || method} />}
                  </>
                )}
              </section>

              {/* ── Pricing ── */}
              {hasAllocation && (
                <section className="card tc-panel tc-price-lab">
                  <div className="tc-panel-head">
                    <div>
                      <span className="tc-panel-kicker">Step 2</span>
                      <h2>Find a safe retail price</h2>
                      <p className="muted">
                        Drag the margin. Prices update live. Red mark = safety floor (
                        {percent(safety)} above landed).
                      </p>
                    </div>
                  </div>

                  <div className="tc-margin-dial">
                    <div className="tc-margin-readout">
                      <span className="tc-margin-value">{(margin * 100).toFixed(0)}%</span>
                      <span className="tc-margin-caption">profit margin</span>
                    </div>
                    <div className="tc-margin-control">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={margin}
                        disabled={locked}
                        className={marginBelowSafety ? "danger" : undefined}
                        onChange={(e) => setMargin(Number(e.target.value))}
                        aria-label="Profit margin"
                      />
                      <div className="tc-margin-scale">
                        <span>0%</span>
                        <span>profit margin</span>
                        <span>100%</span>
                      </div>
                      {marginBelowSafety && (
                        <p className="tc-margin-warn" role="status">
                          Margin is below the {percent(safety)} safety floor — suggested retail
                          would sit under the safe price on every line.
                        </p>
                      )}
                    </div>
                    <div className="tc-margin-projection">
                      <div>
                        <span>Projected revenue</span>
                        <strong>
                          <CountUp value={totals.revenue} duration={400} />
                        </strong>
                      </div>
                      <div>
                        <span>Projected profit</span>
                        <strong className={totals.profit >= 0 ? "stock-ok" : "stock-bad"}>
                          <CountUp value={totals.profit} duration={400} />
                        </strong>
                      </div>
                    </div>
                  </div>

                  <ul className="tc-ladder">
                    {rows.map((r) => {
                      const span = Math.max(r.preview, r.landedUnit, r.floor) || 1;
                      return (
                        <li
                          key={r.item.id}
                          className={`tc-rung${r.belowFloor ? " below-floor" : ""}`}
                        >
                          <div className="tc-rung-id">
                            <strong>{r.sku}</strong>
                            <span className="muted">{r.name}</span>
                          </div>
                          <div className="tc-rung-track">
                            <span
                              className="tc-rung-cost"
                              style={{ width: `${(r.landedUnit / span) * 100}%` }}
                            />
                            <span
                              className="tc-rung-profit"
                              style={{
                                width: `${(Math.max(0, r.preview - r.landedUnit) / span) * 100}%`,
                              }}
                            />
                            <span
                              className="tc-rung-floor"
                              style={{ left: `${(r.floor / span) * 100}%` }}
                              title={`Floor ${money(r.floor)}`}
                            />
                          </div>
                          <div className="tc-rung-figures">
                            <span className="tc-rung-landed">{money(r.landedUnit)}</span>
                            <span className="tc-rung-arrow" aria-hidden="true">
                              →
                            </span>
                            <strong
                              className={`tc-rung-retail${r.belowFloor ? " stock-bad" : ""}`}
                            >
                              <CountUp value={r.preview} duration={350} />
                            </strong>
                            <span className="tc-rung-gain">+{money(r.profitUnit)}</span>
                            <span className="tc-rung-floor-label muted">
                              floor {money(r.floor)}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {!locked && (
                    <div className="tc-price-actions">
                      <button
                        type="button"
                        className="btn primary"
                        onClick={saveSuggestions}
                        disabled={busy === "suggest"}
                      >
                        {busy === "suggest" ? "Saving…" : `Use ${(margin * 100).toFixed(0)}% suggested prices`}
                      </button>
                      <button type="button" className="btn" onClick={startManual}>
                        Enter prices manually
                      </button>
                      {priceMode === "auto" && (
                        <span className="tc-chosen">Suggested prices ready to commit.</span>
                      )}
                    </div>
                  )}

                  {priceMode === "manual" && !locked && (
                    <div className="tc-manual">
                      <h3>Your retail prices</h3>
                      <p className="muted">
                        Floor = landed × (1 + {percent(safety)}). Prices below floor are flagged.
                      </p>
                      {rows.map((r) => {
                        const raw = manualPrices[r.item.id];
                        const val = Number(raw);
                        const under =
                          Number.isFinite(val) && raw !== "" && val + 0.001 < r.floor;
                        return (
                          <div
                            className={`tc-manual-row${under ? " below-floor" : ""}`}
                            key={r.item.id}
                          >
                            <div>
                              <strong>{r.sku}</strong>
                              <span className="muted">
                                {" "}
                                landed {money(r.landedUnit)} · floor {money(r.floor)}
                              </span>
                              {under && (
                                <span className="tc-manual-warn"> below floor</span>
                              )}
                            </div>
                            <label>
                              Retail ({LOCAL_CURRENCY})
                              <input
                                value={raw ?? ""}
                                className={under ? "danger" : undefined}
                                onChange={(e) =>
                                  setManualPrices((prev) => ({
                                    ...prev,
                                    [r.item.id]: e.target.value,
                                  }))
                                }
                              />
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              {/* ── Commit ── */}
              <section className={`card tc-commit${locked ? " locked" : ""}`}>
                {locked ? (
                  <>
                    <div>
                      <h2>Batch committed</h2>
                      <p className="muted">
                        Cost history is written, stock is raised and retail prices are live.
                      </p>
                    </div>
                    <div className="actions-inline">
                      <Link className="btn" to={`/shipments/${batch.id}`}>
                        View cost history
                      </Link>
                      <Link className="btn primary" to="/inventory">
                        Go to stock
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h2>Commit this batch</h2>
                      <p className="muted">
                        Locks the shipment, writes the ledger, raises stock and applies retail
                        prices.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn primary"
                      onClick={commit}
                      disabled={busy === "commit" || !hasAllocation}
                    >
                      {busy === "commit" ? "Committing…" : "Commit batch"}
                    </button>
                  </>
                )}
              </section>

              <p className="tc-footlink">
                Need to edit lines, costs or view the ledger?{" "}
                <Link to={`/shipments/${batch.id}`}>Open {batch.reference}</Link>
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}

function MethodCompare({ comparison, rows, chosen }) {
  const other = chosen === "weight" ? "quantity" : "weight";
  const otherRows = comparison?.[other];
  if (!Array.isArray(otherRows) || !otherRows.length) return null;

  return (
    <div className="tc-compare">
      <h3>
        If you allocated by <em>{other}</em> instead
      </h3>
      <ul>
        {otherRows.map((row) => {
          const mine = rows.find((r) => r.item.id === row.item_id);
          if (!mine) return null;
          const delta = num(row.landed_unit_cost) - mine.landedUnit;
          const dir = delta > 0.005 ? "up" : delta < -0.005 ? "down" : "flat";
          return (
            <li key={row.item_id} className={`tc-compare-row ${dir}`}>
              <span className="tc-compare-sku">{mine.sku}</span>
              <span className="tc-compare-now">{money(mine.landedUnit)}</span>
              <span className="tc-compare-arrow" aria-hidden="true">
                →
              </span>
              <span className="tc-compare-alt">{money(row.landed_unit_cost)}</span>
              <span className="tc-compare-delta">
                {dir === "flat" ? "no change" : `${delta > 0 ? "+" : ""}${money(delta)}`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
