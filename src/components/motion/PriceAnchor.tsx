"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { PRICE_ANCHOR } from "@/lib/pricing";
import s from "./PriceAnchor.module.scss";

/** idle: nothing shown yet (space reserved). play: the sequence runs. done: final state, no motion. */
export type PriceAnchorPhase = "idle" | "play" | "done";

/** Share of the block that must be on screen before the sequence plays. */
export const PRICE_ANCHOR_THRESHOLD = 0.5;

/** First phase: final state when motion is off, otherwise wait for the viewport. */
export function initialPhase(still: boolean): PriceAnchorPhase {
  return still ? "done" : "idle";
}

interface PriceAnchorProps {
  /** lg: homepage and /pricing. md: plan card. sm: /join and /check. */
  size?: "lg" | "md" | "sm";
  /** Show the calls line under the price. */
  showCalls?: boolean;
  /** Final state from the first render, no animation (reduced motion, tests). */
  still?: boolean;
  className?: string;
}

/**
 * The membership price with a comparison above it: "Typical law firm
 * retainer US$1,500" struck through in red, then "ILP membership US$79.99 a
 * month". The US$1,500 is a comparison, never ILP's former price (lib/pricing).
 *
 * Sequence, once, when half the block is in the viewport: 1) the comparison
 * label and figure rise in; 2) a red line draws across the figure from its
 * left edge (scaleX) and the figure dims; 3) the membership price rises in
 * (opacity, scale 0.96 to 1), then "a month" and the calls line. Only
 * transform and opacity move, with the scss easing and duration tokens. All
 * text is in the markup from the start, so nothing shifts. Reduced motion: the
 * final state, at once (also in CSS, before hydration).
 *
 * A screen reader (and copy and paste) gets one sentence: "Typical law firm
 * retainer US$1,500. ILP membership US$79.99 a month." The struck figure is a
 * <del>; its line is a decorative, aria-hidden span.
 */
export default function PriceAnchor({ size = "md", showCalls = false, still = false, className = "" }: PriceAnchorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<PriceAnchorPhase>(() => initialPhase(still));

  useEffect(() => {
    if (phase !== "idle") return;
    if (reduce || typeof IntersectionObserver === "undefined") {
      setPhase("done");
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPhase("play");
          io.disconnect();
        }
      },
      { threshold: PRICE_ANCHOR_THRESHOLD },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [phase, reduce]);

  const p = PRICE_ANCHOR;
  return (
    <div ref={ref} className={`${s.anchor} ${s[size]} ${className}`} data-phase={phase}>
      <div className={s.compare}>
        <span className={s.compareLabel}>{p.compareLabel}</span>{" "}
        <del className={s.struck}>
          <span className={s.struckText}>{p.compare}</span>
          <span className={s.strike} aria-hidden="true" />
        </del>
        <span className={s.srOnly}>. </span>
      </div>
      <div className={s.ours}>
        <span className={s.oursLabel}>{p.label}</span>{" "}
        <span className={s.priceRow}>
          <span className={s.figure}>{p.price}</span> <span className={s.unit}>{p.unit}</span>
        </span>
        <span className={s.srOnly}>.</span>
      </div>
      {showCalls && <p className={s.calls}>{p.calls}</p>}
    </div>
  );
}
