/**
 * Minimal CSV helpers (no deps). Handles commas, quotes, and CRLF.
 */

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  const src = String(text ?? "").replace(/^\uFEFF/, "");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    const next = src[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (ch === "\n" || (ch === "\r" && next === "\n")) {
      row.push(cell.trim());
      cell = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
      if (ch === "\r") i++;
      continue;
    }
    if (ch === "\r") {
      row.push(cell.trim());
      cell = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  row.push(cell.trim());
  if (row.some((c) => c !== "")) rows.push(row);
  return rows;
}

/** Lowercase header aliases → canonical key */
const ALIASES = {
  sku: "sku",
  code: "sku",
  product_sku: "sku",
  name: "name",
  product: "name",
  product_name: "name",
  title: "name",
  unit: "unit",
  weight: "default_weight_kg",
  weight_kg: "default_weight_kg",
  default_weight_kg: "default_weight_kg",
  default_weight: "default_weight_kg",
  reorder: "reorder_level",
  reorder_level: "reorder_level",
  category: "category",
  brand: "brand",
  origin: "origin_country",
  origin_country: "origin_country",
  barcode: "barcode",
  description: "description",
  notes: "notes",
  qty: "quantity",
  quantity: "quantity",
  qty_pcs: "quantity",
  line_weight: "weight_kg",
  line_weight_kg: "weight_kg",
  weight_line: "weight_kg",
  local_unit: "local_unit_product_cost",
  local_unit_product_cost: "local_unit_product_cost",
  local_cost: "local_unit_product_cost",
  zmw: "local_unit_product_cost",
  foreign_unit: "foreign_unit_price",
  foreign_unit_price: "foreign_unit_price",
  usd: "foreign_unit_price",
  usd_unit: "foreign_unit_price",
  mode: "line_cost_mode",
  line_mode: "line_cost_mode",
  line_cost_mode: "line_cost_mode",
  cost_mode: "line_cost_mode",
  // full-shipment meta keys (field,value rows above the sku header)
  reference: "reference",
  ref: "reference",
  primary_cost_mode: "primary_cost_mode",
  shipment_mode: "primary_cost_mode",
  supplier: "supplier_name",
  supplier_name: "supplier_name",
  invoice: "invoice_number",
  invoice_number: "invoice_number",
  clearing_agent: "clearing_agent",
  carrier: "carrier_name",
  carrier_name: "carrier_name",
  destination: "destination",
  currency_foreign: "currency_foreign",
  foreign_currency: "currency_foreign",
  currency_local: "currency_local",
  shipping: "shipping_total",
  shipping_total: "shipping_total",
  duty: "duty_total",
  duty_total: "duty_total",
  vat: "vat_total",
  vat_total: "vat_total",
  exchange_rate: "exchange_rate",
  fx_rate: "exchange_rate",
  paperwork: "paperwork_source",
  paperwork_source: "paperwork_source",
};

export function normHeader(h) {
  return String(h || "")
    .trim()
    .toLowerCase()
    .replace(/[\s\-]+/g, "_")
    .replace(/[()]/g, "");
}

export function aliasHeader(h) {
  const n = normHeader(h);
  return ALIASES[n] || n;
}

export function rowsToObjects(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map((h) => ALIASES[normHeader(h)] || normHeader(h));
  return rows.slice(1).map((cells, idx) => {
    const obj = { __row: idx + 2 };
    headers.forEach((key, i) => {
      if (!key) return;
      obj[key] = cells[i] ?? "";
    });
    return obj;
  });
}

export function parseCsvObjects(text) {
  return rowsToObjects(parseCsv(text));
}

export function numOrNull(v) {
  if (v === undefined || v === null || String(v).trim() === "") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}
