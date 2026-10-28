"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion";
import CountUp from "@/components/motion/CountUp";
import { MorphStage, Reveal } from "@/components/motion/Motion";
import { Mark, RevealText, Stage, StageItem } from "@/components/motion/Story";
import { CHECK_CTA, HERO, PROBLEM, WHAT } from "./content";
import { MockScene } from "@/components/tutorial/mock/MockScene";
import { EMPTY_OVERRIDES, type Overrides } from "@/components/tutorial/sceneUtils";
import type { MockNode } from "@/components/tutorial/types";
import { cx } from "@/components/ui/cx";
import { HERO_SCREENS, HERO_SCREEN_SIZE, screenRoot, type HeroScreen } from "./heroScreens";
import {
  STEPS_TRACK_VH,
  activeStep,
  parseStepHash,
  stepAnchorId,
  stepScreenDrift,
  stepScreenOpacity,
  stepScreenPhase,
  stepScrollY,
} from "./stepAnchors";
import { easeEnter, easeExit, revealAt, type Window } from "@/components/motion/storyMath";
import { scrollPageTo } from "@/components/SmoothScroll";
import s from "./HeroStory.module.scss";

/**
 * The hero story after the first screen: the problem, how ILP works and what
 * you get, one section each. On wide screens with motion allowed the first
 * two pin (MorphStage) and reveal their text word by word, from opacity 0 to 1,
 * as you scroll. On phones and with
 * reduced motion they are plain stacked blocks that fade in once. Each step of
 * "How ILP works" has an example screen (heroScreens.ts): beside the pinned
 * list on wide screens (one at a time, sliding in from alternating sides, with
 * an empty gap between two), under the step text when stacked. All text is
 * in the DOM from the first render; motion only changes opacity and transform.
 * Each step row is a link to #how-it-works-step-N (stepAnchors.ts) that
 * scrolls to where that step is shown, in both layouts.
 */

const SIMPLE_QUERY = "(max-width: 767px), (prefers-reduced-motion: reduce)";

/**
 * True on phones and with reduced motion. Starts true so the server render
 * and no-JS visitors get the readable stacked layout; wide screens switch to
 * the pinned layout after mount (these sections sit below the first screen,
 * so the switch happens out of view).
 */
function useSimpleLayoutState(): [simple: boolean, settled: boolean] {
  const [simple, setSimple] = useState(true);
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(SIMPLE_QUERY);
    const update = () => setSimple(mq.matches);
    update();
    setSettled(true);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return [simple, settled];
}

const useSimpleLayout = () => useSimpleLayoutState()[0];

/* ── The problem ─────────────────────────────────────────────── */

/** Progress window in which the words of phrase i appear, from opacity 0 to 1. */
const phraseWindow = (i: number): [number, number] => [0.04 + i * 0.2, 0.18 + i * 0.2];

/** Phrase windows for RevealText: words of phrase i appear in window i. */
const PHRASE_WINDOWS: Window[] = PROBLEM.phrases.map((_, i) => phraseWindow(i));

/**
 * One label of the problem row: appears from opacity 0 (rising half a line)
 * while its words are read in the second phrase, then its accent fill fades in.
 */
function ProblemChip({ progress, index, label }: { progress: MotionValue<number>; index: number; label: string }) {
  const [a] = phraseWindow(1);
  const shown: Window = [a + index * 0.035, a + 0.035 + index * 0.035];
  const lit: Window = [shown[1], shown[1] + 0.03];
  const opacity = useTransform(progress, (v) => revealAt(v, shown));
  const y = useTransform(progress, (v) => `${(1 - easeEnter(revealAt(v, shown))) * 0.5}em`);
  const fill = useTransform(progress, (v) => revealAt(v, lit));
  return (
    <motion.li className={s.chip} style={{ opacity, y }}>
      <motion.span className={s.chipFill} style={{ opacity: fill }} />
      <span className={s.chipLabel}>{label}</span>
    </motion.li>
  );
}

