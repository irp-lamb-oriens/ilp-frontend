"use client";

/**
 * Scroll story primitives for the homepage (and any marketing page).
 *
 * Three copy levels, staged the same way everywhere:
 *
 *   eyebrow  tertiary label (mono, tracked, navy) after a short accent rule
 *            that draws in with scaleX. <Eyebrow>
 *   title    secondary heading: rises 24px, fades in, scale 0.98 to 1.
 *            <StageItem level="title">
 *   body     supporting line: muted, brightens phrase by phrase as it is
 *            revealed, about 60ch wide. <RevealText>, with one optional key
 *            phrase underlined in the accent (<Mark>).
 *
 * Two drivers:
 *
 *   Staged   <Stage> plays once when it enters the viewport and staggers the
 *            levels inside it (eyebrow, then title, then body, then visual).
 *            Used by every section that is not pinned.
 *   Scrubbed `scrub={{ progress, window }}` ties a primitive to a pinned
 *            track's progress (useSectionProgress), for the pinned stories.
 *            <Beat> wraps one step of a story and lifts it out on exit;
 *            beatParts() in story.ts gives each level its window.
 *
 * Phones and reduced motion: <Stage> fades its content in once, with no
 * movement. All text is in the DOM from the first render; motion changes only
 * opacity and transform, so screen readers read plain text and nothing moves
 * the layout. Lenis drives the native scroll position, so framer-motion's
 * useScroll sees it without a separate Lenis callback.
 */

import { createContext, useContext, useEffect, useState, type ReactNode, type RefObject } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue, type Variants } from "framer-motion";
import { EASE_OUT_STRONG } from "@/components/ui/loadingTiming";
import { cx } from "@/components/ui/cx";
import { splitMark, splitPhrases, splitWindow, type BeatRange, type Window } from "./story";
import s from "./Story.module.scss";

/* ── Layout and progress ─────────────────────────────────────── */

/** Wide screens with motion allowed: pinned stories. Keep in step with $story-pinned in Story.module.scss. */
export const PINNED_QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
/** Tablets with motion allowed: staged blocks, no pin. */
export const STAGED_QUERY = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";

export type StoryLayout = "pinned" | "staged" | "stacked";

/**
 * Which way a story plays here. Starts "stacked" so the server render and
 * no-JS visitors get readable blocks; the CSS media queries already lay the
 * track out for the real width, so switching after mount moves nothing.
 */
export function useStoryLayout(): StoryLayout {
  const [layout, setLayout] = useState<StoryLayout>("stacked");
  useEffect(() => {
    const pinned = window.matchMedia(PINNED_QUERY);
    const staged = window.matchMedia(STAGED_QUERY);
    const update = () => setLayout(pinned.matches ? "pinned" : staged.matches ? "staged" : "stacked");
    update();
    pinned.addEventListener("change", update);
    staged.addEventListener("change", update);
    return () => {
      pinned.removeEventListener("change", update);
      staged.removeEventListener("change", update);
    };
  }, []);
  return layout;
}

/**
 * Progress 0..1 through a pinned track: 0 when the track's top reaches
 * `startAt` of the viewport height (0 = top), 1 when its bottom reaches the
 * viewport bottom. One scroll subscription per track (framer-motion shares
 * the window listener); no layout reads in the handler.
 */
export function useSectionProgress(ref: RefObject<HTMLElement | null>, startAt = 0): MotionValue<number> {
  const { scrollYProgress } = useScroll({
    target: ref as RefObject<HTMLElement>,
    offset: [[0, startAt] as [number, number], [1, 1] as [number, number]],
  });
  return scrollYProgress;
}

/* ── Variants ────────────────────────────────────────────────── */

export type Level = "eyebrow" | "title" | "body" | "visual";
type Tone = "rise" | "fade";

const ease = [...EASE_OUT_STRONG] as [number, number, number, number];

const RISE: Record<Level, Variants> = {
  eyebrow: { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: { duration: 0.5, ease } } },
  title: { hidden: { opacity: 0, y: 24, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease } } },
  body: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } },
  visual: { hidden: { opacity: 0, y: 24, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.9, ease } } },
};

const FADE: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.6, ease } } };
const RULE: Variants = { hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.5, ease } } };
const UNDERLINE: Variants = { hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.6, ease, delay: 0.35 } } };
const STILL: Variants = { hidden: {}, show: {} };

const ToneContext = createContext<Tone>("rise");

/** Movement offsets per level for scrubbed items (same as the staged ones). */
const SHIFT: Record<Level, { x?: number; y?: number; scale?: number }> = {
  eyebrow: { x: -8 },
  title: { y: 24, scale: 0.98 },
  body: { y: 12 },
  visual: { y: 24, scale: 0.98 },
};

/* ── Staged (plays on enter) ─────────────────────────────────── */

type BlockTag = "div" | "section" | "article" | "header" | "li" | "ul" | "ol";
type ItemTag = "div" | "p" | "h2" | "h3" | "li" | "span";

