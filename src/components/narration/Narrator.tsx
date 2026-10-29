"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { scrollPageTo } from "@/components/SmoothScroll";
import { track } from "@/lib/journey";
import { NARRATION, cueUrl, type NarrationCue, type NarrationPage } from "@/lib/narration/scripts";
import { aboutMinutes, captionIndexAt, captionSegments } from "@/lib/narration/timing";
import { initialNarratorState, narratorReducer, type NarratorEvent, type NarratorState } from "@/lib/narration/machine";
import { DRIVE_SETTLE_S, isUserScrollIntent, throughRange, throughY } from "@/lib/narration/scroll";
import { markOfferSeen, offerSeen } from "@/lib/narration/session";
import { NARRATOR_COPY as C, NARRATOR_TITLE } from "./content";
import s from "./Narrator.module.scss";

/**
 * Landing narrator: a first-visit overlay that offers a narrated walk through
 * the page, a slim player bar, captions and a small "Play narration" button
 * to start it again.
 *
 * The overlay renders only after mount (the server HTML and crawlers get the
 * plain page) and is answered once per session per landing. Nothing plays
 * until the visitor presses Start. Each cue plays its clip (one audio
 * element, the next clip preloaded) and scrolls to its section: "jump"
 * once, eased; "through" drives the page across a pinned story's scroll
 * range while the clip plays, so the beats move with the voice. A wheel,
 * touch drag or scroll key outside the player pauses audio and auto-scroll;
 * Resume continues the same cue from where it stopped. With reduced motion
 * every cue jumps, without smooth scroll. A missing clip falls back to
 * caption-only timing from its word count (lib/narration/timing.ts).
 */

type AudioState = "unknown" | "available" | "missing";

/** Timed clock: seconds banked before the last start, and when it started (0: stopped). */
type Clock = MutableRefObject<{ banked: number; since: number }>;

function startClock(clock: Clock, from = 0) {
  clock.current = { banked: from, since: performance.now() };
}

