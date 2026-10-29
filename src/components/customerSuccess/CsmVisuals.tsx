"use client";

import { useState } from "react";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion";
import { MockFrame } from "@/components/landing/HeroStory";
import MockScene from "@/components/tutorial/mock/MockScene";
import { FitFrame } from "@/components/lawyers/LawyerVisuals";
import { easeEnter, revealAt, type Window } from "@/components/motion/storyMath";
import type { StoryLayout } from "@/components/motion/Story";
import { cx } from "@/components/ui/cx";
import { CSM_SCREENS, csmScreenRoot, screenOverrides, screenStateAt } from "./csmScreens";
import { GAP_ROWS, GAP_TAG, GAP_TOTAL_LABEL, LOOP_CARD, MEMBER_ROWS, VISUAL_COUNTRIES } from "./visualData";
import { CSM_SCREEN_SIZES, CSM_WHY_SIZES } from "./csmFit";
import ls from "@/components/lawyers/LawyersStory.module.scss";
import s from "./csmLanding.module.scss";

/**
 * The pictures beside each beat on /customer-success, on the same frame and
 * classes as /attorneys (LawyerVisuals.tsx). Each takes a timeline t (0..1)
 * from BeatStory: scrubbed by the scroll when pinned, played once on
 * tablets, at 1 (the end state) on phones and with reduced motion. All are
 * aria-hidden; the beat's caption says what they show. Motion is opacity and
 * transform only.
 */

/** 0..1 through window w of the timeline, eased out. */
const useIn = (t: MotionValue<number>, w: Window) => useTransform(t, (v) => easeEnter(revealAt(v, w)));

/** The "Why" pictures: fitted to the shared box when pinned, fluid otherwise. */
export function CsmWhyVisual({ index, t, layout }: { index: number; t: MotionValue<number>; layout: StoryLayout }) {
  const V = [MembersVisual, GapsVisual, LoopVisual][index];
  if (layout !== "pinned") return <V t={t} />;
  return (
    <FitFrame natural={CSM_WHY_SIZES[index]} kind="why">
      <V t={t} />
    </FitFrame>
  );
}

/* ── Why 1: the members and their calls ──────────────────────── */

const memberWindow = (i: number): Window => [0.3 + i * 0.16, 0.46 + i * 0.16];

function MembersVisual({ t }: { t: MotionValue<number> }) {
  return (
    <div className={ls.vis} aria-hidden="true">
      <ul className={ls.countryRow}>
        {VISUAL_COUNTRIES.map((c, i) => (
          <CountryChip key={c} t={t} index={i} label={c} />
        ))}
      </ul>
      <ul className={s.members}>
        {MEMBER_ROWS.map((m, i) => (
          <MemberRow key={m.who} t={t} index={i} {...m} />
        ))}
      </ul>
    </div>
  );
}

function CountryChip({ t, index, label }: { t: MotionValue<number>; index: number; label: string }) {
  const shown = useIn(t, [index * 0.04, index * 0.04 + 0.12]);
  const y = useTransform(shown, (k) => (1 - k) * 8);
  const m = MEMBER_ROWS.findIndex((r) => r.country === label);
  const lit = useIn(t, m >= 0 ? memberWindow(m) : [2, 3]);
  return (
    <motion.li className={ls.country} style={{ opacity: shown, y }}>
      <motion.span className={ls.countryFill} style={{ opacity: lit }} />
      <span className={ls.countryLabel}>{label}</span>
    </motion.li>
  );
}

function MemberRow({ t, index, who, country, calls }: { t: MotionValue<number>; index: number; who: string; country: string; calls: string }) {
  const k = useIn(t, memberWindow(index));
  const x = useTransform(k, (v) => (1 - v) * (index % 2 ? 24 : -24));
  return (
    <motion.li className={s.memberRow} style={{ opacity: k, x }}>
      <span className={s.memberMain}>
        <span className={s.memberName}>{who}</span>
        <span className={ls.qMeta}>{country}</span>
      </span>
      <span className={s.callsPill}>{calls}</span>
    </motion.li>
  );
}

/* ── Why 2: a month when nobody owns the follow-up ───────────── */

const gapWindow = (i: number): Window => [0.08 + i * 0.18, 0.26 + i * 0.18];

