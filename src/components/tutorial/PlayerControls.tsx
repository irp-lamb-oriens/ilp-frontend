"use client";

/**
 * The tutorial player's controls, shared by the modal (TutorialModal) and
 * the inline embed (TutorialEmbed). Presentational: ScenePlayer owns the
 * state (playerState.ts) and passes it in.
 *
 * - PlayerControls: one bar under the scene. Icon buttons for previous
 *   action, play / pause, next action and replay, each with an accessible
 *   name and a CSS tooltip on hover and keyboard focus; an action scrubber
 *   (one segment per cursor action, filled as the demo plays, a radiogroup
 *   you can click or move along with the arrow keys); and the position line
 *   ("Action 2 of 5 · Step 1 of 3"). `compact` (the embed) shows play /
 *   pause, the scrubber and replay, and the rest on hover, on focus, or after
 *   "More controls" on touch screens. Reduced motion: no play button; "Show
 *   steps" walks through the actions one frame at a time.
 * - StepNav: previous / next step with labelled step segments.
 *
 * Control text never runs into the page copy: the bars are left out of text
 * selection and icon buttons carry their names in aria-label.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "../ui/cx";
import { IconArrowLeft, IconArrowRight, IconCheck, IconDensity, IconPause, IconPlay, IconReplay, IconSkipBack, IconSkipForward } from "../ui/icons";
import { actionLabel, positionText, stepLabel, type PlayMode } from "./playerState";
import s from "./PlayerControls.module.scss";

const LINEAR = "linear";

export interface PlayerControlsProps {
  /** What the bar shows (playerState.shownMode: an off-screen hold reads as playing). */
  mode: PlayMode;
  /** Reduced motion: no play button; "Show steps" and "Show the finished screen" instead. */
  reduced?: boolean;
  /** Name of each cursor action, in order (the scrubber segments). */
  actions: string[];
  /** Current action (playerState.actionPosition): -1 before the first, actions.length on the end frame. */
  position: number;
  /** Ms each action stays on screen while playing; fills the current segment. */
  durations?: number[];
  canPrev: boolean;
  canNext: boolean;
  onPlay: () => void;
  onPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReplay: () => void;
  onSeek: (index: number) => void;
  /** Reduced motion: step through the actions (seek to the first). */
  onShowSteps?: () => void;
  /** Reduced motion: back to the finished screen. */
  onShowAll?: () => void;
  /** The embed's minimal bar. */
  compact?: boolean;
  /** Adds "Step 1 of 3" to the position line. */
  step?: { index: number; count: number };
  /** The last frame of the whole demo: Replay stands out. */
  finale?: boolean;
  className?: string;
}

