/**
 * PriceAnchor sequence as data (components/motion/PriceAnchor.tsx), so the
 * order and the timing are testable without a browser. The durations mirror
 * the scss tokens in styles/_variables.scss ($duration-reveal, $duration-count,
 * $duration-fade, $duration-strike, $duration-throw); keep the two in sync.
 */
import { usdLabel } from "@/lib/pricing";

/**
 * idle: hidden, space reserved. intro: label and a big US$1,500 rise in.
 * count: the figure counts down to US$79.99 and shrinks to COUNT_SCALE.
 * slash: a ghost US$1,500 takes the figure's place and a red line draws
 * across it. split: the ghost is thrown up into the small struck slot while
 * US$79.99 grows back to full size. settle: the struck slot takes over from
 * the ghost, "ILP membership" and "a month" fade in. done: final, no motion.
 */
export type PriceAnchorPhase = "idle" | "intro" | "count" | "slash" | "split" | "settle" | "done";

/** Share of the block that must be on screen before the sequence plays. */
export const PRICE_ANCHOR_THRESHOLD = 0.5;

/** Scale of the figure at the end of the count (and of the ghost when slashed). Mirrors $count-scale. */
export const COUNT_SCALE = 0.92;

/** Milliseconds. Mirrors the scss duration tokens. */
export const PRICE_ANCHOR_MS = { reveal: 300, count: 1100, fade: 150, strike: 420, throw: 500 } as const;

const STAGES: ReadonlyArray<readonly [PriceAnchorPhase, number]> = [
  ["intro", PRICE_ANCHOR_MS.reveal],
  ["count", PRICE_ANCHOR_MS.count],
  ["slash", PRICE_ANCHOR_MS.fade + PRICE_ANCHOR_MS.strike],
  ["split", PRICE_ANCHOR_MS.throw],
  ["settle", PRICE_ANCHOR_MS.reveal],
];

export interface PriceAnchorStage {
  phase: PriceAnchorPhase;
  /** Start, in ms after the block enters the viewport. */
  at: number;
  /** Length, in ms. */
  ms: number;
}

/** intro 0, count 300, slash 1400, split 1970, settle 2470, done 2770. */
export const PRICE_ANCHOR_TIMELINE: readonly PriceAnchorStage[] = (() => {
  let at = 0;
  const out: PriceAnchorStage[] = [];
  for (const [phase, ms] of STAGES) {
    out.push({ phase, at, ms });
    at += ms;
  }
  out.push({ phase: "done", at, ms: 0 });
  return out;
})();

/** First phase: final state when motion is off, otherwise wait for the viewport. */
export function initialPhase(still: boolean): PriceAnchorPhase {
  return still ? "done" : "idle";
}

/** The counting figure: whole dollars with a comma on the way, the exact price at the end. */
export function formatCount(v: number, target: number): string {
  return Math.abs(v - target) < 0.005 ? usdLabel(target) : `US$${Math.round(v).toLocaleString("en-US")}`;
}
