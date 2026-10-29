"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion";
import { MockFrame } from "@/components/landing/HeroStory";
import MockScene from "@/components/tutorial/mock/MockScene";
import { easeEnter, revealAt, type Window } from "@/components/motion/storyMath";
import type { StoryLayout } from "@/components/motion/Story";
import { cx } from "@/components/ui/cx";
import { LAWYER_SCREENS, lawyerScreenRoot, screenOverrides, screenStateAt } from "./lawyerScreens";
import { HOURS_ROWS, MEMBER_CARD, MEMBER_QUESTIONS, VISUAL_COUNTRIES, minutesLabel } from "./visualData";
import { SCREEN_SIZES, WHY_SIZES, type Size } from "./visualFit";
import s from "./LawyersStory.module.scss";

/**
 * The pictures beside each beat on /attorneys. Each takes a timeline t (0..1)
 * from BeatStory: scrubbed by the scroll when pinned, played once on tablets,
 * at 1 (the end state) on phones and with reduced motion. All are
 * aria-hidden; the beat's caption says what they show. Motion is opacity and
 * transform only.
 */

/** 0..1 through window w of the timeline, eased out. */
const useIn = (t: MotionValue<number>, w: Window) => useTransform(t, (v) => easeEnter(revealAt(v, w)));

/**
 * A picture laid out at its natural size and scaled to fit its box
 * (visualFit.ts): k = min(boxW / naturalW, boxH / contentH), where contentH
 * is the natural height, or the measured height if the content came out
 * taller. The box is sized in CSS, so every picture of a story gets the same
 * one; nothing inside can spill over the text beside it. Shared with the
 * customer success landing (customerSuccess/CsmVisuals.tsx).
 */
export function FitFrame({ natural, kind, children }: { natural: Size; kind: "screen" | "why"; children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = boxRef.current;
    const stage = stageRef.current;
    if (!box || !stage) return;
    const fit = () => {
      const contentH = Math.max(natural.h, stage.offsetHeight);
      const k = Math.min(box.clientWidth / natural.w, box.clientHeight / contentH);
      if (k > 0) stage.style.setProperty("--fit-k", String(k));
    };
    fit();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [natural.w, natural.h]);
  return (
    <div
      ref={boxRef}
      className={cx(s.fit, kind === "screen" ? s.fitScreen : s.fitWhy)}
      style={{ "--nat-w": natural.w, "--nat-h": natural.h } as CSSProperties}
      aria-hidden="true"
      inert
    >
      <div ref={stageRef} className={s.fitStage} style={{ width: natural.w, minHeight: natural.h }}>
        {children}
      </div>
    </div>
  );
}

/** The "Why" pictures: fitted to the shared box when pinned, fluid otherwise. */
export function WhyVisual({ index, t, layout }: { index: number; t: MotionValue<number>; layout: StoryLayout }) {
  const V = [MembersVisual, HoursVisual, MemberVisual][index];
  if (layout !== "pinned") return <V t={t} />;
  return (
    <FitFrame natural={WHY_SIZES[index]} kind="why">
      <V t={t} />
    </FitFrame>
  );
}

/* ── Why 1: the members and their questions ──────────────────── */

export function MembersVisual({ t }: { t: MotionValue<number> }) {
  return (
    <div className={s.vis} aria-hidden="true">
      <ul className={s.countryRow}>
        {VISUAL_COUNTRIES.map((c, i) => (
          <CountryChip key={c} t={t} index={i} label={c} />
        ))}
      </ul>
      <div className={s.questions}>
        {MEMBER_QUESTIONS.map((q, i) => (
          <QuestionCard key={q.who} t={t} index={i} {...q} />
        ))}
      </div>
    </div>
  );
}

function CountryChip({ t, index, label }: { t: MotionValue<number>; index: number; label: string }) {
  const shown = useIn(t, [index * 0.04, index * 0.04 + 0.12]);
  const y = useTransform(shown, (k) => (1 - k) * 8);
  const q = MEMBER_QUESTIONS.findIndex((m) => m.country === label);
  const lit = useIn(t, q >= 0 ? questionWindow(q) : [2, 3]);
  return (
    <motion.li className={s.country} style={{ opacity: shown, y }}>
      <motion.span className={s.countryFill} style={{ opacity: lit }} />
      <span className={s.countryLabel}>{label}</span>
    </motion.li>
  );
}

const questionWindow = (i: number): Window => [0.3 + i * 0.2, 0.46 + i * 0.2];

function QuestionCard({ t, index, who, country, q }: { t: MotionValue<number>; index: number; who: string; country: string; q: string }) {
  const k = useIn(t, questionWindow(index));
  const x = useTransform(k, (v) => (1 - v) * (index % 2 ? 24 : -24));
  return (
    <motion.div className={cx(s.qCard, index % 2 === 1 && s.qCardIndent)} style={{ opacity: k, x }}>
      <span className={s.qMeta}>
        {who} · {country}
      </span>
      <span className={s.qText}>{q}</span>
    </motion.div>
  );
}

/* ── Why 2: the unpaid hours ─────────────────────────────────── */

