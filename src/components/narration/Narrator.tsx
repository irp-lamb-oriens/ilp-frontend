"use client";

import {
  useCallback,
  useEffect,
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
import { NARRATION, type NarrationPage } from "@/lib/narration/scripts";
import { aboutMinutes, cueIndexAt, cueProgress, cumulativeStarts } from "@/lib/narration/timing";
import { cueStartsFromTranscript, fillCueStarts } from "@/lib/narration/transcript";
import { initialNarratorState, narratorReducer, type NarratorEvent, type NarratorState } from "@/lib/narration/machine";
import { isUserScrollIntent } from "@/lib/narration/scroll";
import { resumeGraph, voiceGraph, type VoiceGraph } from "@/lib/narration/audioGraph";
import { speechLevel } from "@/lib/narration/wave";
import VoiceWave from "./VoiceWave";
import { markOfferSeen, offerSeen } from "@/lib/narration/session";
import { NARRATOR_COPY as C, NARRATOR_TITLE } from "./content";
import s from "./Narrator.module.scss";

/**
 * Landing narrator: a first-visit overlay that offers a narrated walk through
 * the page, a slim player bar, captions and a small "Play narration" button
 * to start it again.
 *
 * One audio file per landing (public/narration/<page>.mp3) and its Whisper
 * transcript (<page>.json). The transcript gives the time each cue's opening
 * words are spoken (lib/narration/transcript.ts); when the audio reaches
 * that time, the page scrolls to the cue's section, eased (instant with
 * reduced motion). The sections' own animations play as they enter the
 * viewport. Previous and next seek to a cue's start. A wheel, touch drag or
 * scroll key outside the player pauses the audio; Resume continues from the
 * same moment and returns to the cue's section.
 *
 * The voice wave (VoiceWave.tsx) sits in the player bar and is also the
 * play/pause control. Its analyser is created only from the click on Start
 * (lib/narration/audioGraph.ts). While the bar is up, its height is
 * published as --narrator-reserve so pinned stories keep their text above it.
 *
 * The overlay renders only after mount (the server HTML and crawlers get the
 * plain page) and is answered once per session per landing. Nothing plays
 * until the visitor presses Start. Without the audio, the narrator runs
 * caption-only, timed from the script (lib/narration/timing.ts); with the
 * audio but no transcript, cue times are shared out over the audio's length.
 */

type AudioState = "unknown" | "available" | "missing";

/** Timed clock: seconds banked before the last start, and when it started (0: stopped). */
type Clock = MutableRefObject<{ banked: number; since: number }>;

function startClock(clock: Clock, from: number) {
  clock.current = { banked: from, since: performance.now() };
}

function stopClock(clock: Clock) {
  const c = clock.current;
  if (c.since) clock.current = { banked: c.banked + (performance.now() - c.since) / 1000, since: 0 };
}

const clockTime = (clock: Clock) => clock.current.banked + (clock.current.since ? (performance.now() - clock.current.since) / 1000 : 0);

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Scroll to a section by id, respecting its scroll-margin-top. */
function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  const reduce = reducedMotion();
  scrollPageTo(Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY - margin)), !reduce);
}

