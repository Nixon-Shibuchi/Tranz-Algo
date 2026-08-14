export function stockQty(p) {
  return Number(p?.stock_on_hand || 0);
}

/** @returns {"out"|"low"|"available"} */
export function stockStatus(p) {
  const qty = stockQty(p);
  if (qty <= 0) return "out";
  const reorder = p.reorder_level != null ? Number(p.reorder_level) : null;
  if (reorder != null && !Number.isNaN(reorder) && qty <= reorder) return "low";
  return "available";
}

export const STOCK_STATUS_LABEL = {
  available: "In stock",
  low: "Low stock",
  out: "Out of stock",
};

/** Shorter labels for dense tables */
export const STOCK_STATUS_SHORT = {
  available: "In stock",
  low: "Low",
  out: "Out",
};
