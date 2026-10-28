"use client";

/**
 * Plays a tutorial inline, inside a page section, with no sign-in and no
 * route matching. Built for marketing pages ("public" tutorials) but any
 * tutorial id works.
 *
 *   <TutorialEmbed tutorialId="public.check" stepIds={["answer", "results"]} caption="The free check, start to finish." />
 *
 * - Content loads lazily: nothing is fetched until the card is within about
 *   one viewport of the screen. With a TutorialProvider it uses the
 *   provider's loader (public tutorials come from their own small bundle);
 *   without one it loads the public tutorials directly. Loading never starts
 *   playback: until the scene is in view it shows its first frame, cursor at
 *   rest.
 * - autoplay "in-view" (default) starts at step 1, action 1 once 40% of the
 *   scene is on screen, pauses where it is below 15% or when the browser tab
 *   is hidden, and resumes from the same action (viewport.ts). Every embed
 *   has its own gate and player, so one in view never starts another. "off"
 *   waits for the viewer to press Play (then the same in-view rule applies).
 * - Steps play once each and move on to the next; the last one plays once and
 *   rests on its end state with a prominent Replay, and the step navigation
 *   offers Start over. No endless loop. A pause the viewer chose is kept; a
 *   hold because the demo left the screen shows nothing extra.
 * - Controls: a compact bar under the scene (play / pause, the action
 *   scrubber, replay); previous / next action appear on hover, on focus, or
 *   after "More controls" on touch screens. Under it, StepNav: previous /
 *   next step and labelled step segments that jump to a step.
 * - Keys, while focus is inside the embed (never page-wide): ← / → step
 *   between actions while paused, else between steps; Enter on the demo
 *   screen goes to the next step.
 * - Reduced motion: the ScenePlayer shows each step's end state with
 *   numbered markers and the written explanations; nothing moves or advances.
 */
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "../ui/cx";
import { useTutorialOptional } from "./context";
import { StepNav } from "./PlayerControls";
import { ScenePlayer } from "./ScenePlayer";
import type { Tutorial } from "./types";
import { useReducedMotion } from "./useReducedMotion";
import { createViewGate, PRELOAD_MARGIN, VIEW_THRESHOLDS, visibleShare } from "./viewport";
import s from "./TutorialEmbed.module.scss";

export type EmbedAutoplay = "in-view" | "off";

export interface TutorialEmbedProps {
  tutorialId: string;
  /** Only these steps, in this order. Default: every step. */
  stepIds?: string[];
  /** Default "in-view". */
  autoplay?: EmbedAutoplay;
  /** Visible caption under the demo (figcaption). */
  caption?: ReactNode;
  /** Show the step title and body above the scene. Default true. */
  showStepText?: boolean;
  /** Step title heading level. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** Show the "What happens here" list under the scene. Default true. */
  explainList?: boolean;
  /** Give the tutorial directly (gallery, tests) instead of loading it. */
  tutorial?: Tutorial;
  /** Or a custom loader. */
  load?: () => Promise<Tutorial | undefined>;
  className?: string;
}

const loadPublicDirect = (id: string) => import("../../tutorials/public").then((m) => m.PUBLIC_TUTORIALS.find((t) => t.id === id));

