"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion, animate } from "framer-motion";
import { COUNT_UP_S, EASE_OUT_STRONG } from "@/components/ui/loadingTiming";

interface CountUpProps {
  value: number;
  /**
   * Format the animated number for display. Defaults to a plain integer.
   * Receives the interpolated value each frame. Pass a stable function
   * (module level or memoised), not an inline arrow.
   */
  formatter?: (v: number) => string;
  /** Seconds. Defaults to COUNT_UP_S (0.6). */
  duration?: number;
  className?: string;
}

const plain = (v: number) => String(Math.round(v));

/**
 * Counts from zero to `value` the first time it enters the viewport, with the
 * rules.md strong ease-out. Plays once: later changes of `value` (a refetch)
 * snap to the new figure. Reduced motion: no count, the value just shows.
 * The final value is in the markup from the first render (no-JS, SSR).
 */
export default function CountUp({ value, formatter = plain, duration = COUNT_UP_S, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const played = useRef(false);
  const [display, setDisplay] = useState(() => formatter(value));

  useEffect(() => {
    if (!inView) return;
    if (reduce || played.current) {
      setDisplay(formatter(value));
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [...EASE_OUT_STRONG],
      onUpdate: (v) => setDisplay(formatter(v)),
      onComplete: () => {
        played.current = true;
      },
    });
    return () => controls.stop();
  }, [inView, value, reduce, duration, formatter]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
