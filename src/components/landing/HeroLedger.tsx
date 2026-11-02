"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion";
import { cx } from "@/components/ui/cx";
import s from "./HeroLedger.module.scss";

/**
 * The hero ledger: the one picture every landing hero shares. A short dated
 * list with a "today" rule across it, which is what ILP gives each role:
 * a member sees the dates that may apply, a lawyer sees today's calls, a
 * customer success manager sees today's tasks. The same rule comes back in
 * the homepage close, so the page opens and ends on the same object.
 *
 * Example data only (aria-hidden, inert, captioned "Example"). Motion is
 * opacity and transform: the card rises, rows stage in one by one, the today
 * rule slides in, and on wide screens the card drifts up a little faster
 * than the text as the hero scrolls away. Reduced motion shows the end state.
 */

export type LedgerTone = "neutral" | "accent" | "success" | "warning" | "danger";

export interface LedgerRow {
  /** Date or time, in the mono column. Computed dates may differ server/client. */
  when: string;
  title: string;
  meta?: string;
  status?: { label: string; tone?: LedgerTone };
  /** "past" rows sit above the today rule and are quieter; "next" is the one to act on. */
  state?: "past" | "next" | "later";
}

export interface LedgerData {
  /** Mono label at the top left, e.g. "Your dates". */
  label: string;
  /** Context at the top right, e.g. "Costa Rica". */
  context: string;
  rows: LedgerRow[];
  /** Index in `rows` the today rule sits before. */
  todayAt: number;
  /** Text on the today rule ("Today", "Now"). */
  todayLabel: string;
  /** Small line under the list. */
  note: string;
  /** Caption under the card: says it is an example and what it shows. */
  caption: string;
}

const ease = [0.23, 1, 0.32, 1] as [number, number, number, number];

const CARD: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease, delay: 0.25, staggerChildren: 0.09, delayChildren: 0.55 } },
};
const ROW: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};
const RULE: Variants = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease } },
};
const STILL: Variants = { hidden: {}, show: {} };

export default function HeroLedger({ data, className }: { data: LedgerData; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  // Drifts up to 40px faster than the page while the hero leaves (depth, not spectacle).
  const drift = useTransform(scrollYProgress, [0.5, 1], [0, -40]);

  const rule = (
    <motion.li key="today" className={s.today} variants={reduce ? STILL : RULE} aria-hidden="true">
      <span className={s.todayLabel}>{data.todayLabel}</span>
      <span className={s.todayLine} />
    </motion.li>
  );

  return (
    <motion.div ref={ref} className={cx(s.wrap, className)} style={reduce ? undefined : { y: drift }}>
      <motion.figure
        className={s.card}
        aria-hidden="true"
        inert
        initial={reduce ? false : "hidden"}
        animate="show"
        variants={reduce ? STILL : CARD}
      >
        <div className={s.head}>
          <span className={s.label}>{data.label}</span>
          <span className={s.context}>{data.context}</span>
        </div>
        <ol className={s.rows}>
          {data.rows.flatMap((r, i) => {
            const row = (
              <motion.li key={`${r.title}-${i}`} className={cx(s.row, s[r.state ?? "later"])} variants={reduce ? STILL : ROW}>
                <span className={s.when} suppressHydrationWarning>
                  {r.when}
                </span>
                <span className={s.what}>
                  <span className={s.title}>{r.title}</span>
                  {r.meta && <span className={s.meta}>{r.meta}</span>}
                </span>
                {r.status && <span className={cx(s.pill, s[`tone_${r.status.tone ?? "neutral"}`])}>{r.status.label}</span>}
              </motion.li>
            );
            return i === data.todayAt ? [rule, row] : [row];
          })}
          {data.todayAt >= data.rows.length ? rule : null}
        </ol>
        <motion.p className={s.note} variants={reduce ? STILL : ROW}>
          {data.note}
        </motion.p>
      </motion.figure>
      <p className={s.caption}>{data.caption}</p>
    </motion.div>
  );
}
