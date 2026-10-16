/**
 * Short admin-facing labels for cost-history rows (When / What happened).
 */

export function ledgerEventLabel(row, product) {
  const eventType = typeof row === "string" ? row : row?.event_type;
  const p = (typeof row === "object" && row?.payload_json) || {};
  const sku = product?.sku ? `${product.sku} — ` : "";

  switch (eventType) {
    case "landed_cost":
      return `${sku}Landed cost recorded`;
    case "price_accepted": {
      const suggested = Number(p.suggested_retail_price);
      const accepted = Number(p.accepted_retail_price);
      const looksManual =
        p.pricing_method === "manual" ||
        (p.pricing_method == null &&
          Number.isFinite(suggested) &&
          Number.isFinite(accepted) &&
          Math.abs(suggested - accepted) > 0.009);

      if (looksManual) {
        return `${sku}Retail price locked — manual input`;
      }
      const pct = Math.round(Number(p.profit_margin || 0) * 100);
      if (Number.isFinite(pct) && pct >= 0) {
        return `${sku}Retail price locked — ${pct}% margin`;
      }
      return `${sku}Retail price locked — margin %`;
    }
    case "paperwork_source":
      return "Paperwork source noted";
    case "margin_alert":
      return `${sku}Price check note`;
    default:
      return String(eventType || "Event").replace(/_/g, " ");
  }
}