function stopClock(clock: Clock) {
  const c = clock.current;
  if (c.since) clock.current = { banked: c.banked + (performance.now() - c.since) / 1000, since: 0 };
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Page y of a section, respecting its scroll-margin-top. */
function sectionTop(el: HTMLElement): number {
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  return Math.round(el.getBoundingClientRect().top + window.scrollY - margin);
}

/** Where cue `c` wants the page at `time` s into a clip of `duration` s (null: no anchor). */
function cueY(c: NarrationCue, time: number, duration: number, reduce: boolean): number | null {
  const el = document.getElementById(c.anchor);
  if (!el) return null;
  if (c.scroll === "jump" || reduce) return Math.max(0, sectionTop(el));
  const r = el.getBoundingClientRect();
  const range = throughRange({ top: r.top + window.scrollY, height: el.offsetHeight, viewport: window.innerHeight, startAt: c.startAt });
  return throughY(range, time, duration);
}

/** Load a clip's metadata; resolves its duration (s), or null when it cannot load. */
function probeDuration(url: string, timeoutMs = 4000): Promise<number | null> {
  return new Promise((resolve) => {
    const a = new Audio();
    let done = false;
    const finish = (v: number | null) => {
      if (done) return;
      done = true;
      a.removeAttribute("src");
      resolve(v);
    };
    a.preload = "metadata";
    a.addEventListener("loadedmetadata", () => finish(Number.isFinite(a.duration) ? a.duration : null));
    a.addEventListener("error", () => finish(null));
    window.setTimeout(() => finish(null), timeoutMs);
    a.src = url;
  });
}

export default function Narrator({ page }: { page: NarrationPage }) {
  const cues = NARRATION[page];
  const count = cues.length;
  const [state, dispatch] = useReducer((st: NarratorState, e: NarratorEvent) => narratorReducer(st, e, count), initialNarratorState);

  const [mounted, setMounted] = useState(false);
  const [offer, setOffer] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>("unknown");
  const [durations, setDurations] = useState<(number | null)[]>(() => cues.map(() => null));
  const [progress, setProgress] = useState(0);
  const [timedNote, setTimedNote] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const startRef = useRef<HTMLButtonElement | null>(null);
  const playRef = useRef<HTMLButtonElement | null>(null);
  /** Per-cue playback mode for the cue that is playing. */
  const modeRef = useRef<"audio" | "timed">("audio");
  const clockRef = useRef({ banked: 0, since: 0 });
  const missingRef = useRef<Set<number>>(new Set());
  const audioWorkedRef = useRef(false);
  const audioStateRef = useRef<AudioState>("unknown");
  const lastEpochRef = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  /* ── Mount: offer the overlay once per session ─────────────── */
  useEffect(() => {
    setMounted(true);
    if (!offerSeen(page)) setOffer(true);
  }, [page]);

  /* ── Probe the clips: real durations, or caption-only mode ─── */
  useEffect(() => {
    if (!offer || audioStateRef.current !== "unknown") return;
    let cancelled = false;
    (async () => {
      const first = await probeDuration(cueUrl(page, cues[0]));
      if (cancelled) return;
      if (first === null) {
        audioStateRef.current = "missing";
        setAudioState("missing");
        return;
      }
      const rest = await Promise.all(cues.slice(1).map((c) => probeDuration(cueUrl(page, c))));
      if (cancelled) return;
      const all = [first, ...rest];
      all.forEach((d, i) => d === null && missingRef.current.add(i));
      setDurations(all);
      audioStateRef.current = "available";
      setAudioState("available");
    })();
    return () => {
      cancelled = true;
    };
  }, [offer, page, cues]);

  const totalSeconds = useMemo(() => cues.reduce((sum, c, i) => sum + (durations[i] ?? c.estimate), 0), [cues, durations]);

  /** Length (s) of cue i in its current mode. */
  const cueDuration = useCallback(
    (i: number) => {
      const a = audioRef.current;
      if (modeRef.current === "audio" && a && Number.isFinite(a.duration) && a.duration > 0) return a.duration;
      return durations[i] ?? cues[i].estimate;
    },
    [cues, durations],
  );

  /** Seconds into the current cue. */
  const cueTime = useCallback(() => {
    if (modeRef.current === "audio" && audioRef.current) return audioRef.current.currentTime;
    const c = clockRef.current;
    return c.banked + (c.since ? (performance.now() - c.since) / 1000 : 0);
  }, []);

  /** Switch the current cue to caption-only timing (its clip did not load). */
  const fallBackToTimed = useCallback((index: number) => {
    if (modeRef.current === "timed") return;
    missingRef.current.add(index);
    if (!audioWorkedRef.current) {
      audioStateRef.current = "missing";
      setAudioState("missing");
    }
    modeRef.current = "timed";
    setTimedNote(true);
    if (stateRef.current.status === "playing") startClock(clockRef, 0);
    else clockRef.current = { banked: 0, since: 0 };
  }, []);

  /* ── One audio element for the whole run ───────────────────── */
  useEffect(() => {
    if (!mounted) return;
    const a = new Audio();
    a.preload = "auto";
    audioRef.current = a;
    const pre = new Audio();
    pre.preload = "auto";
    preloadRef.current = pre;
    const onEnded = () => {
      if (modeRef.current === "audio") dispatch({ type: "cue-end" });
    };
    const onError = () => {
      const st = stateRef.current;
      if ((st.status === "playing" || st.status === "paused") && modeRef.current === "audio" && a.getAttribute("src")) fallBackToTimed(st.index);
    };
    const onPlaying = () => {
      audioWorkedRef.current = true;
    };
    a.addEventListener("ended", onEnded);
    a.addEventListener("error", onError);
    a.addEventListener("playing", onPlaying);
    return () => {
      a.pause();
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("error", onError);
      a.removeEventListener("playing", onPlaying);
      a.removeAttribute("src");
      pre.removeAttribute("src");
      audioRef.current = null;
      preloadRef.current = null;
    };
  }, [mounted, dispatch, fallBackToTimed]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = state.muted;
  }, [state.muted]);

  /* ── Cue start, pause and resume ───────────────────────────── */
  useEffect(() => {
    const a = audioRef.current;
    const reduce = reducedMotion();
    const c = cues[state.index];

    if (state.status === "idle" || state.status === "done") {
      a?.pause();
      stopClock(clockRef);
      setProgress(0);
      return;
    }

    if (state.epoch !== lastEpochRef.current) {
      // A new cue (or the same cue again): reset, scroll to its start, play.
      lastEpochRef.current = state.epoch;
      setProgress(0);
      const timed = audioStateRef.current === "missing" || missingRef.current.has(state.index);
      modeRef.current = timed ? "timed" : "audio";
      setTimedNote(timed);
      const y = cueY(c, 0, c.estimate, reduce);
      if (y !== null) scrollPageTo(y, !reduce);
      clockRef.current = { banked: 0, since: 0 };
      if (timed) {
        a?.pause();
        if (state.status === "playing") startClock(clockRef, 0);
      } else if (a) {
        a.src = cueUrl(page, c);
        a.currentTime = 0;
        if (state.status === "playing") a.play().catch(() => fallBackToTimed(state.index));
      }
      // Preload the next clip while this one plays.
      const next = cues[state.index + 1];
      const pre = preloadRef.current;
      if (pre && next && !timed && !missingRef.current.has(state.index + 1)) pre.src = cueUrl(page, next);
      return;
    }

    if (state.status === "paused") {
      if (modeRef.current === "audio") a?.pause();
      else stopClock(clockRef);
      return;
    }

    // Resume: put the page back where the cue is, then continue.
    const y = cueY(c, cueTime(), cueDuration(state.index), reduce);
    if (y !== null) scrollPageTo(y, !reduce);
    if (modeRef.current === "audio" && a) a.play().catch(() => fallBackToTimed(state.index));
    else startClock(clockRef, clockRef.current.banked);
    // cueTime/cueDuration read refs; the effect runs on status and epoch changes only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, state.epoch]);

  /* ── Frame loop: progress, timed cue end, "through" drive ──── */
  useEffect(() => {
    if (state.status !== "playing") return;
    const c = cues[state.index];
    const reduce = reducedMotion();
    let raf = 0;
    let shown = -1;
    const tick = () => {
      const t = cueTime();
      const d = cueDuration(state.index);
      const p = d > 0 ? Math.min(1, t / d) : 1;
      if (Math.abs(p - shown) > 0.004) {
        shown = p;
        setProgress(p);
      }
      if (c.scroll === "through" && !reduce && t >= DRIVE_SETTLE_S) {
        const y = cueY(c, t, d, reduce);
        if (y !== null) scrollPageTo(y, false);
      }
      if (modeRef.current === "timed" && t >= d) {
        dispatch({ type: "cue-end" });
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state.status, state.epoch, state.index, cues, cueTime, cueDuration, dispatch]);

  /* ── The visitor scrolls: pause ────────────────────────────── */
  useEffect(() => {
    if (state.status !== "playing") return;
    const onInput = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const insidePlayer = !!(target && barRef.current?.contains(target));
      const editable = !!target?.closest?.("input, textarea, select, [contenteditable='true']");
      const key = e instanceof KeyboardEvent ? e.key : undefined;
      if (isUserScrollIntent({ type: e.type, key, insidePlayer, editable })) dispatch({ type: "user-scroll" });
    };
    const opts = { passive: true } as const;
    window.addEventListener("wheel", onInput, opts);
    window.addEventListener("touchmove", onInput, opts);
    window.addEventListener("keydown", onInput);
    return () => {
      window.removeEventListener("wheel", onInput);
      window.removeEventListener("touchmove", onInput);
      window.removeEventListener("keydown", onInput);
    };
  }, [state.status, dispatch]);

  /* ── Analytics ─────────────────────────────────────────────── */
  const prevStatus = useRef(state.status);
  useEffect(() => {
    if (prevStatus.current !== "done" && state.status === "done") track.click(`narration.complete.${page}`);
    prevStatus.current = state.status;
  }, [state.status, page]);

  /* ── Actions ───────────────────────────────────────────────── */
  const start = () => {
    markOfferSeen(page);
    setOffer(false);
    track.click(`narration.start.${page}`);
    dispatch({ type: "start" });
  };
  const readInstead = () => {
    markOfferSeen(page);
    setOffer(false);
    track.click(`narration.read.${page}`);
  };
  const exit = () => {
    track.click(`narration.exit.${page}.${cues[state.index].id}`);
    dispatch({ type: "exit" });
  };

  // Focus: the primary button when the overlay opens, play/pause once playing.
  useEffect(() => {
    if (offer) startRef.current?.focus();
  }, [offer]);
  const active = state.status === "playing" || state.status === "paused";
  useEffect(() => {
    if (active) playRef.current?.focus({ preventScroll: true });
  }, [active]);

  const onOverlayKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      readInstead();
      return;
    }
    if (e.key !== "Tab") return;
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("button"));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!mounted) return null;

  const cue = cues[state.index];
  const segments = captionSegments(cue.read);
  const caption = segments[captionIndexAt(segments, progress)]?.text ?? "";
  const about = aboutMinutes(totalSeconds);
  const playing = state.status === "playing";

  return (
    <>
      {offer && (
        <div className={s.overlay} role="dialog" aria-modal="true" aria-labelledby={`narrator-title-${page}`} aria-describedby={`narrator-line-${page}`} onKeyDown={onOverlayKey}>
          <div className={s.overlayInner}>
            <h2 id={`narrator-title-${page}`} className={s.overlayTitle}>
              {NARRATOR_TITLE[page]}
            </h2>
            <p id={`narrator-line-${page}`} className={s.overlayLine}>
              {audioState === "missing" ? C.withCaptions(about) : C.withSound(about)}
            </p>
            <button ref={startRef} type="button" className={s.start} onClick={start}>
              {C.start}
            </button>
            <button type="button" className={s.readInstead} onClick={readInstead}>
              {C.read}
            </button>
          </div>
        </div>
      )}

      {!offer && !active && (
        <button
          type="button"
          className={s.launcher}
          onClick={() => {
            track.click(`narration.start.${page}`);
            dispatch({ type: "start" });
          }}
        >
          <PlayIcon />
          <span>{C.launcher}</span>
        </button>
      )}

      {active && (
        <div ref={barRef} className={s.player} role="region" aria-label={C.player}>
          {state.captions && (
            <p key={`${state.epoch}-${caption}`} className={s.caption} aria-live={playing ? "polite" : "off"}>
              {caption}
            </p>
          )}
          <div className={s.bar}>
            <div className={s.controls}>
              {state.pausedBy === "user-scroll" ? (
                <button ref={playRef} type="button" className={s.resume} onClick={() => dispatch({ type: "resume" })}>
                  <PlayIcon />
                  <span>{C.resume}</span>
                </button>
              ) : (
                <button ref={playRef} type="button" className={s.icon} aria-label={playing ? C.pause : C.play} onClick={() => dispatch({ type: "toggle" })}>
                  {playing ? <PauseIcon /> : <PlayIcon />}
                </button>
              )}
              <button type="button" className={s.icon} aria-label={C.prev} onClick={() => dispatch({ type: "prev" })}>
                <PrevIcon />
              </button>
              <button type="button" className={s.icon} aria-label={C.next} onClick={() => dispatch({ type: "next" })}>
                <NextIcon />
              </button>
            </div>

            <div className={s.where}>
              <p className={s.section}>
                {C.progress(state.index + 1, count, cue.section)}
                {state.pausedBy === "user-scroll" && <span className={s.note}> {C.pausedByScroll}</span>}
                {timedNote && <span className={s.note}> {C.audioSoon}</span>}
              </p>
              <ol className={s.segments} aria-hidden="true">
                {cues.map((c, i) => (
                  <li key={c.id} className={s.segment}>
                    <span className={s.segmentFill} style={{ "--fill": i < state.index ? 1 : i === state.index ? progress : 0 } as CSSProperties} />
                  </li>
                ))}
              </ol>
            </div>

            <div className={s.controls}>
              <button
                type="button"
                className={s.icon}
                aria-label={state.muted ? C.unmute : C.mute}
                aria-pressed={state.muted}
                disabled={timedNote}
                onClick={() => dispatch({ type: "toggle-mute" })}
              >
                {state.muted ? <MutedIcon /> : <SoundIcon />}
              </button>
              <button
                type="button"
                className={s.cc}
                aria-label={state.captions ? C.captionsOff : C.captionsOn}
                aria-pressed={state.captions}
                onClick={() => dispatch({ type: "toggle-captions" })}
              >
                CC
              </button>
              <button type="button" className={s.exit} aria-label={C.exitLabel} onClick={exit}>
                {C.exit}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Icons (outline, 20px, currentColor) ───────────────────── */

const Svg = ({ children }: { children: ReactNode }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {children}
  </svg>
);
const PlayIcon = () => (
  <Svg>
    <path d="M6 4.5v11l9-5.5z" />
  </Svg>
);
const PauseIcon = () => (
  <Svg>
    <path d="M7 4.5v11M13 4.5v11" />
  </Svg>
);
const PrevIcon = () => (
  <Svg>
    <path d="M5 4.5v11M15 4.5 8 10l7 5.5z" />
  </Svg>
);
const NextIcon = () => (
  <Svg>
    <path d="M15 4.5v11M5 4.5l7 5.5-7 5.5z" />
  </Svg>
);
const SoundIcon = () => (
  <Svg>
    <path d="M3.5 8v4h3l4 3.5v-11l-4 3.5zM13.5 7.5a3.5 3.5 0 0 1 0 5M15.5 5.5a6.5 6.5 0 0 1 0 9" />
  </Svg>
);
const MutedIcon = () => (
  <Svg>
    <path d="M3.5 8v4h3l4 3.5v-11l-4 3.5zM13.5 8l4 4M17.5 8l-4 4" />
  </Svg>
);