export function PlayerControls({
  mode,
  reduced = false,
  actions,
  position,
  durations,
  canPrev,
  canNext,
  onPlay,
  onPause,
  onPrev,
  onNext,
  onReplay,
  onSeek,
  onShowSteps,
  onShowAll,
  compact = false,
  step,
  finale = false,
  className,
}: PlayerControlsProps) {
  const [more, setMore] = useState(false);
  const n = actions.length;
  const ended = mode === "ended";
  const stepping = reduced && mode === "paused";
  const pos = positionText({ action: position, actions: n, step: step?.index, steps: step?.count });

  let main: ReactNode;
  if (reduced) {
    main = stepping ? (
      <TextButton icon={<IconReplay />} onClick={onShowAll}>
        Show the finished screen
      </TextButton>
    ) : (
      <TextButton icon={<IconSkipForward />} onClick={onShowSteps} primary>
        Show steps
      </TextButton>
    );
  } else if (ended) {
    main = finale || compact ? (
      <TextButton icon={<IconReplay />} onClick={onReplay} primary>
        Replay
      </TextButton>
    ) : (
      <IconButton label="Replay demo" onClick={onReplay}>
        <IconReplay />
      </IconButton>
    );
  } else {
    const playing = mode === "playing";
    main = (
      <IconButton label={playing ? "Pause demo" : "Play demo"} onClick={playing ? onPause : onPlay} strong>
        {playing ? <IconPause /> : <IconPlay />}
      </IconButton>
    );
  }

  const showSteppers = !reduced || stepping;
  return (
    <div className={cx(s.wrap, className)}>
    <div className={cx(s.bar, compact && s.compact, more && s.moreOpen)} role="group" aria-label="Demo controls" data-mode={mode}>
      <div className={s.buttons}>
        {showSteppers && (
          <IconButton label="Previous action" onClick={onPrev} disabled={!canPrev} extra={!reduced} tipAlign="start">
            <IconSkipBack />
          </IconButton>
        )}
        {main}
        {showSteppers && (
          <IconButton label="Next action" onClick={onNext} disabled={!canNext} extra={!reduced}>
            <IconSkipForward />
          </IconButton>
        )}
      </div>
      {n > 0 && (!reduced || stepping) && (
        <Scrubber actions={actions} position={position} durations={durations} playing={mode === "playing" && !reduced} ended={ended} onSeek={onSeek} />
      )}
      {pos && (
        <p className={s.pos} aria-live={mode === "paused" ? "polite" : "off"} aria-atomic="true">
          {reduced && !stepping ? (n === 1 ? "The action is numbered on the screen" : `All ${n} actions are numbered on the screen`) : pos}
        </p>
      )}
      <div className={s.end}>
        {!reduced && !ended && (
          <IconButton label="Replay from the start" onClick={onReplay} tipAlign={compact ? undefined : "end"}>
            <IconReplay />
          </IconButton>
        )}
        {compact && !reduced && (
          <button type="button" className={cx(s.icon, s.moreBtn)} aria-expanded={more} aria-label="More controls" data-tip={more ? "Fewer controls" : "More controls"} data-tip-align="end" onClick={() => setMore((v) => !v)}>
            <IconDensity />
          </button>
        )}
      </div>
    </div>
    </div>
  );
}

// ─── Buttons ────────────────────────────────────────────────────────────────