/** Load an audio file's metadata; resolves its duration (s), or null when it cannot load. */
function probeDuration(url: string, timeoutMs = 5000): Promise<number | null> {
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
    a.addEventListener("loadedmetadata", () => finish(Number.isFinite(a.duration) && a.duration > 0 ? a.duration : null));
    a.addEventListener("error", () => finish(null));
    window.setTimeout(() => finish(null), timeoutMs);
    a.src = url;
  });
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { cache: "no-cache" });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export default function Narrator({ page }: { page: NarrationPage }) {
  const script = NARRATION[page];
  const cues = script.cues;
  const count = cues.length;
  const [state, dispatch] = useReducer((st: NarratorState, e: NarratorEvent) => narratorReducer(st, e, count), initialNarratorState);

  const estimates = cues.map((c) => c.estimate);
  const estimateTotal = estimates.reduce((sum, v) => sum + v, 0);

  const [mounted, setMounted] = useState(false);
  const [offer, setOffer] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>("unknown");
  const [total, setTotal] = useState(estimateTotal);
  const [now, setNow] = useState(0);
  const [timed, setTimed] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<VoiceGraph | null>(null);
  const startRef = useRef<HTMLButtonElement | null>(null);
  const playRef = useRef<HTMLButtonElement | null>(null);
  const modeRef = useRef<"audio" | "timed">("audio");
  const clockRef = useRef({ banked: 0, since: 0 });
  const startsRef = useRef<number[]>(cumulativeStarts(estimates));
  const totalRef = useRef(estimateTotal);
  const audioStateRef = useRef<AudioState>("unknown");
  const audioWorkedRef = useRef(false);
  const loadRef = useRef<Promise<void> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  /* ── Timeline: audio length and cue times, or caption-only ─── */
  const load = useCallback(() => {
    if (loadRef.current) return loadRef.current;
    const weights = cues.map((c) => c.estimate);
    loadRef.current = (async () => {
      const [duration, json] = await Promise.all([probeDuration(script.audio), fetchJson(script.transcript)]);
      if (audioStateRef.current === "missing") return; // playback already fell back
      if (duration === null) {
        audioStateRef.current = "missing";
        setAudioState("missing");
        return;
      }
      const matches = cues.map((c) => c.match);
      startsRef.current = json
        ? cueStartsFromTranscript(json, matches, weights, duration).starts
        : fillCueStarts(cues.map((_, i) => (i === 0 ? 0 : null)), weights, duration);
      totalRef.current = duration;
      setTotal(duration);
      audioStateRef.current = "available";
      setAudioState("available");
    })();
    return loadRef.current;
  }, [cues, script.audio, script.transcript]);

  /** Seconds into the landing's narration. */
  const time = useCallback(() => (modeRef.current === "audio" && audioRef.current ? audioRef.current.currentTime : clockTime(clockRef)), []);

  /** Switch to caption-only timing (the audio did not load or play). */
  const fallBackToTimed = useCallback(() => {
    if (modeRef.current === "timed") return;
    modeRef.current = "timed";
    setTimed(true);
    audioRef.current?.pause();
    if (!audioWorkedRef.current) {
      audioStateRef.current = "missing";
      setAudioState("missing");
    }
    const weights = cues.map((c) => c.estimate);
    startsRef.current = cumulativeStarts(weights);
    totalRef.current = weights.reduce((sum, v) => sum + v, 0);
    setTotal(totalRef.current);
    const from = startsRef.current[stateRef.current.index] ?? 0;
    if (stateRef.current.status === "playing") startClock(clockRef, from);
    else clockRef.current = { banked: from, since: 0 };
  }, [cues]);

  /* ── Mount: offer the overlay once per session ─────────────── */
  useEffect(() => {
    setMounted(true);
    if (!offerSeen(page)) setOffer(true);
  }, [page]);

  useEffect(() => {
    if (offer) void load();
  }, [offer, load]);

  /* ── One audio element for the landing ─────────────────────── */
  useEffect(() => {
    if (!mounted) return;
    const a = new Audio();
    a.preload = "auto";
    audioRef.current = a;
    const onEnded = () => {
      if (modeRef.current === "audio") dispatch({ type: "end" });
    };
    const onError = () => {
      const st = stateRef.current;
      if ((st.status === "playing" || st.status === "paused") && a.getAttribute("src")) fallBackToTimed();
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
      audioRef.current = null;
    };
  }, [mounted, fallBackToTimed]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = state.muted;
  }, [state.muted]);

  /* ── Seek: start, previous, next ───────────────────────────── */
  useEffect(() => {
    if (state.seek === 0) return;
    const t0 = startsRef.current[state.index] ?? 0;
    const a = audioRef.current;
    if (modeRef.current === "audio" && a) {
      if (!a.getAttribute("src")) a.src = script.audio;
      try {
        a.currentTime = t0;
      } catch {
        // not seekable yet: plays from the start of the file
      }
    } else {
      clockRef.current = { banked: t0, since: stateRef.current.status === "playing" ? performance.now() : 0 };
    }
    setNow(t0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.seek]);

  /* ── Each cue scrolls the page to its section ──────────────── */
  const active = state.status === "playing" || state.status === "paused";
  useEffect(() => {
    if (active) scrollToSection(cues[state.index].anchor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index, state.seek]);

  /* ── Play, pause, resume, stop ─────────────────────────────── */
  const prevStatus = useRef(state.status);
  useEffect(() => {
    const before = prevStatus.current;
    prevStatus.current = state.status;
    const a = audioRef.current;
    if (state.status === "playing") {
      if (before === "paused") scrollToSection(cues[state.index].anchor);
      if (modeRef.current === "audio" && a) {
        resumeGraph(graphRef.current);
        a.play().catch(() => fallBackToTimed());
      } else if (!clockRef.current.since) startClock(clockRef, clockRef.current.banked);
    } else if (state.status === "paused") {
      a?.pause();
      stopClock(clockRef);
    } else {
      a?.pause();
      stopClock(clockRef);
      setNow(0);
    }
    if (before !== "done" && state.status === "done") track.click(`narration.complete.${page}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  /* ── Follow the time: reach cues, end in caption-only mode ─── */
  const sync = useCallback(() => {
    const st = stateRef.current;
    if (st.status !== "playing") return;
    const t = time();
    setNow((prev) => (Math.abs(prev - t) > 0.05 ? t : prev));
    if (modeRef.current === "timed" && t >= totalRef.current) {
      dispatch({ type: "end" });
      return;
    }
    const i = cueIndexAt(startsRef.current, t);
    if (i !== st.index) dispatch({ type: "reach", index: i });
  }, [time]);

  useEffect(() => {
    if (state.status !== "playing") return;
    let raf = 0;
    const tick = () => {
      sync();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const a = audioRef.current;
    a?.addEventListener("timeupdate", sync);
    return () => {
      cancelAnimationFrame(raf);
      a?.removeEventListener("timeupdate", sync);
    };
  }, [state.status, sync]);

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
  }, [state.status]);

  /* ── Actions ───────────────────────────────────────────────── */
  const begin = () => {
    track.click(`narration.start.${page}`);
    void load();
    modeRef.current = audioStateRef.current === "missing" ? "timed" : "audio";
    setTimed(modeRef.current === "timed");
    const a = audioRef.current;
    if (modeRef.current === "audio" && a) {
      // Start the audio inside the click, so the browser allows sound. The
      // analyser graph is created here too, never before a click.
      if (!a.getAttribute("src")) a.src = script.audio;
      if (!graphRef.current) graphRef.current = voiceGraph(a);
      resumeGraph(graphRef.current);
      a.currentTime = 0;
      a.play().catch(() => fallBackToTimed());
    } else {
      clockRef.current = { banked: 0, since: 0 };
    }
    dispatch({ type: "start" });
  };
  const start = () => {
    markOfferSeen(page);
    setOffer(false);
    begin();
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

  /* ── Wave inputs ───────────────────────────────────────────── */
  const waveAnalyser = useCallback(
    () => (modeRef.current === "audio" && stateRef.current.status === "playing" ? (graphRef.current?.analyser ?? null) : null),
    [],
  );
  const waveSimulated = useCallback(() => {
    const t = time();
    return { level: speechLevel(t, startsRef.current, totalRef.current), time: t };
  }, [time]);

  /* ── Reserve the bar's height for pinned stories ───────────── */
  useEffect(() => {
    const root = document.documentElement;
    const el = barRef.current;
    if (!active || !el) {
      root.style.removeProperty("--narrator-reserve");
      return;
    }
    let max = 0;
    const set = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (h > max) {
        max = h;
        root.style.setProperty("--narrator-reserve", `${h}px`);
      }
    };
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--narrator-reserve");
    };
  }, [active, state.captions]);

  // Focus: the primary button when the overlay opens, play/pause once playing.
  useEffect(() => {
    if (offer) startRef.current?.focus();
  }, [offer]);
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
  const playing = state.status === "playing";
  const timedNote = timed || audioState === "missing";
  const about = aboutMinutes(total);

  return (
    <>
      {offer && (
        <div className={s.overlay} role="dialog" aria-modal="true" aria-labelledby={`narrator-title-${page}`} aria-describedby={`narrator-line-${page}`} onKeyDown={onOverlayKey}>
          <div className={s.overlayInner}>
            <h2 id={`narrator-title-${page}`} className={s.overlayTitle}>
              {NARRATOR_TITLE[page]}
            </h2>
            <p id={`narrator-line-${page}`} className={s.overlayLine}>
              {timedNote ? C.withCaptions(about) : C.withSound(about)}
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
        <button type="button" className={s.launcher} onClick={begin}>
          <PlayIcon />
          <span>{C.launcher}</span>
        </button>
      )}

      {active && (
        <div ref={barRef} className={s.player} role="region" aria-label={C.player}>
          {state.captions && (
            <p key={cue.id} className={s.caption} aria-live={playing ? "polite" : "off"}>
              {cue.caption}
            </p>
          )}
          <div className={s.bar}>
            <div className={s.controls}>
              <VoiceWave
                ref={playRef}
                playing={playing}
                analyser={waveAnalyser}
                simulated={waveSimulated}
                label={playing ? C.pause : C.play}
                glyph={playing ? <PauseIcon /> : <PlayIcon />}
                onToggle={() => dispatch({ type: "toggle" })}
              />
              {state.pausedBy === "user-scroll" && (
                <button type="button" className={s.resume} onClick={() => dispatch({ type: "resume" })}>
                  {C.resume}
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
                    <span
                      className={s.segmentFill}
                      style={{ "--fill": i < state.index ? 1 : i === state.index ? cueProgress(startsRef.current, totalRef.current, i, now) : 0 } as CSSProperties}
                    />
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
