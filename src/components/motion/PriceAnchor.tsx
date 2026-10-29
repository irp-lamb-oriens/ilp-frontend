"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { EASE_OUT_STRONG } from "@/components/ui/loadingTiming";
import { PLAN_STANDARD } from "@/lib/contracts";
import { COMPARISON_RETAINER_USD, PRICE_ANCHOR } from "@/lib/pricing";
import {
  PRICE_ANCHOR_MS,
  PRICE_ANCHOR_THRESHOLD,
  PRICE_ANCHOR_TIMELINE,
  formatCount,
  initialPhase,
  type PriceAnchorPhase,
} from "./priceAnchorTimeline";
import s from "./PriceAnchor.module.scss";

export { initialPhase, PRICE_ANCHOR_THRESHOLD, type PriceAnchorPhase };

const TARGET = PLAN_STANDARD.monthlyCents / 100;

interface PriceAnchorProps {
  /** lg: homepage. md: plan card and /pricing. sm: /join and /check. */
  size?: "lg" | "md" | "sm";
  /** Show the calls line under the price. */
  showCalls?: boolean;
  /** Final state from the first render, no animation (reduced motion, tests). */
  still?: boolean;
  className?: string;
}

/**
 * The membership price with a comparison: "Typical law firm retainer
 * US$1,500" struck through in red, above "ILP membership US$79.99 a month".
 * The US$1,500 is a comparison, never ILP's former price (lib/pricing).
 *
 * Sequence (priceAnchorTimeline.ts), once, when half the block is in view:
 * the label and a big US$1,500 rise in; the figure counts down to US$79.99
 * while it shrinks a little; a ghost US$1,500 takes its place and a red line
 * draws across it; the ghost is thrown up into the small struck slot while
 * US$79.99 grows back to full size; then "ILP membership" and "a month" fade
 * in. The counting text is set from requestAnimationFrame; everything that
 * moves uses transform and opacity only. Both slots are laid out from the
 * first paint, so nothing shifts.
 *
 * The counter and the ghost draw their figures from a data attribute (CSS
 * content), so screen readers and copy and paste get one sentence: "Typical
 * law firm retainer US$1,500. ILP membership US$79.99 a month." The struck
 * figure is a <del>. Reduced motion: the final state at once.
 */
export default function PriceAnchor({ size = "md", showCalls = false, still = false, className = "" }: PriceAnchorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const delRef = useRef<HTMLModElement>(null);
  const ghostRef = useRef<HTMLSpanElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<PriceAnchorPhase>(() => initialPhase(still));
  const [playing, setPlaying] = useState(false);

  // Wait for the viewport (or skip straight to the end).
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
          io.disconnect();
          setPhase("intro");
          setPlaying(true);
        }
      },
      { threshold: PRICE_ANCHOR_THRESHOLD },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [phase, reduce]);

  // Run the timeline once.
  useEffect(() => {
    if (!playing) return;
    let count: { stop: () => void } | undefined;

    /** Where the ghost lands: the struck slot, at the struck size. */
    const measureThrow = () => {
      const wrap = wrapRef.current;
      const del = delRef.current;
      const ghost = ghostRef.current;
      if (!wrap || !del || !ghost) return;
      const a = wrap.getBoundingClientRect();
      const b = del.getBoundingClientRect();
      const k = parseFloat(getComputedStyle(del).fontSize) / parseFloat(getComputedStyle(ghost).fontSize);
      ghost.style.setProperty("--throw-x", `${b.left - a.left}px`);
      ghost.style.setProperty("--throw-y", `${b.top - a.top}px`);
      ghost.style.setProperty("--throw-k", String(Number.isFinite(k) ? k : 0.4));
    };

    const timers = PRICE_ANCHOR_TIMELINE.filter((st) => st.phase !== "intro").map((st) =>
      window.setTimeout(() => {
        if (st.phase === "count") {
          count = animate(COMPARISON_RETAINER_USD, TARGET, {
            duration: PRICE_ANCHOR_MS.count / 1000,
            ease: [...EASE_OUT_STRONG],
            onUpdate: (v) => counterRef.current?.setAttribute("data-text", formatCount(v, TARGET)),
            onComplete: () => counterRef.current?.setAttribute("data-text", formatCount(TARGET, TARGET)),
          });
        }
        if (st.phase === "split") measureThrow();
        setPhase(st.phase);
      }, st.at),
    );
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      count?.stop();
    };
  }, [playing]);

  const p = PRICE_ANCHOR;
  return (
    <div ref={ref} className={`${s.anchor} ${s[size]} ${className}`} data-phase={phase}>
      <div className={s.compare}>
        <span className={s.compareLabel}>{p.compareLabel}</span>{" "}
        <del ref={delRef} className={s.struck}>
          <span className={s.struckText}>{p.compare}</span>
          <span className={s.strike} aria-hidden="true" />
        </del>
        <span className={s.srOnly}>. </span>
      </div>
      <div className={s.ours}>
        <span className={s.oursLabel}>{p.label}</span>{" "}
        <span className={s.priceRow}>
          <span ref={wrapRef} className={s.figureWrap}>
            <span className={s.figure}>{p.price}</span>
            <span ref={counterRef} className={s.counter} data-text={formatCount(COMPARISON_RETAINER_USD, TARGET)} aria-hidden="true" />
            <span ref={ghostRef} className={s.ghost} data-text={p.compare} aria-hidden="true">
              <span className={s.ghostStrike} />
            </span>
          </span>{" "}
          <span className={s.unit}>{p.unit}</span>
        </span>
        <span className={s.srOnly}>.</span>
      </div>
      {showCalls && <p className={s.calls}>{p.calls}</p>}
    </div>
  );
}
