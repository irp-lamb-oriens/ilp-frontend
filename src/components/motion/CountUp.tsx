"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion, animate } from "framer-motion";

interface CountUpProps {
  value: number;
  /**
   * Format the animated number for display. Defaults to locale string with no
   * grouping (plain integer). Receives the interpolated value each frame.
   */
  formatter?: (v: number) => string;
  duration?: number;
  className?: string;
}

/**
 * Animates a number from zero to `value` when it first enters the viewport.
 * Uses framer-motion's `animate` for a transform-free, main-thread-friendly
 * tween. Respects prefers-reduced-motion by snapping straight to the value.
 */
export default function CountUp({
  value,
  formatter,
  duration = 1.2,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(() =>
    formatter ? formatter(value) : String(Math.round(value)),
  );

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(formatter ? formatter(value) : String(Math.round(value)));
      return;
    }

    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        setDisplay(
          formatter ? formatter(v) : String(Math.round(v)),
        );
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