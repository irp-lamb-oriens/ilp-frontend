"use client";

/**
 * Plays a tutorial inline, inside a page section, with no sign-in and no
 * route matching. Built for marketing pages ("public" tutorials) but any
 * tutorial id works.
 *
 *   <TutorialEmbed tutorialId="public.check" stepIds={["answer", "results"]} caption="The free check, start to finish." />
 *
 * - Content loads lazily: nothing is fetched until the card comes near the
 *   viewport. With a TutorialProvider it uses the provider's loader (public
 *   tutorials come from their own small bundle); without one it loads the
 *   public tutorials directly.
 * - autoplay "in-view" (default) plays while at least a third of the card is
 *   on screen and pauses where it is when it leaves. "off" waits for the
 *   viewer to press Play.
 * - Steps play once each and move on to the next; the last one rests on its
 *   end state with Replay. A pause the viewer chose is kept.
 * - Reduced motion: the ScenePlayer shows each step's end state with
 *   numbered markers and the written explanations; nothing moves or advances.
 */
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cx } from "../ui/cx";
import { useTutorialOptional } from "./context";
import { ScenePlayer } from "./ScenePlayer";
import type { Tutorial } from "./types";
import { useReducedMotion } from "./useReducedMotion";
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

/** Share of the card that must be on screen to play. */
const PLAY_RATIO = 0.35;
/** Start loading this far before the card scrolls into view. */
const PRELOAD_MARGIN = "400px 0px";

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
  const inViewRef = useRef(false);
  inViewRef.current = inView;

  // Near the viewport: load. In view: play.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      setInView(true);
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
    const viewObs = new IntersectionObserver((entries) => {
      for (const e of entries) setInView(e.isIntersecting && e.intersectionRatio >= PLAY_RATIO);
    }, { threshold: [0, PLAY_RATIO, 0.6, 1] });
    nearObs.observe(el);
    viewObs.observe(el);
    return () => {
      nearObs.disconnect();
      viewObs.disconnect();
    };
  }, []);

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

  const onEnded = useCallback(() => {
    if (!inViewRef.current) return;
    setIdx((i) => (i < steps.length - 1 ? i + 1 : i));
  }, [steps.length]);

  if (failed) return null;

  const H = headingLevel === 2 ? "h2" : headingLevel === 4 ? "h4" : "h3";
  const active = started && inView;

  return (
    <figure ref={rootRef} className={cx(s.embed, className)} aria-labelledby={caption ? `${uid}-cap` : undefined} aria-label={caption ? undefined : tut?.title ?? "Demo"}>
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
          <div className={s.stage}>
            <ScenePlayer
              key={`${tut?.id}:${step.id}`}
              scene={step.scene}
              loops={many && !last ? 1 : 2}
              active={active}
              onEnded={many ? onEnded : undefined}
              explainList={explainList}
            />
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
            <div className={s.nav}>
              <button type="button" className={s.navBtn} onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>
                Previous step
              </button>
              <button type="button" className={s.navBtn} onClick={() => setIdx((i) => Math.min(steps.length - 1, i + 1))} disabled={last}>
                Next step
              </button>
              {last && (
                <button type="button" className={s.navBtn} onClick={() => setIdx(0)}>
                  Start over
                </button>
              )}
            </div>
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
