/**
 * money.ts — Centralized money utilities for ILP.
 *
 * Design decision: NO currency conversion.
 * When a quote has line items in multiple currencies, subtotals and total
 * are aggregated PER CURRENCY (one bucket per currency present).
 * This avoids contractual ambiguity and exchange-rate disputes.
 *
 * Used by: QuoteEditor, BlockRenderer, QuotesTab.
 */

export interface CurrencyBucket {
  currency: string;
  amount: number;
}

/** Currency → display symbol map. Falls back to the ISO code itself. */
const CURRENCY_SYMBOL: Record<string, string> = {
  USD: '$',
  EUR: '€',
  CRC: '₡',
  CAD: 'C$',
  GBP: '£',
  MXN: 'MX$',
  PEN: 'S/',
  COP: 'COP$',
  CLP: 'CLP$',
  PAB: 'B/.',
};

/**
 * Format a single amount+currency pair.
 * e.g. formatMoney(20293, 'USD') → '$20,293.00'
 *      formatMoney(500000, 'CRC') → '₡500,000.00'
 */
export function formatMoney(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOL[currency] ?? (currency + '\u00a0');
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sym}${formatted}`;
}

/**
 * Aggregate line items by currency bucket.
 *
 * @param lineItems  — items to aggregate (must have amount + currency fields)
 * @param selectedIds — if non-null, only items whose lineId is in this set are included.
 *                     Pass `null` to include ALL items (useful in the editor).
 * @returns Array of { currency, amount } sorted: USD first, then alphabetically.
 */
export function aggregateByCurrency(
  lineItems: Array<{ lineId: string; amount: number; currency: string }>,
  selectedIds: Set<string> | null = null,
): CurrencyBucket[] {
  const map = new Map<string, number>();
  for (const li of lineItems) {
    if (selectedIds !== null && !selectedIds.has(li.lineId)) continue;
    const amt = Number(li.amount) || 0;
    if (amt === 0) continue;
    map.set(li.currency, (map.get(li.currency) ?? 0) + amt);
  }
  return Array.from(map.entries())
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => {
      // USD always first
      if (a.currency === 'USD') return -1;
      if (b.currency === 'USD') return 1;
      return a.currency.localeCompare(b.currency);
    });
}

/**
 * Format an array of CurrencyBuckets as a compact inline string.
 * e.g. '$20,293.00 USD · ₡500,000.00 CRC'
 * If empty, returns '$0.00'.
 */
export function formatTotalsLine(
  buckets: CurrencyBucket[],
  includeCurrencyCode = true,
): string {
  if (buckets.length === 0) return '$0.00';
  return buckets
    .map((b) => `${formatMoney(b.amount, b.currency)}${includeCurrencyCode ? ' ' + b.currency : ''}`)
    .join('  ·  ');
}

/** Convenience: get a flat total for legacy single-currency contexts (USD amount only). */
export function usdTotal(lineItems: Array<{ amount: number; currency: string }>): number {
  return lineItems
    .filter((li) => li.currency === 'USD' || !li.currency)
    .reduce((s, li) => s + (Number(li.amount) || 0), 0);
}