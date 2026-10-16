import { aliasHeader, numOrNull, parseCsv, parseCsvObjects } from "./csvParse";

function modeFromCell(raw, fallback) {
  const t = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[\s\-]+/g, "_");
  if (!t) return fallback;
  if (t.includes("auto") || t === "fx" || t === "auto_fx") return "auto_fx";
  if (t.includes("local") || t === "already_local" || t === "zmw") return "already_local";
  // Mixed is hidden in the UI for now — treat as Already-Local if a CSV says mixed.
  if (t === "mixed") return "already_local";
  return fallback;
}

/**
 * Full shipment CSV:
 *   field,value          ← header / costs (until a row whose first cell is sku)
 *   sku,qty,local_unit   ← line table
 */
export function parseFullShipmentCsv(text) {
  const raw = parseCsv(text);
  const errors = [];
  let hdrIdx = -1;
  for (let i = 0; i < raw.length; i++) {
    if (aliasHeader(raw[i][0]) === "sku") {
      hdrIdx = i;
      break;
    }
  }
  if (hdrIdx < 0) {
    return {
      header: null,
      costs: null,
      linesText: "",
      errors: ["CSV needs a lines header row starting with sku (after field,value meta rows)."],
    };
  }

  const meta = {};
  for (let i = 0; i < hdrIdx; i++) {
    const row = raw[i];
    if (!row?.length || row.every((c) => !String(c || "").trim())) continue;
    const key = aliasHeader(row[0]);
    if (!key || key === "sku") continue;
    meta[key] = String(row[1] ?? "").trim();
  }

  const reference = String(meta.reference || "").trim();
  if (!reference) errors.push("Meta: reference is required");

  const primaryRaw = modeFromCell(
    meta.primary_cost_mode || meta.line_cost_mode,
    "already_local"
  );
  const primary = primaryRaw === "auto_fx" ? "auto_fx" : "already_local";

  const header = {
    reference,
    supplier_name: meta.supplier_name || null,
    invoice_number: meta.invoice_number || null,
    clearing_agent: meta.clearing_agent || null,
    carrier_name: meta.carrier_name || null,
    origin_country: meta.origin_country || null,
    destination: meta.destination || "Zambia",
    primary_cost_mode: primary,
    currency_foreign: meta.currency_foreign || "USD",
    currency_local: "ZMW",
    notes: meta.notes || null,
    expected_arrival_date: null,
    received_date: null,
  };

  const costs = {
    exchange_rate: numOrNull(meta.exchange_rate),
    shipping_total: numOrNull(meta.shipping_total),
    duty_total: numOrNull(meta.duty_total),
    vat_total: numOrNull(meta.vat_total),
    paperwork_source: meta.paperwork_source || null,
  };

  const lineGrid = raw.slice(hdrIdx);
  const linesText = lineGrid.map((r) => r.map(csvEscape).join(",")).join("\n");

  return { header, costs, linesText, errors, meta };
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Map CSV rows → product create payloads (skips blank names). */
export function mapProductRows(text) {
  const rows = parseCsvObjects(text);
  const ready = [];
  const errors = [];
  for (const row of rows) {
    const name = String(row.name || "").trim();
    if (!name && !String(row.sku || "").trim()) continue;
    if (!name) {
      errors.push(`Row ${row.__row}: name is required`);
      continue;
    }
    ready.push({
      sku: String(row.sku || "").trim() || null,
      name,
      unit: String(row.unit || "pcs").trim() || "pcs",
      default_weight_kg: numOrNull(row.default_weight_kg),
      reorder_level: numOrNull(row.reorder_level),
      category: String(row.category || "").trim() || null,
      brand: String(row.brand || "").trim() || null,
      origin_country: String(row.origin_country || "").trim() || null,
      barcode: String(row.barcode || "").trim() || null,
      description: String(row.description || "").trim() || null,
      __row: row.__row,
    });
  }
  return { ready, errors };
}

/**
 * Map CSV rows → shipment line payloads.
 * products: [{ id, sku, name }]
 * defaultMode: already_local | auto_fx
 */
export function mapShipmentLineRows(text, products, defaultMode = "already_local") {
  const bySku = new Map(
    products.map((p) => [String(p.sku || "").trim().toLowerCase(), p])
  );
  const rows = parseCsvObjects(text);
  const ready = [];
  const errors = [];
  const fallback =
    defaultMode === "auto_fx" || defaultMode === "already_local"
      ? defaultMode
      : "already_local";

  for (const row of rows) {
    const sku = String(row.sku || "").trim();
    if (!sku && !row.quantity) continue;
    if (!sku) {
      errors.push(`Row ${row.__row}: sku is required`);
      continue;
    }
    const product = bySku.get(sku.toLowerCase());
    if (!product) {
      errors.push(`Row ${row.__row}: unknown SKU “${sku}” — add it under Products first`);
      continue;
    }
    const quantity = numOrNull(row.quantity);
    if (quantity == null || quantity <= 0) {
      errors.push(`Row ${row.__row}: quantity must be a positive number`);
      continue;
    }
    const mode = modeFromCell(row.line_cost_mode, fallback);
    const local = numOrNull(row.local_unit_product_cost);
    const foreign = numOrNull(row.foreign_unit_price);
    if (mode === "already_local" && local == null) {
      errors.push(`Row ${row.__row}: local_unit required for Already-Local`);
      continue;
    }
    if (mode === "auto_fx" && foreign == null) {
      errors.push(`Row ${row.__row}: foreign_unit (USD) required for Auto FX`);
      continue;
    }
    ready.push({
      product_id: product.id,
      quantity,
      weight_kg: numOrNull(row.weight_kg),
      line_cost_mode: mode,
      foreign_unit_price: foreign,
      local_unit_product_cost: local,
      __sku: product.sku,
      __row: row.__row,
    });
  }
  return { ready, errors };
}
