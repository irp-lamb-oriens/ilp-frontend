"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode, type RefObject } from "react";
import { animate, motion, useInView, useMotionValue, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion";
import { scrollPageTo } from "@/components/SmoothScroll";
import { cx } from "@/components/ui/cx";
import { Beat, Eyebrow, RevealText, ScrubItem, Stage, StageItem, useSectionProgress, useStoryLayout, type StoryLayout } from "./Story";
import {
  activeBeat,
  beatAnchorProgress,
  beatExit,
  beatLayers,
  easeEnter,
  revealAt,
  splitPhrases,
  trackScrollY,
  zigzagDrift,
  type BeatRange,
  type Window,
  type ZigzagSlot,
} from "./storyMath";
import s from "./BeatStory.module.scss";

/**
 * A section told as a sequence of beats (the lawyers landing uses two).
 * Same driver as the homepage costs story (CostsStory.tsx), for any beats:
 *
 * Pinned (wide screens, motion allowed): a tall track whose stage sticks to
 * the viewport. The heading and a rail of links stay at the top; the beats
 * play one after another below, text and visual changing sides from beat to
 * beat (a Gutenberg Z, `slots`). Each beat stages its copy levels with
 * beatLayers(): the eyebrow rule draws and the label fades in, the title
 * appears word by word, then the body, then the visual's caption, each from
 * opacity 0 to 1 only after the level above has landed. The visual slides in
 * from its side and plays its timeline once the title is complete. Then the
 * beat fades to 0 drifting toward its corner, and only after an empty gap
 * does the next one start (beatRanges). Off stage a beat is at opacity 0
 * with no pointer events (<Beat>) but stays readable, so screen readers read
 * every beat once, in order, and copying gives each beat once (no hidden
 * copy).
 *
 * Staged (tablets): no pin; each beat is a block that plays once when it
 * enters, levels in order, visual sides alternating, the visual's timeline
 * played once. Stacked (phones, reduced motion, server render): blocks that
 * fade in once, visuals at their end state, no movement.
 *
 * Each beat has a fragment id; the rail links and deep links scroll to the
 * point where that beat is fully read, in every layout.
 */

export interface StoryBeat {
  /** Fragment id of the beat. */
  id: string;
  /** Tertiary label above the beat. */
  eyebrow: string;
  /** Rail link label. */
  rail: string;
  /** Secondary heading, revealed word by word (h3). */
  title?: string;
  titleMark?: string;
  /** Supporting copy, revealed after the title. */
  body?: string;
  mark?: string;
  /** Tertiary line under the visual: what the (aria-hidden) visual shows. */
  caption?: string;
}

export interface BeatStoryProps {
  /** Section id (the rail's first link target is the first beat). */
  id: string;
  /** Section heading (h2) text. */
  heading: string;
  beats: readonly StoryBeat[];
  ranges: readonly BeatRange[];
  slots: readonly ZigzagSlot[];
  /** Height of the pinned track in vh. */
  trackVh: number;
  /** Progress 0 when the track's top is this share down the viewport. */
  startAt?: number;
  /** Body is the beat's main line (large type, no title). */
  statement?: boolean;
  /** Wide visuals (example screens) get half the row; otherwise five twelfths. */
  wideVisual?: boolean;
  /** Section background. */
  tone?: "canvas" | "mist" | "accent";
  /** The beat's visual, given its timeline (0..1). Rendered aria-hidden. */
  visual: (index: number, t: MotionValue<number>, layout: StoryLayout) => ReactNode;
}

export function BeatStory(props: BeatStoryProps) {
  const { id, heading, beats, ranges, slots, trackVh, startAt = 0.35, statement = false, wideVisual = false, tone = "canvas", visual } = props;
  const layout = useStoryLayout();
  const trackRef = useRef<HTMLDivElement>(null);
  const progress = useSectionProgress(trackRef, startAt);
  const pinned = layout === "pinned";
  const goTo = useBeatNavigation(trackRef, layout, beats, ranges, startAt);
  const headingId = `${id}-title`;

  return (
    <section id={id} className={cx(s.story, s[tone])} aria-labelledby={headingId}>
      <div ref={trackRef} className={s.track} style={{ "--track-vh": trackVh } as CSSProperties}>
        <div className={s.stage}>
          <div className={s.grid}>
            <Stage as="header" className={s.head} amount={0.4}>
              <StageItem as="h2" level="title" id={headingId} className={s.heading}>
                {heading}
              </StageItem>
              <StageItem level="body" className={s.railHost}>
                <Rail progress={progress} pinned={pinned} goTo={goTo} beats={beats} ranges={ranges} label={heading} />
              </StageItem>
            </Stage>

            <div className={s.beats}>
              {beats.map((beat, i) =>
                pinned ? (
                  <PinnedBeat
                    key={beat.id}
                    beat={beat}
                    index={i}
                    range={ranges[i]}
                    slot={slots[i]}
                    progress={progress}
                    statement={statement}
                    wideVisual={wideVisual}
                    visual={visual}
                  />
                ) : (
                  <StagedBeat key={beat.id} beat={beat} index={i} slot={slots[i]} layout={layout} statement={statement} wideVisual={wideVisual} visual={visual} />
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Navigation ──────────────────────────────────────────────── */

type GoTo = (i: number, smooth: boolean) => void;

function useBeatNavigation(
  trackRef: RefObject<HTMLDivElement | null>,
  layout: StoryLayout,
  beats: readonly StoryBeat[],
  ranges: readonly BeatRange[],
  startAt: number,
): GoTo {
  const goTo = useCallback<GoTo>(
    (i, smooth) => {
      const track = trackRef.current;
      if (!track) return;
      let y: number;
      if (layout === "pinned") {
        const r = track.getBoundingClientRect();
        y = trackScrollY(
          { trackTop: r.top + window.scrollY, trackHeight: track.offsetHeight, viewport: window.innerHeight, startAt },
          beatAnchorProgress(ranges[i]),
        );
      } else {
        const block = document.getElementById(beats[i].id);
        if (!block) return;
        const margin = parseFloat(getComputedStyle(block).scrollMarginTop) || 0;
        y = Math.round(block.getBoundingClientRect().top + window.scrollY - margin);
      }
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      scrollPageTo(Math.max(0, y), smooth && !reduce);
    },
    [trackRef, layout, beats, ranges, startAt],
  );

  const landed = useRef(false);
  useEffect(() => {
    const parse = (hash: string) => {
      const i = beats.findIndex((b) => b.id === hash.replace(/^#/, ""));
      return i >= 0 ? i : null;
    };
    let raf = 0;
    if (layout === "pinned" && !landed.current) {
      landed.current = true;
      const i = parse(window.location.hash);
      if (i !== null) {
        raf = requestAnimationFrame(() => {
          raf = requestAnimationFrame(() => goTo(i, false));
        });
      }
    }
    const onHash = () => {
      const i = parse(window.location.hash);
      if (i !== null) goTo(i, true);
    };
    window.addEventListener("hashchange", onHash);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("hashchange", onHash);
    };
  }, [layout, goTo, beats]);

  return goTo;
}

/** "1 of N" and one link per beat; the current one is marked and its bar fills. */
function Rail({
  progress,
  pinned,
  goTo,
  beats,
  ranges,
  label,
}: {
  progress: MotionValue<number>;
  pinned: boolean;
  goTo: GoTo;
  beats: readonly StoryBeat[];
  ranges: readonly BeatRange[];
  label: string;
}) {
  const [current, setCurrent] = useState(0);
  useMotionValueEvent(progress, "change", (v) => {
    const next = activeBeat(v, ranges);
    setCurrent((prev) => (prev === next ? prev : next));
  });

  const onClick = (i: number) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    history.replaceState(history.state, "", `#${beats[i].id}`);
    goTo(i, true);
  };

  return (
    <nav className={s.rail} aria-label={label}>
      {pinned && (
        <p className={s.railCount} aria-hidden="true">
          {current + 1} of {beats.length}
        </p>
      )}
      <ul className={s.railList} style={{ "--rail-n": beats.length } as CSSProperties}>
        {beats.map((beat, i) => (
          <li key={beat.id}>
            <a href={`#${beat.id}`} className={s.railLink} aria-current={pinned && i === current ? "step" : undefined} onClick={onClick(i)}>
              <span className={s.railLabel}>{beat.rail}</span>
              <span className={s.railBar} aria-hidden="true">
                {pinned ? <RailFill progress={progress} range={ranges[i]} /> : null}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function RailFill({ progress, range }: { progress: MotionValue<number>; range: BeatRange }) {
  const [a, , c] = range;
  const scaleX = useTransform(progress, [a, c], [0, 1]);
  return <motion.span className={s.railFill} style={{ scaleX }} />;
}

/* ── Beats ───────────────────────────────────────────────────── */

interface BeatProps {
  beat: StoryBeat;
  index: number;
  slot: ZigzagSlot;
  statement: boolean;
  wideVisual: boolean;
  visual: BeatStoryProps["visual"];
}

function PinnedBeat({ beat, index, range, slot, progress, statement, wideVisual, visual }: BeatProps & { range: BeatRange; progress: MotionValue<number> }) {
  const L = beatLayers(range, { title: !!beat.title, bodyPhrases: beat.body ? splitPhrases(beat.body).length : 0 });
  const timeline = useTransform(progress, (v) => revealAt(v, L.timeline));
  const textIn: Window = [range[0], L.title ? L.title[1] : L.body[1]];
  return (
    <Beat
      progress={progress}
      range={range}
      id={beat.id}
      className={cx(s.beat, statement && s.statementBeat, wideVisual && s.wideBeat, slot.text === "end" && s.textEnd)}
    >
      <Drift progress={progress} range={range} enter={textIn} drift={zigzagDrift(slot.text, "top")} className={s.text}>
        <Eyebrow scrub={{ progress, window: [L.rule[0], L.eyebrow[1]] }}>{beat.eyebrow}</Eyebrow>
        {beat.title && L.title ? (
          <h3 className={s.title}>
            <RevealText as="span" bare text={beat.title} mark={beat.titleMark} scrub={{ progress, window: L.title }} />
          </h3>
        ) : null}
        {beat.body ? (
          <RevealText
            text={beat.body}
            mark={beat.mark}
            bare={statement}
            className={statement ? s.statement : s.body}
            scrub={{ progress, window: L.body }}
          />
        ) : null}
      </Drift>
      <Drift progress={progress} range={range} enter={L.visual} drift={zigzagDrift(slot.visual, "bottom")} fade className={s.visual}>
        <div className={s.visualHost}>{visual(index, timeline, "pinned")}</div>
        {beat.caption ? (
          <ScrubItem progress={progress} window={L.caption} level="body" as="p" className={s.caption}>
            {beat.caption}
          </ScrubItem>
        ) : null}
      </Drift>
    </Beat>
  );
}

/**
 * One part of a pinned beat on the Z path: slides in from its own side over
 * `enter` (eased out; with `fade`, also from opacity 0), and drifts toward
 * its corner over the beat's exit (eased in) while the beat fades to 0.
 */
function Drift({
  progress,
  range,
  enter,
  drift,
  fade = false,
  className,
  children,
}: {
  progress: MotionValue<number>;
  range: BeatRange;
  enter: Window;
  drift: ReturnType<typeof zigzagDrift>;
  fade?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const inT = useTransform(progress, (v) => easeEnter(revealAt(v, enter)));
  const outT = useTransform(progress, (v) => beatExit(v, range));
  const x = useTransform([inT, outT], ([i, o]: number[]) => (1 - i) * drift.enter.x + o * drift.exit.x);
  const y = useTransform([inT, outT], ([i, o]: number[]) => (1 - i) * drift.enter.y + o * drift.exit.y);
  return (
    <motion.div className={className} style={fade ? { opacity: inT, x, y } : { x, y }}>
      {children}
    </motion.div>
  );
}

function StagedBeat({ beat, index, slot, layout, statement, wideVisual, visual }: BeatProps & { layout: StoryLayout }) {
  return (
    <Stage
      as="article"
      id={beat.id}
      className={cx(s.beat, statement && s.statementBeat, wideVisual && s.wideBeat, slot.text === "end" && s.flip)}
      tone={layout === "stacked" ? "fade" : "rise"}
      amount={0.3}
    >
      <div className={s.text}>
        <Eyebrow>{beat.eyebrow}</Eyebrow>
        {beat.title ? (
          <h3 className={s.title}>
            <RevealText as="span" bare text={beat.title} mark={beat.titleMark} />
          </h3>
        ) : null}
        {beat.body ? <RevealText text={beat.body} mark={beat.mark} bare={statement} className={statement ? s.statement : s.body} /> : null}
      </div>
      <div className={s.visual}>
        <StageItem level="visual" className={s.visualHost}>
          <PlayOnce play={layout === "staged"}>{(t) => visual(index, t, layout)}</PlayOnce>
        </StageItem>
        {beat.caption ? (
          <StageItem as="p" level="body" className={s.caption}>
            {beat.caption}
          </StageItem>
        ) : null}
      </div>
    </Stage>
  );
}

/**
 * A visual's timeline outside the pinned layout: plays 0 to 1 once when the
 * visual is half in view (tablets), or sits at its end state (phones,
 * reduced motion, the server render).
 */
function PlayOnce({ play, children }: { play: boolean; children: (t: MotionValue<number>) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const t = useMotionValue(1);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const played = useRef(false);

  useEffect(() => {
    if (!play) {
      t.set(1);
      return;
    }
    if (played.current) return;
    if (!inView) {
      t.set(0);
      return;
    }
    played.current = true;
    const controls = animate(t, 1, { duration: 3, ease: [0.45, 0, 0.25, 1] });
    return () => controls.stop();
  }, [play, inView, t]);

  return <div ref={ref}>{children(t)}</div>;
}