function GapsVisual({ t }: { t: MotionValue<number> }) {
  const count = useTransform(t, (v) => GAP_ROWS.filter((_, i) => revealAt(v, gapWindow(i)) >= 1).length);
  const [n, setN] = useState(() => count.get());
  useMotionValueEvent(count, "change", (v) => setN((prev) => (prev === v ? prev : v)));
  const totalIn = useIn(t, [0.05, 0.2]);
  return (
    <div className={ls.vis} aria-hidden="true">
      <ol className={ls.ledger}>
        {GAP_ROWS.map((r, i) => (
          <GapRow key={r} t={t} index={i} label={r} />
        ))}
      </ol>
      <motion.div className={ls.ledgerTotal} style={{ opacity: totalIn }}>
        <span className={ls.ledgerTotalLabel}>{GAP_TOTAL_LABEL}</span>
        <span className={ls.ledgerTotalValue}>{n}</span>
      </motion.div>
    </div>
  );
}

function GapRow({ t, index, label }: { t: MotionValue<number>; index: number; label: string }) {
  const w = gapWindow(index);
  const k = useIn(t, w);
  const y = useTransform(k, (v) => (1 - v) * 12);
  const tag = useIn(t, [w[1], w[1] + 0.06]);
  return (
    <motion.li className={cx(ls.ledgerRow, s.gapRow)} style={{ opacity: k, y }}>
      <span className={ls.ledgerTask}>{label}</span>
      <motion.span className={ls.ledgerTag} style={{ opacity: tag }}>
        {GAP_TAG}
      </motion.span>
    </motion.li>
  );
}

/* ── Why 3: a member's first month with a CSM ────────────────── */

const stepWindow = (i: number): Window => [0.2 + i * 0.11, 0.3 + i * 0.11];

function LoopVisual({ t }: { t: MotionValue<number> }) {
  const c = LOOP_CARD;
  return (
    <div className={cx(ls.vis, ls.member)} aria-hidden="true">
      <div className={ls.memberHead}>
        <span className={ls.avatar}>{c.initials}</span>
        <span className={ls.memberWho}>
          <span className={ls.memberName}>{c.name}</span>
          <span className={ls.memberMeta}>{c.meta}</span>
        </span>
        <span className={ls.memberPill}>{c.csm}</span>
      </div>
      <ol className={s.loop}>
        {c.steps.map((st, i) => (
          <LoopStep key={st.label} t={t} index={i} label={st.label} detail={st.detail} />
        ))}
      </ol>
    </div>
  );
}

function LoopStep({ t, index, label, detail }: { t: MotionValue<number>; index: number; label: string; detail: string }) {
  const w = stepWindow(index);
  const k = useIn(t, [w[0] - 0.12, w[0]]);
  const done = useIn(t, w);
  const scale = useTransform(done, (v) => 0.6 + v * 0.4);
  const opacity = useTransform(k, (v) => 0.35 + v * 0.65);
  return (
    <motion.li className={s.loopStep} style={{ opacity }}>
      <span className={s.check}>
        <motion.svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: done, scale }}>
          <path d="M3 8.5l3.2 3L13 4.5" />
        </motion.svg>
      </span>
      <span className={s.loopLabel}>{label}</span>
      <motion.span className={s.loopDetail} style={{ opacity: done }}>
        {detail}
      </motion.span>
    </motion.li>
  );
}

/* ── How: an example CSM portal screen per step ───────────────── */

/**
 * Step i's example screen. Its timeline applies the screen's state changes
 * in order; the frame re-renders only when a state is crossed. Wide screens
 * draw it at its natural size, fitted to the shared box (csmFit.ts); phones
 * and reduced motion get the compact end state.
 */
export function CsmStepScreen({ index, t, layout }: { index: number; t: MotionValue<number>; layout: StoryLayout }) {
  const screen = CSM_SCREENS[index];
  const compact = layout === "stacked";
  const [n, setN] = useState(() => screenStateAt(screen, t.get()));
  useMotionValueEvent(t, "change", (v) => {
    const next = screenStateAt(screen, v);
    setN((prev) => (prev === next ? prev : next));
  });
  const root = csmScreenRoot(screen, compact);
  const overrides = screenOverrides(screen, n);
  if (compact) return <MockFrame root={root} framed={false} compact overrides={overrides} />;
  return (
    <FitFrame natural={CSM_SCREEN_SIZES[index]} kind="screen">
      <div className={ls.screenPage}>
        <MockScene root={root} overrides={overrides} />
      </div>
    </FitFrame>
  );
}
