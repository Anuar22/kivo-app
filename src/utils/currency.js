// ── Currency formatting ───────────────────────────────────────────────────────
// Change CURRENCY_SYMBOL here to update prices across the whole app at once.

const CURRENCY_SYMBOL = "TSh";

/**
 * fmt(5000)       → "TSh 5,000"
 * fmt(5000, true) → "TSh 5,000.00"
 */
export function fmt(amount, decimals = false) {
  const n = Number(amount) || 0;
  return decimals
    ? `${CURRENCY_SYMBOL} ${n.toLocaleString("en-TZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `${CURRENCY_SYMBOL} ${Math.round(n).toLocaleString("en-TZ")}`;
}

export { CURRENCY_SYMBOL };
