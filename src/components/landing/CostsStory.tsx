"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  Beat,
  Eyebrow,
  RevealText,
  ScrubItem,
  Stage,
  StageItem,
  useSectionProgress,
  useStoryLayout,
  type StoryLayout,
} from "@/components/motion/Story";
import {
  activeBeat,
  beatExit,
  beatParts,
  easeEnter,
  revealAt,
  splitPhrases,
  trackScrollY,
  zigzagDrift,
  type BeatRange,
  type Window,
} from "@/components/motion/storyMath";
import { scrollPageTo } from "@/components/SmoothScroll";
import { cx } from "@/components/ui/cx";
import { COSTS, COSTS_HEAD, COSTS_VISUALS, COSTS_WRAP } from "./content";
import {
  COSTS_RANGES,
  COSTS_START_AT,
  COSTS_ZIGZAG,
  FINES_SHIFT,
  costAnchorId,
  costAnchorProgress,
  finesCross,
  parseCostHash,
} from "./costsBeats";
import { LandingIcon } from "./SectionHead";
import s from "./CostsStory.module.scss";

/**
 * "What a missed date can cost you" as a scroll story.
 *
 * Wide screens with motion allowed (pinned): the track is 320vh tall and its
 * stage sticks to the viewport. The heading, the lead and the progress rail
 * stay top left in their own column; the three costs play one after another
 * in the main column, in a Gutenberg Z (COSTS_ZIGZAG): text top left and
 * picture bottom right, then text top right and picture bottom left, then
 * back. Each beat: the eyebrow rule draws and the label fades in, the title
 * lands, the body appears word by word from opacity 0, and the picture slides
 * in from its side and plays its own timeline once the title has landed.
 * Then the beat fades to 0 while each part drifts toward its corner, and only
 * after a short empty gap does the next beat start. Beats never overlap.
 *
 * Tablets (staged): no pin; each beat is its own block whose levels stagger
 * in when it enters, picture sides alternate, and the picture plays once.
 * Phones and reduced motion (stacked): blocks fade in once and pictures show
 * their end state.
 *
 * The rail links (#costs-fines, #costs-doubt, #costs-retelling) scroll to the
 * point where that beat is fully read, in every layout. All text is in the
 * DOM from the first render; the pictures are aria-hidden. Off stage a pinned
 * beat is at opacity 0 with no pointer events but stays readable, so screen
 * readers read the three beats once each, in order, and there is no hidden
 * copy to paste twice.
 */
