/**
 * Price comparison shown above the membership price on member-facing landings
 * (components/motion/PriceAnchor.tsx).
 *
 * LEGAL: ILP has never charged US$1,500. The figure is a comparison with what a
 * typical law firm asks as a retainer, never ILP's former, regular or list
 * price, so the copy must never say "was", "before", "regular price" or
 * "save" (FTC Guides Against Deceptive Pricing, 16 CFR 233.1 and 233.2).
 * Counsel must confirm the figure is substantiated for each of the six
 * countries before launch (docs/LAUNCH_CHECKLIST.md, section 19). Change it
 * here only; every page reads it from this constant.
 */
import { PLAN_STANDARD } from "@/lib/contracts";

/** Typical law firm retainer, in US dollars. Comparison only (see above). */
export const COMPARISON_RETAINER_USD = 1500;

/** "US$1,500", "US$79.99". Whole dollars drop the cents. */
export function usdLabel(dollars: number): string {
  const whole = Number.isInteger(dollars);
  return `US$${dollars.toLocaleString("en-US", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })}`;
}

/** Every word the price anchor shows. */
export const PRICE_ANCHOR = {
  compareLabel: "Typical law firm retainer",
  compare: usdLabel(COMPARISON_RETAINER_USD),
  label: "ILP membership",
  price: usdLabel(PLAN_STANDARD.monthlyCents / 100),
  unit: "a month",
  calls: `Up to ${PLAN_STANDARD.callsIncluded} calls of ${PLAN_STANDARD.callLengthMin} minutes a month with a lawyer licensed in your country`,
} as const;

/** What a screen reader (and copy and paste) gets: the sentence, once. */
export const PRICE_ANCHOR_SPOKEN = `${PRICE_ANCHOR.compareLabel} ${PRICE_ANCHOR.compare}. ${PRICE_ANCHOR.label} ${PRICE_ANCHOR.price} ${PRICE_ANCHOR.unit}.`;
