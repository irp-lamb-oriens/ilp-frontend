"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion";
import CountUp from "@/components/motion/CountUp";
import { MorphStage, Reveal } from "@/components/motion/Motion";
import { CHECK_CTA, HERO, PROBLEM, WHAT } from "./content";
import { MockScene } from "@/components/tutorial/mock/MockScene";
import { EMPTY_OVERRIDES } from "@/components/tutorial/sceneUtils";
import { cx } from "@/components/ui/cx";
import { HERO_SCREENS, HERO_SCREEN_SIZE, screenRoot, type HeroScreen } from "./heroScreens";
import s from "./HeroStory.module.scss";

/**
 * The hero story after the first screen: the problem, how ILP works and what
 * you get, one section each. On wide screens with motion allowed the first
 * two pin (MorphStage) and reveal their text as you scroll. On phones and with
 * reduced motion they are plain stacked blocks that fade in once. Each step of
 * "How ILP works" has an example screen (heroScreens.ts): beside the pinned
 * list on wide screens, under the step text when stacked. All text is
 * in the DOM from the first render; motion only changes opacity and transform.
 */

const SIMPLE_QUERY = "(max-width: 767px), (prefers-reduced-motion: reduce)";

/**
 * True on phones and with reduced motion. Starts true so the server render
 * and no-JS visitors get the readable stacked layout; wide screens switch to
 * the pinned layout after mount (these sections sit below the first screen,
 * so the switch happens out of view).
 */
function useSimpleLayout() {
  const [simple, setSimple] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia(SIMPLE_QUERY);
    const update = () => setSimple(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return simple;
}

/** Dim to full opacity over [from, to] of the stage progress. */
function Scrub({
  progress,
  from,
  to,
  floor = 0.16,
  className,
  children,
}: {
  progress: MotionValue<number>;
  from: number;
  to: number;
  floor?: number;
  className?: string;
  children: ReactNode;
}) {
  const opacity = useTransform(progress, [from, to], [floor, 1]);
  return (
    <motion.span className={className} style={{ opacity }}>
      {children}
    </motion.span>
  );
}

/* ── The problem ─────────────────────────────────────────────── */

/** Progress window in which phrase i brightens. */
const phraseWindow = (i: number): [number, number] => [0.04 + i * 0.2, 0.18 + i * 0.2];

/** One label of the problem row: a hairline chip whose accent fill fades in. */
function ProblemChip({ progress, index, label }: { progress: MotionValue<number>; index: number; label: string }) {
  const [a] = phraseWindow(1);
  const lit = useTransform(progress, [a + index * 0.04, a + 0.04 + index * 0.04], [0, 1]);
  return (
    <li className={s.chip}>
      <motion.span className={s.chipFill} style={{ opacity: lit }} />
      <span className={s.chipLabel}>{label}</span>
    </li>
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
            <p className={s.problemText}>
              {PROBLEM.phrases.map((phrase, i) => {
                const [from, to] = phraseWindow(i);
                return (
                  <span key={phrase}>
                    <Scrub progress={progress} from={from} to={to} floor={i === 0 ? 0.3 : 0.16}>
                      {phrase}
                    </Scrub>
                    {i < PROBLEM.phrases.length - 1 ? " " : null}
                  </span>
                );
              })}
            </p>
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

/** The step text: one visible number (decorative), the <ol> gives the order. */
function StepBody({ index, text }: { index: number; text: string }) {
  return (
    <>
      <span className={s.stepNum} aria-hidden="true">
        {index + 1}
      </span>
      <span className={s.stepText}>{text}</span>
    </>
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

function PinnedStep({ progress, index, text }: { progress: MotionValue<number>; index: number; text: string }) {
  const { input, output } = stepStops(index);
  const opacity = useTransform(progress, input, output);
  const x = useTransform(progress, input, output.map((o) => (o === 1 ? 0 : -6)));
  return (
    <motion.li className={s.step} style={{ opacity, x }}>
      <StepBody index={index} text={text} />
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

  const root = screenRoot(screen, compact);
  return (
    <div ref={frameRef} className={cx(s.screenFrame, compact && s.screenFrameCompact)} aria-hidden="true" inert>
      <div ref={stageRef} className={cx(s.screenStage, compact && s.screenStageCompact)}>
        {screen.shell && !compact ? (
          <MockScene root={root} overrides={EMPTY_OVERRIDES} />
        ) : (
          <div className={s.screenPage}>
            <MockScene root={root} overrides={EMPTY_OVERRIDES} />
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

function VisualLayer({ progress, index }: { progress: MotionValue<number>; index: number }) {
  const { input, output } = stepStops(index);
  const opacity = useTransform(progress, input, output.map((o) => (o === 1 ? 1 : 0)));
  const y = useTransform(progress, input, output.map((o) => (o === 1 ? 0 : 16)));
  const scale = useTransform(progress, input, output.map((o) => (o === 1 ? 1 : 0.98)));
  return (
    <motion.div className={s.visualLayer} style={{ opacity, y, scale }}>
      <ScreenFrame screen={HERO_SCREENS[index]} />
    </motion.div>
  );
}

function PinnedSteps({ progress }: { progress: MotionValue<number> }) {
  const [current, setCurrent] = useState(0);
  useMotionValueEvent(progress, "change", (v) => {
    const next = Math.min(STEP_COUNT - 1, Math.max(0, Math.floor(v * STEP_COUNT)));
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
            <PinnedStep key={text} progress={progress} index={i} text={text} />
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

export function StepsScroll() {
  const simple = useSimpleLayout();

  if (simple) {
    return (
      <section id={HERO.howAnchor} className={s.steps} aria-label={HERO.labels.how}>
        <div className={s.stepsInner}>
          <div className={s.stepsCol}>
            <Reveal>
              <h2 className={s.stepsHeading}>{HERO.labels.how}</h2>
            </Reveal>
            <ol className={s.stepList}>
              {HERO.how.map((text, i) => (
                <li key={text} className={s.stepPlain}>
                  <Reveal className={s.stepGrid} delay={i * 0.06}>
                    <StepBody index={i} text={text} />
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
    <section id={HERO.howAnchor} className={s.steps} aria-label={HERO.labels.how}>
      <MorphStage heightVh={240} className={s.stage}>
        {(progress) => <PinnedSteps progress={progress} />}
      </MorphStage>
    </section>
  );
}

/* ── What you get ────────────────────────────────────────────── */

const formatPrice = (v: number) => `US$${v.toFixed(2)}`;

export function WhatYouGet() {
  return (
    <section className={s.what} aria-label={HERO.labels.what}>
      <div className={s.whatInner}>
        <Reveal>
          <h2 className={s.whatHeading}>{HERO.labels.what}</h2>
        </Reveal>
        <div className={s.whatGrid}>
          <Reveal className={s.priceBlock} delay={0.08}>
            <p className={s.price}>
              <CountUp value={WHAT.price} formatter={formatPrice} duration={0.9} className={s.priceFigure} />{" "}
              <span className={s.priceUnit}>{WHAT.unit}</span>
            </p>
            <p className={s.activation}>{WHAT.activation}</p>
          </Reveal>
          <div className={s.whatLines}>
            <Reveal className={s.whatLine} delay={0.16} from="right">
              <p>{WHAT.calls}</p>
            </Reveal>
            <Reveal className={s.whatLine} delay={0.24} from="right">
              <p>{WHAT.extra}</p>
            </Reveal>
          </div>
        </div>
        <Reveal delay={0.3}>
          <Link href="/check" className={s.primary}>
            {CHECK_CTA}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