export function CostsStory() {
  const layout = useStoryLayout();
  const trackRef = useRef<HTMLDivElement>(null);
  const progress = useSectionProgress(trackRef, COSTS_START_AT);
  const pinned = layout === "pinned";
  const goTo = useCostNavigation(trackRef, layout);

  return (
    <section id={COSTS_HEAD.anchor} className={s.costs} aria-labelledby="costs-title">
      <div ref={trackRef} className={s.track}>
        <div className={s.stage}>
          <div className={s.grid}>
            <Stage as="header" className={s.head} amount={0.4}>
              <StageItem level="eyebrow" className={s.iconRow}>
                <LandingIcon name="calendar" />
              </StageItem>
              <StageItem as="h2" level="title" id="costs-title" className={s.title}>
                {COSTS_HEAD.title}
              </StageItem>
              <RevealText text={COSTS_HEAD.why} mark={COSTS_HEAD.mark} className={s.lead} />
              <StageItem level="body">
                <Rail progress={progress} pinned={pinned} goTo={goTo} />
              </StageItem>
            </Stage>

            <div className={s.beats}>
              {COSTS.map((cost, i) =>
                pinned ? (
                  <PinnedBeat key={cost.id} index={i} progress={progress} />
                ) : (
                  <StagedBeat key={cost.id} index={i} layout={layout} />
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      <Stage className={s.wrapUp} amount={0.6}>
        <RevealText text={COSTS_WRAP.line} className={s.wrapLine} />
        <StageItem level="body">
          <a href={COSTS_WRAP.href} className={s.wrapLink}>
            {COSTS_WRAP.link}
          </a>
        </StageItem>
      </Stage>
    </section>
  );
}

/* ── Navigation ──────────────────────────────────────────────── */

type GoTo = (i: number, smooth: boolean) => void;

/**
 * Scroll to beat i. Pinned: the page offset where the track's progress is late
 * in that beat's hold (trackScrollY, the same math the progress uses).
 * Otherwise: the beat block's top, less its scroll-margin-top. Deep links land
 * once the layout has settled; later hash changes scroll smoothly.
 */
function useCostNavigation(trackRef: React.RefObject<HTMLDivElement | null>, layout: StoryLayout): GoTo {
  const goTo = useCallback<GoTo>(
    (i, smooth) => {
      const track = trackRef.current;
      if (!track) return;
      let y: number;
      if (layout === "pinned") {
        const r = track.getBoundingClientRect();
        y = trackScrollY(
          {
            trackTop: r.top + window.scrollY,
            trackHeight: track.offsetHeight,
            viewport: window.innerHeight,
            startAt: COSTS_START_AT,
          },
          costAnchorProgress(i),
        );
      } else {
        const block = document.getElementById(costAnchorId(i));
        if (!block) return;
        const margin = parseFloat(getComputedStyle(block).scrollMarginTop) || 0;
        y = Math.round(block.getBoundingClientRect().top + window.scrollY - margin);
      }
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      scrollPageTo(Math.max(0, y), smooth && !reduce);
    },
    [trackRef, layout],
  );

  const landed = useRef(false);
  useEffect(() => {
    let raf = 0;
    if (layout === "pinned" && !landed.current) {
      landed.current = true;
      const i = parseCostHash(window.location.hash);
      if (i !== null) {
        raf = requestAnimationFrame(() => {
          raf = requestAnimationFrame(() => goTo(i, false));
        });
      }
    }
    const onHash = () => {
      const i = parseCostHash(window.location.hash);
      if (i !== null) goTo(i, true);
    };
    window.addEventListener("hashchange", onHash);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("hashchange", onHash);
    };
  }, [layout, goTo]);

  return goTo;
}

/** "1 of 3" and the three eyebrows as links; the current one is marked. */
function Rail({ progress, pinned, goTo }: { progress: MotionValue<number>; pinned: boolean; goTo: GoTo }) {
  const [current, setCurrent] = useState(0);
  useMotionValueEvent(progress, "change", (v) => {
    const next = activeBeat(v, COSTS_RANGES);
    setCurrent((prev) => (prev === next ? prev : next));
  });

  const onClick = (i: number) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    history.replaceState(history.state, "", `#${costAnchorId(i)}`);
    goTo(i, true);
  };

  return (
    <nav className={s.rail} aria-label={COSTS_HEAD.title}>
      {pinned && (
        <p className={s.railCount} aria-hidden="true">
          {current + 1} of {COSTS.length}
        </p>
      )}
      <ol className={s.railList}>
        {COSTS.map((cost, i) => (
          <li key={cost.id}>
            <a
              href={`#${costAnchorId(i)}`}
              className={s.railLink}
              aria-current={pinned && i === current ? "step" : undefined}
              onClick={onClick(i)}
            >
              <span className={s.railLabel}>{cost.eyebrow}</span>
              <span className={s.railBar} aria-hidden="true">
                {pinned ? <RailFill progress={progress} index={i} /> : null}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function RailFill({ progress, index }: { progress: MotionValue<number>; index: number }) {
  const [a, , c] = COSTS_RANGES[index];
  const scaleX = useTransform(progress, [a, c], [0, 1]);
  return <motion.span className={s.railFill} style={{ scaleX }} />;
}

/* ── Beats ───────────────────────────────────────────────────── */

function PinnedBeat({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const cost = COSTS[index];
  const range = COSTS_RANGES[index];
  const slot = COSTS_ZIGZAG[index];
  const parts = beatParts(range, splitPhrases(cost.body).length);
  const timeline = useTransform(progress, (v) => revealAt(v, parts.timeline));
  const titleId = `${costAnchorId(index)}-title`;
  return (
    <Beat
      progress={progress}
      range={range}
      id={costAnchorId(index)}
      labelledBy={titleId}
      className={cx(s.beat, slot.text === "end" && s.textEnd)}
    >
      <Drift
        progress={progress}
        range={range}
        enter={[range[0], parts.title[1]]}
        drift={zigzagDrift(slot.text, "top")}
        className={s.beatText}
      >
        <Eyebrow scrub={{ progress, window: [parts.rule[0], parts.eyebrow[1]] }}>{cost.eyebrow}</Eyebrow>
        <ScrubItem progress={progress} window={parts.title} level="title" as="h3" id={titleId} className={s.beatTitle}>
          {cost.title}
        </ScrubItem>
        <RevealText text={cost.body} scrub={{ progress, window: parts.body }} className={s.beatBody} />
      </Drift>
      <Drift
        progress={progress}
        range={range}
        enter={parts.visual}
        drift={zigzagDrift(slot.visual, "bottom")}
        fade
        className={s.beatVisual}
      >
        <Visual index={index} t={timeline} />
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

function StagedBeat({ index, layout }: { index: number; layout: StoryLayout }) {
  const cost = COSTS[index];
  const titleId = `${costAnchorId(index)}-title`;
  return (
    <Stage
      as="article"
      id={costAnchorId(index)}
      className={cx(s.beat, COSTS_ZIGZAG[index].text === "end" && s.beatFlip)}
      tone={layout === "stacked" ? "fade" : "rise"}
      amount={0.35}
    >
      <div className={s.beatText}>
        <Eyebrow>{cost.eyebrow}</Eyebrow>
        <StageItem as="h3" level="title" id={titleId} className={s.beatTitle}>
          {cost.title}
        </StageItem>
        <RevealText text={cost.body} className={s.beatBody} />
      </div>
      <StageItem level="visual" className={s.beatVisual}>
        <PlayOnce index={index} play={layout === "staged"} />
      </StageItem>
    </Stage>
  );
}

/**
 * The picture's timeline outside the pinned layout: plays 0 to 1 once when
 * the picture is half in view (tablets), or sits at its end state (phones,
 * reduced motion, the server render).
 */
function PlayOnce({ index, play }: { index: number; play: boolean }) {
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
    const controls = animate(t, 1, { duration: 2.6, ease: [0.45, 0, 0.25, 1] });
    return () => controls.stop();
  }, [play, inView, t]);

  return (
    <div ref={ref} className={s.visualHost}>
      <Visual index={index} t={t} />
    </div>
  );
}

function Visual({ index, t }: { index: number; t: MotionValue<number> }) {
  const id = COSTS[index].id;
  return (
    <div className={s.frame} aria-hidden="true">
      {id === "fines" ? <FinesStrip t={t} /> : id === "doubt" ? <DoubtStack t={t} /> : <RetellingCards t={t} />}
    </div>
  );
}

/* ── Fines: dates pass "today", one unchecked ────────────────── */

function FinesStrip({ t }: { t: MotionValue<number> }) {
  const v = COSTS_VISUALS.fines;
  const x = useTransform(t, [0, 1], ["0%", `${-FINES_SHIFT * 100}%`]);
  return (
    <div className={s.fines}>
      <span className={s.today}>
        <span className={s.todayLabel}>{v.today}</span>
      </span>
      <motion.div className={s.strip} style={{ x }}>
        <span className={s.axis} />
        {v.dates.map((label, i) => (
          <FinesDate key={label} t={t} index={i} label={label} missed={i === v.dates.length - 1} />
        ))}
      </motion.div>
    </div>
  );
}

/** Class per date position; the scss places them at FINES_AT of the strip. */
const FINES_POS = ["0", "1", "2"] as const;

function FinesDate({ t, index, label, missed }: { t: MotionValue<number>; index: number; label: string; missed: boolean }) {
  const at = finesCross(index);
  const on = useTransform(t, [at, Math.min(1, at + 0.08)], [0, 1]);
  const scale = useTransform(t, [at, Math.min(1, at + 0.08)], [0.95, 1]);
  return (
    <span className={cx(s.date, s[`dateAt${FINES_POS[index]}`])}>
      <span className={s.dateLabel}>{label}</span>
      {missed ? (
        <>
          <motion.span className={s.dateWarn} style={{ opacity: on }} />
          <motion.span className={s.dateLate} style={{ opacity: on, scale }}>
            {COSTS_VISUALS.fines.late}
          </motion.span>
        </>
      ) : (
        <motion.span className={s.dateCheck} style={{ opacity: on, scale }}>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8.5l3.2 3L13 4.5" />
          </svg>
        </motion.span>
      )}
    </span>
  );
}

/* ── Doubt: three answers that do not line up ────────────────── */

const DOUBT_FROM = [
  { x: -72, rotate: -6 },
  { x: 72, rotate: 5 },
  { x: -48, rotate: -4 },
];
const DOUBT_TO = [
  { x: -28, rotate: -2 },
  { x: 24, rotate: 1.5 },
  { x: -8, rotate: -1 },
];

function DoubtStack({ t }: { t: MotionValue<number> }) {
  const guide = useTransform(t, [0.8, 1], [0, 1]);
  return (
    <div className={s.doubt}>
      <motion.span className={s.guide} style={{ opacity: guide }} />
      {COSTS_VISUALS.doubt.answers.map((a, i) => (
        <DoubtBubble key={a.who} t={t} index={i} who={a.who} says={a.says} />
      ))}
    </div>
  );
}

function DoubtBubble({ t, index, who, says }: { t: MotionValue<number>; index: number; who: string; says: string }) {
  const w: [number, number] = [0.05 + index * 0.25, 0.35 + index * 0.25];
  const opacity = useTransform(t, w, [0, 1]);
  const x = useTransform(t, w, [DOUBT_FROM[index].x, DOUBT_TO[index].x]);
  const y = useTransform(t, w, [16, 0]);
  const rotate = useTransform(t, w, [DOUBT_FROM[index].rotate, DOUBT_TO[index].rotate]);
  return (
    <motion.span className={s.bubble} style={{ opacity, x, y, rotate }}>
      <span className={s.bubbleWho}>{who}</span>
      <span className={s.bubbleSays}>{says}</span>
    </motion.span>
  );
}

/* ── Retelling: each new lawyer gets less ────────────────────── */

function RetellingCards({ t }: { t: MotionValue<number> }) {
  const v = COSTS_VISUALS.retelling;
  return (
    <div className={s.retelling}>
      <div className={cx(s.card, s.cardProfile)}>
        <span className={s.cardLabel}>{v.profile}</span>
        <ul className={s.cardLines}>
          {v.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
      {v.lines.map((_, k) => (
        <RetellCopy key={k} t={t} index={k} lines={v.lines.slice(0, v.lines.length - k)} />
      ))}
    </div>
  );
}

function RetellCopy({ t, index, lines }: { t: MotionValue<number>; index: number; lines: string[] }) {
  const start = 0.04 + index * 0.3;
  const opacity = useTransform(t, [start, start + 0.14], [0, 1]);
  const x = useTransform(t, [start, start + 0.14], [-20, 0]);
  const lost = useTransform(t, [start + 0.16, start + 0.28], [1, 0.14]);
  return (
    <motion.div className={cx(s.card, s.cardCopy, s[`copy${index}`])} style={{ opacity, x }}>
      <span className={s.cardLabel}>{COSTS_VISUALS.retelling.copy}</span>
      <ul className={s.cardLines}>
        {lines.map((line, i) =>
          i === lines.length - 1 ? (
            <motion.li key={line} className={s.lineLost} style={{ opacity: lost }}>
              {line}
            </motion.li>
          ) : (
            <li key={line}>{line}</li>
          ),
        )}
      </ul>
    </motion.div>
  );
}