function IconButton({
  label,
  onClick,
  disabled,
  children,
  strong,
  extra,
  tipAlign,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
  /** The main (play / pause) button: filled. */
  strong?: boolean;
  /** Hidden in the compact bar until hover, focus or "More controls". */
  extra?: boolean;
  tipAlign?: "start" | "end";
}) {
  return (
    <button
      type="button"
      className={cx(s.icon, strong && s.strong, extra && s.extra)}
      aria-label={label}
      data-tip={label}
      data-tip-align={tipAlign}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function TextButton({ icon, children, onClick, primary }: { icon: ReactNode; children: ReactNode; onClick?: () => void; primary?: boolean }) {
  return (
    <button type="button" className={cx(s.text, primary && s.textPrimary)} onClick={onClick}>
      <span className={s.textIcon} aria-hidden="true">
        {icon}
      </span>
      <span>{children}</span>
    </button>
  );
}

// ─── Scrubber ───────────────────────────────────────────────────────────────

function Scrubber({
  actions,
  position,
  durations,
  playing,
  ended,
  onSeek,
}: {
  actions: string[];
  position: number;
  durations?: number[];
  playing: boolean;
  ended: boolean;
  onSeek: (index: number) => void;
}) {
  const n = actions.length;
  const fills = useRef<Array<HTMLSpanElement | null>>([]);
  const segs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusNext = useRef<number | null>(null);
  const current = Math.max(0, Math.min(n - 1, position));

  // Done segments full, later ones empty, the current one filling while it plays.
  useLayoutEffect(() => {
    const running: Animation[] = [];
    fills.current.forEach((el, k) => {
      if (!el) return;
      el.getAnimations?.().forEach((a) => a.cancel());
      const full = ended || k < position || (k === position && !playing);
      el.dataset.fill = full ? "full" : "empty";
      if (k === position && playing && !ended && typeof el.animate === "function") {
        const ms = Math.max(200, durations?.[k] ?? 2000);
        running.push(el.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: ms, easing: LINEAR, fill: "forwards" }));
      }
    });
    return () => running.forEach((a) => a.cancel());
  }, [position, playing, ended, durations, n]);

  // After an arrow key moves the selection, focus follows it.
  useEffect(() => {
    if (focusNext.current === null) return;
    segs.current[focusNext.current]?.focus();
    focusNext.current = null;
  });

  const go = (k: number) => {
    const to = Math.max(0, Math.min(n - 1, k));
    focusNext.current = to;
    onSeek(to);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = { ArrowLeft: current - 1, ArrowUp: current - 1, ArrowRight: current + 1, ArrowDown: current + 1, Home: 0, End: n - 1 };
    if (!(e.key in keys) || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    e.stopPropagation();
    go(keys[e.key]);
  };

  return (
    <div className={s.scrub} role="radiogroup" aria-label="Actions in this step" onKeyDown={onKey}>
      {actions.map((name, k) => {
        const on = k === position && !ended;
        return (
          <button
            key={k}
            ref={(el) => {
              segs.current[k] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={actionLabel(k, n, name)}
            data-tip={actionLabel(k, n, name)}
            data-tip-align={k === 0 ? "start" : k === n - 1 ? "end" : undefined}
            tabIndex={k === current ? 0 : -1}
            className={cx(s.seg, on && s.segOn)}
            onClick={() => go(k)}
          >
            <span className={s.track}>
              <span
                ref={(el) => {
                  fills.current[k] = el;
                }}
                className={s.fill}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Step navigation ────────────────────────────────────────────────────────

export interface StepNavProps {
  index: number;
  count: number;
  /** Step titles, for the screen-reader labels ("Step 2 of 4: Results"). */
  titles: string[];
  onPrev: () => void;
  onNext: () => void;
  /** Jump to a step from its segment. Without it the segments only show progress. */
  onGo?: (index: number) => void;
  /** Label of the next button on the last step ("Done", "Start over"). Without it the button is disabled there. */
  lastLabel?: string;
  /** The next button is the primary action (the modal). */
  primaryNext?: boolean;
  /**
   * Step actions (the modal's "Show me on this page"). They get their own row
   * above the step controls, never a cell inside them, so a long label can not
   * run into previous / next or the step segments at any width. In the DOM
   * they come before the controls: content, actions, then controls.
   */
  extra?: ReactNode;
  className?: string;
}

export function StepNav({ index, count, titles, onPrev, onNext, onGo, lastLabel, primaryNext = false, extra, className }: StepNavProps) {
  const uid = useId();
  const last = index >= count - 1;
  const nextLabel = last && lastLabel ? lastLabel : "Next step";
  return (
    <div className={cx(s.stepsWrap, className)}>
    {extra && (
      <div className={s.stepActions} data-region="step-actions">
        {extra}
      </div>
    )}
    <nav className={s.steps} aria-label="Steps" data-region="step-controls">
      <button type="button" className={s.stepBtn} onClick={onPrev} disabled={index === 0}>
        <IconArrowLeft />
        <span>Previous step</span>
      </button>
      <ol className={s.dots} aria-label={`Step ${index + 1} of ${count}`}>
        {titles.map((t, i) => {
          const label = stepLabel(i, count, t);
          const state = cx(s.dot, i === index && s.dotOn, i < index && s.dotDone);
          return (
            <li key={`${uid}-${i}`} className={s.dotItem} aria-current={i === index ? "step" : undefined}>
              {onGo ? (
                <button type="button" className={s.dotBtn} aria-label={label} data-tip={label} onClick={() => onGo(i)}>
                  <span className={state} />
                </button>
              ) : (
                <>
                  <span className={state} aria-hidden="true" />
                  <span className={s.sr}>{label}</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
      <div className={s.stepEnd}>
        <button type="button" className={cx(s.stepBtn, primaryNext && s.stepPrimary)} onClick={onNext} disabled={last && !lastLabel} data-autofocus={primaryNext ? "" : undefined}>
          <span>{nextLabel}</span>
          {last && lastLabel === "Start over" ? <IconReplay /> : last && lastLabel ? <IconCheck /> : <IconArrowRight />}
        </button>
      </div>
    </nav>
    </div>
  );
}

export default PlayerControls;