export function ProblemScroll() {
  const simple = useSimpleLayout();
  const heading = <h2 className={s.problemHeading}>{HERO.labels.why}</h2>;

  if (simple) {
    return (
      <section className={s.problem} aria-label={HERO.labels.why}>
        <div className={s.problemInner}>
          <Reveal>{heading}</Reveal>
          <Reveal delay={0.08}>
            <p className={s.problemText}>{HERO.why}</p>
          </Reveal>
          <Reveal delay={0.16}>
            <ul className={s.chips} aria-hidden="true">
              {PROBLEM.items.map((label) => (
                <li key={label} className={`${s.chip} ${s.chipOn}`}>
                  <span className={s.chipLabel}>{label}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    );
  }

  return (
    <section className={s.problem} aria-label={HERO.labels.why}>
      <MorphStage heightVh={200} className={s.stage}>
        {(progress) => (
          <div className={s.problemInner}>
            {heading}
            <RevealText
              text={HERO.why}
              parts={PROBLEM.phrases}
              windows={PHRASE_WINDOWS}
              scrub={{ progress, window: [PHRASE_WINDOWS[0][0], PHRASE_WINDOWS[PHRASE_WINDOWS.length - 1][1]] }}
              bare
              className={s.problemText}
            />
            <ul className={s.chips} aria-hidden="true">
              {PROBLEM.items.map((label, i) => (
                <ProblemChip key={label} progress={progress} index={i} label={label} />
              ))}
            </ul>
          </div>
        )}
      </MorphStage>
    </section>
  );
}

/* ── How ILP works ───────────────────────────────────────────── */

const STEP_COUNT = HERO.how.length;

/** Scroll to step i (0-based); smooth unless asked not to. */
type GoToStep = (i: number, opts: { smooth: boolean; focus: boolean }) => void;

/**
 * One step row: a link to #how-it-works-step-N over the whole row. A plain
 * click scrolls there in script (so the pinned track lands on the step, not
 * on the marker's native jump fighting smooth scroll); modified clicks keep
 * the browser's own behaviour (new tab, copy link).
 */
function StepLink({
  index,
  text,
  current,
  goTo,
  linkRef,
}: {
  index: number;
  text: string;
  current?: boolean;
  goTo: GoToStep;
  linkRef: (el: HTMLAnchorElement | null) => void;
}) {
  const id = stepAnchorId(index);
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    history.replaceState(history.state, "", `#${id}`);
    goTo(index, { smooth: true, focus: true });
  };
  return (
    <a
      ref={linkRef}
      href={`#${id}`}
      className={s.stepLink}
      aria-current={current ? "step" : undefined}
      onClick={onClick}
    >
      {/* The number is drawn by CSS (data-n), so copying the list does not
          paste it twice next to the list's own marker. */}
      <span className={s.stepNum} data-n={index + 1} aria-hidden="true" />
      <span className={s.stepText}>{text}</span>
    </a>
  );
}

/** Opacity of step i: full while it is the current step, dimmed otherwise. */
function stepStops(i: number): { input: number[]; output: number[] } {
  const a = i / STEP_COUNT;
  const b = (i + 1) / STEP_COUNT;
  const dim = 0.32;
  if (i === 0) return { input: [b - 0.04, b + 0.02], output: [1, dim] };
  if (i === STEP_COUNT - 1) return { input: [a - 0.02, a + 0.04], output: [dim, 1] };
  return { input: [a - 0.02, a + 0.04, b - 0.04, b + 0.02], output: [dim, 1, 1, dim] };
}

function PinnedStep({
  progress,
  index,
  text,
  current,
  goTo,
  linkRef,
}: {
  progress: MotionValue<number>;
  index: number;
  text: string;
  current: boolean;
  goTo: GoToStep;
  linkRef: (el: HTMLAnchorElement | null) => void;
}) {
  const { input, output } = stepStops(index);
  const opacity = useTransform(progress, input, output);
  const x = useTransform(progress, input, output.map((o) => (o === 1 ? 0 : -6)));
  return (
    <motion.li className={s.step} style={{ opacity, x }}>
      <StepLink index={index} text={text} current={current} goTo={goTo} linkRef={linkRef} />
    </motion.li>
  );
}

/** One segment of the "step x of 4" bar, filled while its step is read. */
function Segment({ progress, index }: { progress: MotionValue<number>; index: number }) {
  const scaleX = useTransform(progress, [index / STEP_COUNT, (index + 1) / STEP_COUNT], [0, 1]);
  return (
    <span className={s.segment}>
      <motion.span className={s.segmentFill} style={{ scaleX }} />
    </span>
  );
}

/**
 * An example screen for one step: the tutorial mock UI (static, inert,
 * aria-hidden) drawn at a fixed design size and scaled to the frame width.
 * Wide: a 4:3 frame, so the crossfading screens never shift the layout.
 * Compact (phones, reduced motion): a one-column screen as tall as its content.
 */
function ScreenFrame({ screen, compact = false }: { screen: HeroScreen; compact?: boolean }) {
  return <MockFrame root={screenRoot(screen, compact)} framed={!!screen.shell && !compact} compact={compact} />;
}

/**
 * A mock tree drawn at a fixed design size (720x540 wide, 400 wide compact)
 * and scaled to the frame width; static, inert and aria-hidden. `framed`: the
 * root is a portal shell (drawn edge to edge); otherwise it sits on a white
 * page with padding. `overrides` patches the tree (a screen's timeline).
 * Shared with the lawyers landing (components/lawyers).
 */
export function MockFrame({
  root,
  framed,
  compact = false,
  overrides = EMPTY_OVERRIDES,
}: {
  root: MockNode;
  framed: boolean;
  compact?: boolean;
  overrides?: Overrides;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const W = compact ? HERO_SCREEN_SIZE.compact.w : HERO_SCREEN_SIZE.wide.w;

  useEffect(() => {
    const frame = frameRef.current;
    const stage = stageRef.current;
    if (!frame || !stage) return;
    const fit = () => {
      const k = frame.clientWidth / W;
      stage.style.setProperty("--screen-k", String(k));
      if (compact) frame.style.setProperty("--screen-h", `${Math.ceil(stage.offsetHeight * k)}px`);
    };
    fit();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(fit);
    ro.observe(frame);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [W, compact]);

  return (
    <div ref={frameRef} className={cx(s.screenFrame, compact && s.screenFrameCompact)} aria-hidden="true" inert>
      <div ref={stageRef} className={cx(s.screenStage, compact && s.screenStageCompact)}>
        {framed ? (
          <MockScene root={root} overrides={overrides} />
        ) : (
          <div className={s.screenPage}>
            <MockScene root={root} overrides={overrides} />
          </div>
        )}
      </div>
    </div>
  );
}

/** Marks the screens as illustrations, so nobody reads them as real data. */
function ScreenCaption() {
  return (
    <span className={s.screenCaption} aria-hidden="true">
      Example screen
    </span>
  );
}

/**
 * Step i's example screen: slides in from its side (alternating, a Z down the
 * steps) only after the previous screen has gone, holds while its step is
 * read, then fades to 0 drifting toward its corner. Hidden at opacity 0.
 */
function VisualLayer({ progress, index }: { progress: MotionValue<number>; index: number }) {
  const drift = stepScreenDrift(index);
  const opacity = useTransform(progress, (v) => stepScreenOpacity(v, index));
  const x = useTransform(progress, (v) => {
    const { enter, exit } = stepScreenPhase(v, index);
    return (1 - easeEnter(enter)) * drift.enter.x + easeExit(exit) * drift.exit.x;
  });
  const y = useTransform(progress, (v) => easeExit(stepScreenPhase(v, index).exit) * drift.exit.y);
  const visibility = useTransform(opacity, (o) => (o > 0 ? "visible" : "hidden"));
  return (
    <motion.div className={s.visualLayer} style={{ opacity, x, y, visibility }}>
      <ScreenFrame screen={HERO_SCREENS[index]} />
    </motion.div>
  );
}

function PinnedSteps({
  progress,
  goTo,
  linkRef,
}: {
  progress: MotionValue<number>;
  goTo: GoToStep;
  linkRef: (i: number) => (el: HTMLAnchorElement | null) => void;
}) {
  const [current, setCurrent] = useState(() => activeStep(progress.get()));
  useMotionValueEvent(progress, "change", (v) => {
    const next = activeStep(v);
    setCurrent((prev) => (prev === next ? prev : next));
  });

  return (
    <div className={s.stepsInner}>
      <div className={s.stepsCol}>
        <h2 className={s.stepsHeading}>{HERO.labels.how}</h2>
        <div className={s.progress} aria-hidden="true">
          <span className={s.progressLabel}>
            Step {current + 1} of {STEP_COUNT}
          </span>
          <span className={s.segments}>
            {HERO.how.map((_, i) => (
              <Segment key={i} progress={progress} index={i} />
            ))}
          </span>
        </div>
        <ol className={s.stepList}>
          {HERO.how.map((text, i) => (
            <PinnedStep
              key={text}
              progress={progress}
              index={i}
              text={text}
              current={i === current}
              goTo={goTo}
              linkRef={linkRef(i)}
            />
          ))}
        </ol>
      </div>
      <div className={s.visual} aria-hidden="true">
        <ScreenCaption />
        <div className={s.visualStack}>
          {HERO.how.map((text, i) => (
            <VisualLayer key={text} progress={progress} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Scrolling to a step. Pinned: the offset where the track's progress makes
 * step i active (stepScrollY, the same math as the markers). Stacked: the step
 * block's top less its scroll-margin-top (the fixed nav). The li is measured,
 * not the Reveal inside it, so its entrance transform does not skew the
 * offset. Then focus the step's link without scrolling again.
 */
function useStepNavigation(simple: boolean, settled: boolean) {
  const sectionRef = useRef<HTMLElement>(null);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);
  const linkRef = useCallback(
    (i: number) => (el: HTMLAnchorElement | null) => {
      links.current[i] = el;
    },
    [],
  );

  const goTo = useCallback<GoToStep>(
    (i, { smooth, focus }) => {
      const section = sectionRef.current;
      if (!section) return;
      let y: number;
      if (simple) {
        const block = document.getElementById(stepAnchorId(i));
        if (!block) return;
        const margin = parseFloat(getComputedStyle(block).scrollMarginTop) || 0;
        y = Math.round(block.getBoundingClientRect().top + window.scrollY - margin);
      } else {
        const r = section.getBoundingClientRect();
        y = stepScrollY(
          { trackTop: r.top + window.scrollY, trackHeight: section.offsetHeight, viewport: window.innerHeight },
          i,
        );
      }
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      scrollPageTo(Math.max(0, y), smooth && !reduce);
      if (focus) links.current[i]?.focus({ preventScroll: true });
    },
    [simple],
  );

  /* Deep links. The server render is the stacked layout, so the browser's own
   * jump to #how-it-works-step-N lands on a stacked block; once the layout has
   * switched (settled) and painted, jump again to the real offset, once.
   * Later hash changes (a link elsewhere on the page) scroll smoothly. */
  const landed = useRef(false);
  useEffect(() => {
    if (!settled) return;
    let raf = 0;
    if (!landed.current) {
      landed.current = true;
      const i = parseStepHash(window.location.hash);
      if (i !== null) {
        raf = requestAnimationFrame(() => {
          raf = requestAnimationFrame(() => goTo(i, { smooth: false, focus: false }));
        });
      }
    }
    const onHash = () => {
      const i = parseStepHash(window.location.hash);
      if (i !== null) goTo(i, { smooth: true, focus: true });
    };
    window.addEventListener("hashchange", onHash);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("hashchange", onHash);
    };
  }, [settled, goTo]);

  return { sectionRef, goTo, linkRef };
}

export function StepsScroll() {
  const [simple, settled] = useSimpleLayoutState();
  const { sectionRef, goTo, linkRef } = useStepNavigation(simple, settled);

  if (simple) {
    return (
      <section ref={sectionRef} id={HERO.howAnchor} className={s.steps} aria-label={HERO.labels.how}>
        <div className={s.stepsInner}>
          <div className={s.stepsCol}>
            <Reveal>
              <h2 className={s.stepsHeading}>{HERO.labels.how}</h2>
            </Reveal>
            <ol className={s.stepList}>
              {HERO.how.map((text, i) => (
                <li key={text} id={stepAnchorId(i)} className={s.stepPlain}>
                  <Reveal delay={i * 0.06}>
                    <StepLink index={i} text={text} goTo={goTo} linkRef={linkRef(i)} />
                  </Reveal>
                  <Reveal className={s.stepScreen} delay={0.1}>
                    <ScreenCaption />
                    <ScreenFrame screen={HERO_SCREENS[i]} compact />
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} id={HERO.howAnchor} className={s.steps} aria-label={HERO.labels.how}>
      {/* Zero-height link targets at the scroll offsets where each step is
          shown (top: $step-anchor-progress in the scss). Not focusable. */}
      <div className={s.stepAnchors} aria-hidden="true">
        {HERO.how.map((text, i) => (
          <span key={text} id={stepAnchorId(i)} className={s.stepAnchor} />
        ))}
      </div>
      <MorphStage heightVh={STEPS_TRACK_VH} className={s.stage}>
        {(progress) => <PinnedSteps progress={progress} goTo={goTo} linkRef={linkRef} />}
      </MorphStage>
    </section>
  );
}

/* ── What you get ────────────────────────────────────────────── */

const formatPrice = (v: number) => `US$${v.toFixed(2)}`;

export function WhatYouGet() {
  return (
    <section className={s.what} aria-labelledby="what-title">
      <Stage className={s.whatInner} amount={0.3}>
        <StageItem as="h2" level="title" id="what-title" className={s.whatHeading}>
          {HERO.labels.what}
        </StageItem>
        <div className={s.whatGrid}>
          <StageItem level="visual" className={s.priceBlock}>
            <p className={s.price}>
              <Mark className={s.priceMark}>
                <CountUp value={WHAT.price} formatter={formatPrice} duration={0.9} className={s.priceFigure} />
              </Mark>{" "}
              <span className={s.priceUnit}>{WHAT.unit}</span>
            </p>
            <p className={s.activation}>{WHAT.activation}</p>
          </StageItem>
          <div className={s.whatLines}>
            <StageItem level="body" className={s.whatLine}>
              <RevealText text={WHAT.calls} className={s.whatText} />
            </StageItem>
            <StageItem level="body" className={s.whatLine}>
              <RevealText text={WHAT.extra} className={s.whatText} />
            </StageItem>
          </div>
        </div>
        <StageItem level="body">
          <Link href="/check" className={s.primary}>
            {CHECK_CTA}
          </Link>
        </StageItem>
      </Stage>
    </section>
  );
}