/**
 * Plays its children once when it enters the viewport, one level after the
 * other. Phones (no hover, narrow) keep the stagger; reduced motion and
 * `tone="fade"` fade everything in with no movement.
 */
export function Stage({
  as = "div",
  children,
  className,
  id,
  immediate = false,
  tone,
  amount = 0.3,
  stagger = 0.12,
  delay = 0,
}: {
  as?: BlockTag;
  children: ReactNode;
  className?: string;
  id?: string;
  /** Render in the end state at once (inside pinned or sticky stages). */
  immediate?: boolean;
  tone?: Tone;
  /** Share of the block in view before it plays. */
  amount?: number;
  stagger?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const t: Tone = reduce ? "fade" : (tone ?? "rise");
  const Comp = motion[as];
  return (
    <ToneContext.Provider value={t}>
      <Comp
        id={id}
        className={className}
        initial={immediate ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: t === "fade" ? 0.04 : stagger, delayChildren: delay } },
        }}
      >
        {children}
      </Comp>
    </ToneContext.Provider>
  );
}

/** One level inside a <Stage>: enters with that level's motion. */
export function StageItem({
  level = "body",
  as = "div",
  className,
  id,
  children,
}: {
  level?: Level;
  as?: ItemTag;
  className?: string;
  id?: string;
  children: ReactNode;
}) {
  const tone = useContext(ToneContext);
  const Comp = motion[as];
  return (
    <Comp id={id} className={className} variants={tone === "fade" ? FADE : RISE[level]}>
      {children}
    </Comp>
  );
}

/* ── Scrubbed (follows a pinned track) ───────────────────────── */

export interface Scrub {
  progress: MotionValue<number>;
  window: Window;
}

/** One level that enters over `window` of the track's progress. */
export function ScrubItem({
  progress,
  window: [from, to],
  level = "body",
  as = "div",
  className,
  id,
  children,
}: Scrub & { level?: Level; as?: ItemTag; className?: string; id?: string; children: ReactNode }) {
  const shift = SHIFT[level];
  const opacity = useTransform(progress, [from, to], [0, 1]);
  const x = useTransform(progress, [from, to], [shift.x ?? 0, 0]);
  const y = useTransform(progress, [from, to], [shift.y ?? 0, 0]);
  const scale = useTransform(progress, [from, to], [shift.scale ?? 1, 1]);
  const Comp = motion[as];
  return (
    <Comp id={id} className={className} style={{ opacity, x, y, scale }}>
      {children}
    </Comp>
  );
}

/**
 * One step of a pinned story. Its children enter on their own windows; the
 * beat itself lifts out (fade, rise 32px, scale 0.98) over c..d. The last beat
 * (c = d) never exits.
 */
export function Beat({
  progress,
  range,
  id,
  className,
  labelledBy,
  children,
}: {
  progress: MotionValue<number>;
  range: BeatRange;
  id?: string;
  className?: string;
  labelledBy?: string;
  children: ReactNode;
}) {
  const [, , c, d] = range;
  const last = c >= d;
  const input = last ? [0, 1] : [c, d];
  const opacity = useTransform(progress, input, last ? [1, 1] : [1, 0]);
  const y = useTransform(progress, input, last ? [0, 0] : [0, -32]);
  const scale = useTransform(progress, input, last ? [1, 1] : [1, 0.98]);
  return (
    <motion.article id={id} className={className} aria-labelledby={labelledBy} style={{ opacity, y, scale }}>
      {children}
    </motion.article>
  );
}

/* ── Eyebrow ─────────────────────────────────────────────────── */

/**
 * Tertiary label: a short accent rule draws in (scaleX), then the label fades
 * in beside it. Staged inside a <Stage>, or scrubbed with `scrub` (the rule on
 * the first part of the window, the label on the rest).
 */
export function Eyebrow({
  children,
  className,
  as = "p",
  scrub,
}: {
  children: ReactNode;
  className?: string;
  as?: "p" | "span" | "div";
  scrub?: Scrub;
}) {
  if (scrub) return <EyebrowScrub scrub={scrub} className={className} as={as}>{children}</EyebrowScrub>;
  return <EyebrowStaged className={className} as={as}>{children}</EyebrowStaged>;
}

function EyebrowStaged({ children, className, as }: { children: ReactNode; className?: string; as: "p" | "span" | "div" }) {
  const tone = useContext(ToneContext);
  const Comp = motion[as];
  return (
    <Comp
      className={cx(s.eyebrow, className)}
      variants={{ hidden: {}, show: { transition: { staggerChildren: tone === "fade" ? 0 : 0.14 } } }}
    >
      <motion.span className={s.rule} aria-hidden="true" variants={tone === "fade" ? STILL : RULE} />
      <motion.span className={s.eyebrowLabel} variants={tone === "fade" ? FADE : RISE.eyebrow}>
        {children}
      </motion.span>
    </Comp>
  );
}

