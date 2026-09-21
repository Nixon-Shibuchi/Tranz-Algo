export const LOCAL_CURRENCY = "ZMW";

export function money(n, opts = {}) {
  const { currency = LOCAL_CURRENCY, withCode = false } = opts;
  if (n == null || n === "") return "—";
  const v = Number(n);
  if (Number.isNaN(v)) return "—";
  const formatted = v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return withCode ? `${formatted} ${currency}` : formatted;
}

export function moneyZmw(n) {
  return money(n, { currency: LOCAL_CURRENCY, withCode: true });
}

export function percent(n) {
  if (n == null || n === "") return "—";
  const v = Number(n);
  if (Number.isNaN(v)) return "—";
  return `${(v * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
}

export { modeLabel } from "./costModes";