export function TutorialEmbed({
  tutorialId,
  stepIds,
  autoplay = "in-view",
  caption,
  showStepText = true,
  headingLevel = 3,
  explainList = true,
  tutorial: given,
  load,
  className,
}: TutorialEmbedProps) {
  const ctx = useTutorialOptional();
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const uid = useId();
  const [near, setNear] = useState(false);
  const [inView, setInView] = useState(false);
  const [tut, setTut] = useState<Tutorial | null>(given ?? null);
  const [failed, setFailed] = useState(false);
  const [idx, setIdx] = useState(0);
  const [started, setStarted] = useState(autoplay === "in-view");
  /** The scene box: what must be on screen to play (set once the tutorial has loaded). */
  const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null);
  /** This embed's own play gate (no state shared with other embeds). */
  const gateRef = useRef(createViewGate());

  // Within about a viewport of the screen: load. Nothing plays yet.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const nearObs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          nearObs.disconnect();
        }
      },
      { rootMargin: PRELOAD_MARGIN },
    );
    nearObs.observe(el);
    return () => nearObs.disconnect();
  }, []);

  // The scene in view (40% to start, under 15% to pause) and the tab visible: play.
  useEffect(() => {
    if (!stageEl) return;
    const gate = gateRef.current;
    const docVisible = () => typeof document === "undefined" || document.visibilityState !== "hidden";
    const apply = (share: number) => setInView(gate.update(share, docVisible()));
    const onVisibility = () => apply(gate.share);
    document.addEventListener("visibilitychange", onVisibility);
    if (typeof IntersectionObserver === "undefined") {
      apply(1);
      return () => document.removeEventListener("visibilitychange", onVisibility);
    }
    const viewObs = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        if (!e) return;
        const vh = e.rootBounds?.height ?? window.innerHeight;
        apply(e.isIntersecting ? visibleShare(e.intersectionRect.height, e.boundingClientRect.height, vh) : 0);
      },
      { threshold: VIEW_THRESHOLDS },
    );
    viewObs.observe(stageEl);
    return () => {
      viewObs.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [stageEl]);

  useEffect(() => {
    if (given) {
      setTut(given);
      return;
    }
    if (!near) return;
    let off = false;
    const loader = load ?? (ctx ? () => ctx.loadTutorial(tutorialId) : () => loadPublicDirect(tutorialId));
    loader()
      .then((t) => {
        if (off) return;
        if (t) setTut(t);
        else setFailed(true);
      })
      .catch(() => {
        if (!off) setFailed(true);
      });
    return () => {
      off = true;
    };
    // ctx changes on every provider render; the loader only needs to run once per id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near, tutorialId, given, load]);

  const steps = tut ? (stepIds?.length ? stepIds.map((id) => tut.steps.find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => !!x) : tut.steps) : [];
  const step = steps[Math.min(idx, Math.max(0, steps.length - 1))];
  const many = steps.length > 1;
  const last = idx >= steps.length - 1;

  // A step only ends while it plays (in view), so the next one starts here;
  // were the card to leave at that instant, the next step just waits on its first frame.
  const onEnded = useCallback(() => {
    setIdx((i) => (i < steps.length - 1 ? i + 1 : i));
  }, [steps.length]);

  const go = useCallback((i: number) => setIdx(Math.max(0, Math.min(steps.length - 1, i))), [steps.length]);

  // Keys only while focus is inside this embed. The player takes ← / → first
  // while paused (actions); what it leaves moves between steps.
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || !many) return;
    const el = e.target as HTMLElement | null;
    if (el?.closest?.("input, textarea, select, [role='radiogroup']")) return;
    if (e.key === "ArrowRight" && !last) {
      e.preventDefault();
      go(idx + 1);
    } else if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      go(idx - 1);
    } else if (e.key === "Enter" && el?.dataset.demoScreen !== undefined) {
      e.preventDefault();
      go(last ? 0 : idx + 1);
    }
  };

  if (failed) return null;

  const H = headingLevel === 2 ? "h2" : headingLevel === 4 ? "h4" : "h3";
  const active = started && inView;

  return (
    <figure
      ref={rootRef}
      className={cx(s.embed, className)}
      aria-labelledby={caption ? `${uid}-cap` : undefined}
      aria-label={caption ? undefined : tut?.title ?? "Demo"}
      onKeyDown={onKey}
    >
      {step ? (
        <>
          {showStepText && (
            <div className={s.text} aria-live="polite">
              {many && (
                <p className={s.count}>
                  Step {idx + 1} of {steps.length}
                </p>
              )}
              <H className={s.title}>{step.title}</H>
              <p className={s.body}>{step.body}</p>
            </div>
          )}
          <div ref={setStageEl} className={s.stage}>
            <ScenePlayer
              key={`${tut?.id}:${step.id}`}
              scene={step.scene}
              loops={1}
              active={active}
              onEnded={many ? onEnded : undefined}
              explainList={explainList}
              controls="compact"
              step={many ? { index: idx, count: steps.length } : undefined}
              finale={last}
              label={`Demo screen: ${step.title}`}
              describedBy={`${uid}-keys`}
            />
            <span id={`${uid}-keys`} className={s.sr}>
              {many ? "Left and right arrow keys move between actions while paused, otherwise between steps. Enter goes to the next step." : "Left and right arrow keys move between actions while paused."}
            </span>
            {!started && !reduced && (
              <div className={s.cover}>
                <button type="button" className={s.play} onClick={() => setStarted(true)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
                  </svg>
                  Play the demo
                </button>
              </div>
            )}
          </div>
          {many && (
            <StepNav
              index={idx}
              count={steps.length}
              titles={steps.map((x) => x.title)}
              onPrev={() => go(idx - 1)}
              onNext={() => go(last ? 0 : idx + 1)}
              onGo={go}
              lastLabel="Start over"
            />
          )}
        </>
      ) : (
        <div className={s.placeholder} aria-busy="true">
          <span className={s.sr}>Loading the demo</span>
        </div>
      )}
      {caption && (
        <figcaption id={`${uid}-cap`} className={s.caption}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export default TutorialEmbed;
