"use client";

/**
 * Scroll story primitives for the homepage (and any marketing page).
 *
 * Three copy levels, staged the same way everywhere:
 *
 *   eyebrow  tertiary label (mono, tracked, navy) after a short accent rule
 *            that draws in with scaleX; the label fades in once the rule is
 *            drawn. <Eyebrow>
 *   title    secondary heading: rises 24px, fades in, scale 0.98 to 1 (the
 *            only level that scales). <StageItem level="title">
 *   body     supporting line, about 60ch. Words appear in reading order from
 *            opacity 0 to 1 with a small rise (0.5em) and stay at 1. <RevealText>,
 *            with one optional key phrase underlined in the accent (<Mark>).
 *
 * Two drivers:
 *
 *   Staged   <Stage> plays once when it enters the viewport and staggers the
 *            levels inside it (eyebrow, then title, then body, then visual).
 *            Used by every section that is not pinned.
 *   Scrubbed `scrub={{ progress, window }}` ties a primitive to a pinned
 *            track's progress (useSectionProgress), for the pinned stories.
 *            <Beat> wraps one step of a story: opacity 0 before its window,
 *            fades to 0 on exit, then visibility hidden and pointer-events
 *            none, so a beat never shows through the next one.
 *            beatParts() in storyMath.ts gives each level its window.
 *
 * Phones and reduced motion: reduced motion gets whole blocks that fade in,
 * no per-word reveal and no movement. Split text keeps the full sentence as
 * visually hidden text and hides the word spans from assistive tech, so
 * screen readers read one normal sentence. Word spans are inline-block from
 * the first render and only change opacity and transform, so nothing moves
 * the layout. Lenis drives the native scroll position, so framer-motion's
 * useScroll sees it without a separate Lenis callback.
 */

import { createContext, useContext, useEffect, useState, type ReactNode, type RefObject } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
  type TargetAndTransition,
  type Variants,
} from "framer-motion";
import { EASE_OUT_STRONG } from "@/components/ui/loadingTiming";
import { cx } from "@/components/ui/cx";
import {
  beatOpacity,
  easeEnter,
  revealAt,
  splitMark,
  splitPhrases,
  splitWindow,
  wordWindows,
  type BeatRange,
  type Window,
} from "./storyMath";
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
  visual: { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.9, ease } } },
};

const FADE: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.6, ease } } };
const RULE: Variants = { hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.35, ease } } };
/** The eyebrow label waits for its rule to finish drawing. */
const EYEBROW_LABEL: Variants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease, delay: 0.3 } },
};
/** One word of a staged body line: 0 to 1, rising half a line. */
const WORD: Variants = {
  hidden: { opacity: 0, y: "0.5em" },
  show: { opacity: 1, y: "0em", transition: { duration: 0.55, ease } },
};
/** Seconds between two words of a staged line (a phrase lands in about 0.2s). */
const WORD_STAGGER = 0.035;
const UNDERLINE: Variants = { hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.6, ease, delay: 0.35 } } };
const STILL: Variants = { hidden: {}, show: {} };

const ToneContext = createContext<Tone>("rise");