function EyebrowScrub({
  children,
  className,
  as,
  scrub: { progress, window: [from, to] },
}: {
  children: ReactNode;
  className?: string;
  as: "p" | "span" | "div";
  scrub: Scrub;
}) {
  const mid = from + (to - from) * 0.45;
  const scaleX = useTransform(progress, [from, mid], [0, 1]);
  const opacity = useTransform(progress, [from + (to - from) * 0.25, to], [0, 1]);
  const x = useTransform(progress, [from + (to - from) * 0.25, to], [-8, 0]);
  const Comp = as;
  return (
    <Comp className={cx(s.eyebrow, className)}>
      <motion.span className={s.rule} aria-hidden="true" style={{ scaleX }} />
      <motion.span className={s.eyebrowLabel} style={{ opacity, x }}>
        {children}
      </motion.span>
    </Comp>
  );
}

/* ── Body text and the key phrase ────────────────────────────── */

/**
 * Body copy that brightens phrase by phrase (or word by word). Every phrase is
 * plain text in the DOM, so assistive tech reads one normal sentence. `mark`
 * underlines one key phrase in the accent once it is revealed.
 */
export function RevealText({
  text,
  as = "p",
  className,
  mark,
  by = "phrase",
  floor = 0.22,
  scrub,
}: {
  text: string;
  as?: "p" | "span" | "div";
  className?: string;
  mark?: string;
  by?: "phrase" | "word";
  /** Opacity of a phrase before it is reached. */
  floor?: number;
  scrub?: Scrub;
}) {
  const parts = by === "word" ? text.split(/\s+/).filter(Boolean) : splitPhrases(text);
  if (scrub) {
    const windows = splitWindow(scrub.window, parts.length);
    const Comp = as;
    return (
      <Comp className={cx(s.body, className)}>
        {parts.map((part, i) => (
          <ScrubPhrase
            key={`${i}-${part}`}
            progress={scrub.progress}
            window={windows[i]}
            floor={floor}
            mark={mark}
            text={part}
            last={i === parts.length - 1}
          />
        ))}
      </Comp>
    );
  }
  return (
    <StagedText as={as} className={className} floor={floor} parts={parts} mark={mark} />
  );
}

function StagedText({
  as,
  className,
  floor,
  parts,
  mark,
}: {
  as: "p" | "span" | "div";
  className?: string;
  floor: number;
  parts: string[];
  mark?: string;
}) {
  const tone = useContext(ToneContext);
  const Comp = motion[as];
  const fade = tone === "fade";
  const box: Variants = fade
    ? FADE
    : {
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease, staggerChildren: 0.09, delayChildren: 0.1 } },
      };
  const phrase: Variants = fade
    ? STILL
    : { hidden: { opacity: floor }, show: { opacity: 1, transition: { duration: 0.5, ease } } };
  return (
    <Comp className={cx(s.body, className)} variants={box}>
      {parts.map((part, i) => (
        <motion.span key={`${i}-${part}`} variants={phrase}>
          <WithMark text={part} mark={mark} />
          {i < parts.length - 1 ? " " : null}
        </motion.span>
      ))}
    </Comp>
  );
}

function ScrubPhrase({
  progress,
  window: [from, to],
  floor,
  mark,
  text,
  last,
}: Scrub & { floor: number; mark?: string; text: string; last: boolean }) {
  const opacity = useTransform(progress, [from, to], [floor, 1]);
  return (
    <motion.span style={{ opacity }}>
      <WithMark text={text} mark={mark} scrub={{ progress, window: [to, to + (to - from)] }} />
      {last ? null : " "}
    </motion.span>
  );
}

function WithMark({ text, mark, scrub }: { text: string; mark?: string; scrub?: Scrub }) {
  const split = splitMark(text, mark);
  if (!split) return <>{text}</>;
  const [before, hit, after] = split;
  return (
    <>
      {before}
      <Mark scrub={scrub}>{hit}</Mark>
      {after}
    </>
  );
}

/**
 * The one key phrase of a section: navy, semibold, with an accent underline
 * that draws in (scaleX) after the phrase is revealed. Phones get a static
 * underline (the phrase may wrap there).
 */
export function Mark({ children, scrub }: { children: ReactNode; scrub?: Scrub }) {
  return (
    <span className={s.mark}>
      {children}
      {scrub ? <ScrubUnderline scrub={scrub} /> : <StagedUnderline />}
    </span>
  );
}

function StagedUnderline() {
  const tone = useContext(ToneContext);
  return <motion.span className={s.markLine} aria-hidden="true" variants={tone === "fade" ? STILL : UNDERLINE} />;
}

function ScrubUnderline({ scrub: { progress, window: [from, to] } }: { scrub: Scrub }) {
  const scaleX = useTransform(progress, [from, to], [0, 1]);
  return <motion.span className={s.markLine} aria-hidden="true" style={{ scaleX }} />;
}
