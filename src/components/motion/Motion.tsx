"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import s from "./Motion.module.scss";

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const;

type Tag = "h1" | "h2" | "h3" | "p";

/**
 * Word-by-word mask reveal: each word rises out of an overflow-hidden slot
 * with a staggered expo-out curve the first time the heading enters view.
 */
export function RevealTitle({
  text,
  as = "h2",
  className,
  delay = 0,
}: {
  text: string;
  as?: Tag;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as];
  const words = text.split(" ");

  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.6 }}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className={s.slot} aria-hidden="true">
          <motion.span
            className={s.word}
            variants={{
              hidden: reduce ? { y: "0%" } : { y: "110%" },
              show: { y: "0%" },
            }}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: delay + i * 0.06 }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 ? "\u00a0" : null}
        </span>
      ))}
    </Comp>
  );
}

/** Fade + rise on enter. `from` picks the entry direction for Gutenberg rhythm. */
export function Reveal({
  children,
  className,
  delay = 0,
  from = "bottom",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  from?: "bottom" | "left" | "right";
}) {
  const reduce = useReducedMotion();
  const offset =
    from === "left" ? { x: -48 } : from === "right" ? { x: 48 } : { y: 48 };

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.9, ease: EASE_OUT_QUART, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Sticky morph stage: the section is taller than the viewport, its inner
 * stage pins (position: sticky) and children receive a 0..1 progress value so
 * each element can morph in, hold, and morph out on its own curve.
 */
export function MorphStage({
  heightVh = 260,
  mobileHeightVh,
  className,
  children,
  spring = false,
}: {
  heightVh?: number;
  mobileHeightVh?: number;
  className?: string;
  children: (progress: MotionValue<number>, reduce: boolean) => ReactNode;
  /** Ease-out the snap: route the scrub progress through a spring so items
   * settle on their curve instead of tracking scroll 1:1. */
  spring?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;
  const [mobile, setMobile] = useState(false);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const eased = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 26,
    mass: 0.6,
  });

  const height = mobile && mobileHeightVh ? mobileHeightVh : heightVh;

  return (
    <div
      ref={ref}
      className={s.morphTrack}
      style={{ height: reduce ? "auto" : `${height}vh` }}
    >
      <div className={`${s.morphStage} ${className ?? ""}`}>
        {children(spring ? eased : scrollYProgress, reduce)}
      </div>
    </div>
  );
}

/** Element that morphs in over [a,b], holds, then morphs out over [c,d]. */
export function MorphItem({
  progress,
  range,
  reduce,
  className,
  children,
  axis = "y",
}: {
  progress: MotionValue<number>;
  range: [number, number, number, number];
  reduce: boolean;
  className?: string;
  children: ReactNode;
  axis?: "x" | "y";
}) {
  const [a, b, c, d] = range;
  const opacity = useTransform(progress, [a, b, c, d], [0, 1, 1, 0]);
  const shift = useTransform(progress, [a, b, c, d], [80, 0, 0, -80]);
  const scale = useTransform(progress, [a, b, c, d], [0.92, 1, 1, 0.96]);
  const blur = useTransform(progress, [a, b, c, d], [8, 0, 0, 6]);
  const filter = useTransform(blur, (v) => `blur(${v}px)`);

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      style={{
        opacity,
        scale,
        filter,
        ...(axis === "x" ? { x: shift } : { y: shift }),
      }}
    >
      {children}
    </motion.div>
  );
}