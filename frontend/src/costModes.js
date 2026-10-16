/**
 * Shared cost-mode catalogue (GRASP Protected Variations / GoF Strategy config).
 * UI and formatters consume this single source of truth.
 */

export const COST_MODES = [
  {
    id: "already_local",
    title: "Already-Local",
    hint: "Agent or shipper paperwork already in ZMW.",
    icon: "K",
    needsFx: false,
  },
  {
    id: "auto_fx",
    title: "Auto FX",
    hint: "Supplier invoice still in foreign currency.",
    icon: "$",
    needsFx: true,
  },
  {
    id: "mixed",
    title: "Mixed",
    hint: "Combine local charges with foreign lines.",
    icon: "±",
    needsFx: true,
  },
];

/** Modes shown in the UI (Mixed kept in COST_MODES for labels/compat, hidden for now). */
export const PRIMARY_COST_MODES = COST_MODES.filter((m) => m.id !== "mixed");
export const LINE_COST_MODES = PRIMARY_COST_MODES;

/** Starter FX before Fetch FX when no last-fetched cache exists (demo default). */
export const DEFAULT_STARTER_FX_RATE = 20;

const BY_ID = Object.fromEntries(COST_MODES.map((m) => [m.id, m]));

export function modeLabel(mode) {
  if (!mode) return "—";
  return BY_ID[mode]?.title || String(mode).replace(/_/g, " ");
}

export function modeNeedsFx(mode) {
  return Boolean(BY_ID[mode]?.needsFx);
}