/** Movement offsets per level for scrubbed items. Only titles scale. */
const SHIFT: Record<Level, { x?: number; y?: number; scale?: number }> = {
  eyebrow: { x: -8 },
  title: { y: 24, scale: 0.98 },
  body: { y: 12 },
  visual: { y: 24 },
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
  enter,
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
  /** The block itself enters at this level (a card rising) before its children. */
  enter?: Level;
}) {
  const reduce = useReducedMotion();
  const t: Tone = reduce ? "fade" : (tone ?? "rise");
  const Comp = motion[as];
  const self = enter ? (t === "fade" ? FADE : RISE[enter]) : null;
  const selfShow = (self?.show ?? {}) as TargetAndTransition;
  const variants: Variants = {
    hidden: (self?.hidden ?? {}) as TargetAndTransition,
    show: {
      ...selfShow,
      transition: {
        ...(selfShow.transition ?? {}),
        staggerChildren: t === "fade" ? 0.04 : stagger,
        delayChildren: delay + (self && t === "rise" ? 0.15 : 0),
      },
    },
  };
  return (
    <ToneContext.Provider value={t}>
      <Comp
        id={id}
        className={className}
        initial={immediate ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount }}
        variants={variants}
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

/** One level that enters over `window` of the track's progress, eased out. */
export function ScrubItem({
  progress,
  window,
  level = "body",
  from,
  as = "div",
  className,
  id,
  children,
}: Scrub & {
  level?: Level;
  /** Override the level's start offset (px), e.g. a side for a zigzag layout. */
  from?: { x?: number; y?: number };
  as?: ItemTag;
  className?: string;
  id?: string;
  children: ReactNode;
}) {
  const shift = { ...SHIFT[level], ...from };
  const t = useTransform(progress, (v) => easeEnter(revealAt(v, window)));
  const x = useTransform(t, (k) => (1 - k) * (shift.x ?? 0));
  const y = useTransform(t, (k) => (1 - k) * (shift.y ?? 0));
  const scale = useTransform(t, (k) => 1 - (1 - k) * (1 - (shift.scale ?? 1)));
  const Comp = motion[as];
  return (
    <Comp id={id} className={className} style={{ opacity: t, x, y, scale }}>
      {children}
    </Comp>
  );
}

/**
 * One step of a pinned story. Its layers enter on their own windows from
 * opacity 0; the beat itself is at opacity 0 before its window, fades to 0 on
 * exit (beatOpacity), and is visibility hidden with no pointer events
 * whenever it is at 0. The last beat (c = d) never exits.
 */
export function Beat({
  progress,
  range,
  id,
  className,
  labelledBy,
  hidden,
  children,
}: {
  progress: MotionValue<number>;
  range: BeatRange;
  id?: string;
  className?: string;
  labelledBy?: string;
  /** Hide from assistive tech (the story keeps an accessible copy elsewhere). */
  hidden?: boolean;
  children: ReactNode;
}) {
  const opacity = useTransform(progress, (v) => beatOpacity(v, range));
  const visibility = useTransform(opacity, (o) => (o > 0 ? "visible" : "hidden"));
  const pointerEvents = useTransform(opacity, (o) => (o > 0 ? "auto" : "none"));
  return (
    <motion.article
      id={id}
      className={className}
      aria-labelledby={hidden ? undefined : labelledBy}
      aria-hidden={hidden ? "true" : undefined}
      style={{ opacity, visibility, pointerEvents }}
    >
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
    <Comp className={cx(s.eyebrow, className)} variants={STILL}>
      <motion.span className={s.rule} aria-hidden="true" variants={tone === "fade" ? STILL : RULE} />
      <motion.span className={s.eyebrowLabel} variants={tone === "fade" ? FADE : EYEBROW_LABEL}>
        {children}
      </motion.span>
    </Comp>
  );
}

/** Scrubbed: the rule draws over the first 45% of the window, then the label fades in. */
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
  const scaleX = useTransform(progress, (v) => easeEnter(revealAt(v, [from, mid])));
  const opacity = useTransform(progress, (v) => easeEnter(revealAt(v, [mid, to])));
  const x = useTransform(opacity, (k) => (1 - k) * -8);
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

/** A run of text, plain or inside the key phrase, as words and the spaces between them. */
interface Run {
  mark: boolean;
  /** Words and single-space separators, in order. */
  toks: string[];
}

/** Split one part into runs around the key phrase; words keep their punctuation. */
export function textRuns(text: string, mark?: string): Run[] {
  const split = splitMark(text, mark);
  const segs: [string, boolean][] = split ? [[split[0], false], [split[1], true], [split[2], false]] : [[text, false]];
  return segs
    .filter(([t]) => t.length > 0)
    .map(([t, m]) => ({ mark: m, toks: t.split(/(\s+)/).filter(Boolean).map((x) => (/^\s+$/.test(x) ? " " : x)) }));
}

const wordCount = (runs: Run[]) => runs.reduce((n, r) => n + r.toks.filter((t) => t !== " ").length, 0);

/**
 * Body copy that appears word by word from opacity 0 to 1, in reading order,
 * phrase after phrase. The full sentence is visually hidden text for
 * assistive tech; the word spans are aria-hidden and reserve their space from
 * the first render. `mark` underlines one key phrase once it has appeared.
 *
 * Scrubbed: `scrub.window` is split evenly over the phrases, or pass `parts`
 * and `windows` to give each phrase its own window. Reduced motion (tone
 * "fade"): no split, the block fades in whole.
 */
export function RevealText({
  text,
  parts: givenParts,
  windows: givenWindows,
  as = "p",
  className,
  bare = false,
  mark,
  scrub,
}: {
  text: string;
  /** Phrases to reveal in turn (default: splitPhrases(text)). */
  parts?: readonly string[];
  /** One progress window per part (scrubbed only). */
  windows?: readonly Window[];
  as?: "p" | "span" | "div";
  className?: string;
  /** Skip the shared body style (the caller styles the line). */
  bare?: boolean;
  mark?: string;
  scrub?: Scrub;
}) {
  const parts = givenParts ?? splitPhrases(text);
  const cls = cx(!bare && s.body, className);
  if (scrub) {
    const windows = givenWindows ?? splitWindow(scrub.window, parts.length);
    return <ScrubText as={as} className={cls} text={text} parts={parts} windows={windows} mark={mark} progress={scrub.progress} />;
  }
  return <StagedText as={as} className={cls} text={text} parts={parts} mark={mark} />;
}

function StagedText({
  as,
  className,
  text,
  parts,
  mark,
}: {
  as: "p" | "span" | "div";
  className?: string;
  text: string;
  parts: readonly string[];
  mark?: string;
}) {
  const tone = useContext(ToneContext);
  const Comp = motion[as];
  if (tone === "fade") {
    return (
      <Comp className={className} variants={FADE}>
        <WithMark text={text} mark={mark} />
      </Comp>
    );
  }
  const box: Variants = { hidden: {}, show: { transition: { staggerChildren: WORD_STAGGER, delayChildren: 0.05 } } };
  return (
    <Comp className={className} variants={box}>
      <span className={s.srOnly}>{text}</span>
      <span aria-hidden="true">
        {parts.map((part, k) => (
          <span key={`${k}-${part}`}>
            {textRuns(part, mark).map((run, r) => {
              const words = run.toks.map((tok, i) =>
                tok === " " ? " " : (
                  <motion.span key={i} className={s.word} variants={WORD}>
                    {tok}
                  </motion.span>
                ),
              );
              return run.mark ? <Mark key={r}>{words}</Mark> : <span key={r}>{words}</span>;
            })}
            {k < parts.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    </Comp>
  );
}

function ScrubText({
  as,
  className,
  text,
  parts,
  windows,
  mark,
  progress,
}: {
  as: "p" | "span" | "div";
  className?: string;
  text: string;
  parts: readonly string[];
  windows: readonly Window[];
  mark?: string;
  progress: MotionValue<number>;
}) {
  const runs = parts.map((part) => textRuns(part, mark));
  const perWord = wordWindows(windows, runs.map(wordCount));
  const Comp = as;
  return (
    <Comp className={className}>
      <span className={s.srOnly}>{text}</span>
      <span aria-hidden="true">
        {runs.map((partRuns, k) => {
          let w = 0;
          return (
            <span key={`${k}-${parts[k]}`}>
              {partRuns.map((run, r) => {
                const first = w;
                const words = run.toks.map((tok, i) =>
                  tok === " " ? " " : <ScrubWord key={i} progress={progress} window={perWord[k][w++]} text={tok} />,
                );
                if (!run.mark) return <span key={r}>{words}</span>;
                const [, end] = perWord[k][Math.max(first, w - 1)];
                const [start] = perWord[k][first];
                return (
                  <Mark key={r} scrub={{ progress, window: [end, end + (end - start)] }}>
                    {words}
                  </Mark>
                );
              })}
              {k < parts.length - 1 ? " " : null}
            </span>
          );
        })}
      </span>
    </Comp>
  );
}

/** One word: opacity 0 to 1 over its window, rising 0.5em, eased out. Stays at 1. */
function ScrubWord({ progress, window, text }: Scrub & { text: string }) {
  const opacity = useTransform(progress, (v) => revealAt(v, window));
  const y = useTransform(progress, (v) => `${(1 - easeEnter(revealAt(v, window))) * 0.5}em`);
  return (
    <motion.span className={s.word} style={{ opacity, y }}>
      {text}
    </motion.span>
  );
}

function WithMark({ text, mark }: { text: string; mark?: string }) {
  const split = splitMark(text, mark);
  if (!split) return <>{text}</>;
  const [before, hit, after] = split;
  return (
    <>
      {before}
      <Mark>{hit}</Mark>
      {after}
    </>
  );
}

/**
 * The one key phrase of a section: navy, semibold, with an accent underline
 * that draws in (scaleX) after the phrase has appeared. Phones get a static
 * underline (the phrase may wrap there).
 */
export function Mark({ children, scrub, className }: { children: ReactNode; scrub?: Scrub; className?: string }) {
  return (
    <span className={cx(s.mark, className)}>
      {children}
      {scrub ? <ScrubUnderline scrub={scrub} /> : <StagedUnderline />}
    </span>
  );
}

function StagedUnderline() {
  const tone = useContext(ToneContext);
  return <motion.span className={s.markLine} aria-hidden="true" variants={tone === "fade" ? STILL : UNDERLINE} />;
}

function ScrubUnderline({ scrub: { progress, window } }: { scrub: Scrub }) {
  const scaleX = useTransform(progress, (v) => easeEnter(revealAt(v, window)));
  return <motion.span className={s.markLine} aria-hidden="true" style={{ scaleX }} />;
}