export function HoursVisual({ t }: { t: MotionValue<number> }) {
  const total = HOURS_ROWS.reduce((n, r) => n + r.minutes, 0);
  const minutes = useTransform(t, (v) =>
    HOURS_ROWS.reduce((n, r, i) => n + r.minutes * revealAt(v, rowWindow(i)), 0),
  );
  const [label, setLabel] = useState(() => minutesLabel(Math.round(minutes.get())));
  useMotionValueEvent(minutes, "change", (v) => {
    const next = minutesLabel(Math.round(v / 5) * 5);
    setLabel((prev) => (prev === next ? prev : next));
  });
  const totalIn = useIn(t, [0.05, 0.2]);
  return (
    <div className={s.vis} aria-hidden="true">
      <ol className={s.ledger}>
        {HOURS_ROWS.map((r, i) => (
          <HoursRow key={r.task} t={t} index={i} task={r.task} minutes={r.minutes} share={r.minutes / total} />
        ))}
      </ol>
      <motion.div className={s.ledgerTotal} style={{ opacity: totalIn }}>
        <span className={s.ledgerTotalLabel}>Unpaid this week</span>
        <span className={s.ledgerTotalValue}>{label}</span>
      </motion.div>
    </div>
  );
}

const rowWindow = (i: number): Window => [0.08 + i * 0.2, 0.26 + i * 0.2];

function HoursRow({ t, index, task, minutes, share }: { t: MotionValue<number>; index: number; task: string; minutes: number; share: number }) {
  const w = rowWindow(index);
  const k = useIn(t, w);
  const y = useTransform(k, (v) => (1 - v) * 12);
  const bar = useIn(t, [w[0] + 0.04, w[1] + 0.06]);
  const tag = useIn(t, [w[1], w[1] + 0.06]);
  return (
    <motion.li className={s.ledgerRow} style={{ opacity: k, y }}>
      <span className={s.ledgerTask}>{task}</span>
      <span className={s.ledgerTime}>{minutesLabel(minutes)}</span>
      <span className={s.ledgerBar}>
        <motion.span className={s.ledgerFill} style={{ scaleX: bar, width: `${Math.round(share * 100 * 2)}%` }} />
      </span>
      <motion.span className={s.ledgerTag} style={{ opacity: tag }}>
        Not billed
      </motion.span>
    </motion.li>
  );
}

/* ── Why 3: a member with a written question and a follow-up ─── */

export function MemberVisual({ t }: { t: MotionValue<number> }) {
  const q = useIn(t, [0.08, 0.3]);
  const qy = useTransform(q, (v) => (1 - v) * 12);
  const f = useIn(t, [0.5, 0.72]);
  const fy = useTransform(f, (v) => (1 - v) * 12);
  const sent = useIn(t, [0.74, 0.86]);
  const sentScale = useTransform(sent, (v) => 0.95 + v * 0.05);
  const c = MEMBER_CARD;
  return (
    <div className={cx(s.vis, s.member)} aria-hidden="true">
      <div className={s.memberHead}>
        <span className={s.avatar}>{c.initials}</span>
        <span className={s.memberWho}>
          <span className={s.memberName}>{c.name}</span>
          <span className={s.memberMeta}>{c.meta}</span>
        </span>
        <span className={s.memberPill}>{c.calls}</span>
      </div>
      <motion.div className={s.memberBlock} style={{ opacity: q, y: qy }}>
        <span className={s.blockLabel}>{c.questionLabel}</span>
        <span className={s.blockQuote}>{c.question}</span>
      </motion.div>
      <motion.div className={cx(s.memberBlock, s.memberFollow)} style={{ opacity: f, y: fy }}>
        <span className={s.blockLabel}>{c.followLabel}</span>
        <span className={s.blockText}>{c.follow}</span>
        <motion.span className={s.sent} style={{ opacity: sent, scale: sentScale }}>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8.5l3.2 3L13 4.5" />
          </svg>
          {c.sent}
        </motion.span>
      </motion.div>
    </div>
  );
}

/* ── How: an example lawyer-portal screen per step ───────────── */

/**
 * Step i's example screen. Its timeline applies the screen's state changes
 * in order (the licence turning verified, hours being added, the brief being
 * read, the summary confirmed); the frame re-renders only when a state is
 * crossed. Wide screens draw it at its natural size, fitted to the shared
 * box (visualFit.ts); phones and reduced motion get the compact end state.
 */
export function StepScreen({ index, t, layout }: { index: number; t: MotionValue<number>; layout: StoryLayout }) {
  const screen = LAWYER_SCREENS[index];
  const compact = layout === "stacked";
  const [n, setN] = useState(() => screenStateAt(screen, t.get()));
  useMotionValueEvent(t, "change", (v) => {
    const next = screenStateAt(screen, v);
    setN((prev) => (prev === next ? prev : next));
  });
  const root = lawyerScreenRoot(screen, compact);
  const overrides = screenOverrides(screen, n);
  if (compact) return <MockFrame root={root} framed={false} compact overrides={overrides} />;
  return (
    <FitFrame natural={SCREEN_SIZES[index]} kind="screen">
      <div className={s.screenPage}>
        <MockScene root={root} overrides={overrides} />
      </div>
    </FitFrame>
  );
}
