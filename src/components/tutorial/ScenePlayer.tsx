"use client";

/**
 * Plays one scene: the mock UI scaled to the available width, plus an
 * animated cursor that moves, hovers, clicks, types, drags and scrolls as the
 * step's CursorScript says. Motion is transform/opacity only (Web Animations
 * API); state changes re-render the mock.
 *
 * Captions: when an op has `explain`, a callout appears next to its target as
 * the cursor arrives, stays through the click and its result, and fades out
 * before the next op (the timeline holds the op long enough to read it). It
 * sits beside the target inside the scene with a pointer toward it, or docks
 * as a bar under the scene on phone scenes and narrow widths. New glossary
 * words get a "What's this?" expansion.
 *
 * Controls (PlayerControls, state in playerState.ts): play / pause, previous
 * and next action, replay, and a scrubber with one segment per action. Pause
 * holds the current caption. ← / → step between actions while paused: with
 * `keys` anywhere in the window (the modal), otherwise while focus is inside
 * the player; at the first or last action the key falls through to the step
 * navigation around the player.
 *
 * The script loops a few times, then rests on its end state. Reduced motion
 * shows the end state with numbered markers and the written explanations;
 * "Show steps" walks through the actions one still frame at a time.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { cx } from "../ui/cx";
import { IconChevronDown } from "../ui/icons";
import { MockScene } from "./mock/MockScene";
import { PlayerControls } from "./PlayerControls";
import {
  actionPosition,
  canNext,
  canPrev,
  explainItems,
  initPlayer,
  playerReducer,
  shownMode,
  stopDurations,
  stopNames,
  type ExplainItem,
  type PlayerAction,
  type PlayerState,
} from "./playerState";
import {
  applyChanges,
  captionsOf,
  EMPTY_OVERRIDES,
  endState,
  markers as markersOf,
  opChanges,
  placeCallout,
  stateThrough,
  stopIndices,
  type Overrides,
  type Rect,
} from "./sceneUtils";
import { computeTimeline, TIMING, typedAt } from "./timeline";
import type { CursorOp, CursorPoint, CursorScript, Scene, StateChange, TermRef } from "./types";
import { useReducedMotion } from "./useReducedMotion";
import s from "./ScenePlayer.module.scss";

export const SCENE_SIZE = { desktop: [960, 600], wide: [960, 540], phone: [390, 720] } as const;

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const START: CursorPoint = { x: 0.82, y: 0.86 };
/** Below this box width (px) captions dock under the scene instead of floating. */
const DOCK_BELOW = 520;

export interface ScenePlayerProps {
  scene: Scene;
  /** Loops before the demo rests on its end state. Default 3. */
  loops?: number;
  /** Force the static, numbered frame (the gallery uses it to preview). */
  forceStatic?: boolean;
  className?: string;
  /**
   * While paused, ← / → step between actions from anywhere in the window.
   * The modal turns it on; without it the keys work while focus is inside
   * the player, so several players can share a page.
   */
  keys?: boolean;
  /**
   * Per op index, the terms to offer under the caption ("What's this?").
   * The modal passes only first uses in the tutorial; default: all of the op's terms.
   */
  newTerms?: Array<TermRef[] | undefined>;
  /** Show captions while playing. Default true. */
  captions?: boolean;
  /** Show the "What happens here" list under the scene. Default true. */
  explainList?: boolean;
  /**
   * False holds the demo: it waits to start, or pauses where it is and picks
   * up there when it turns true again (TutorialEmbed: off screen). A pause
   * the viewer chose is never undone by this. Default true.
   */
  active?: boolean;
  /** Called once the demo has played its loops and rests on its end state. */
  onEnded?: () => void;
  /** "compact": the embed's minimal bar (more on hover, focus or "More controls"). Default "full". */
  controls?: "full" | "compact";
  /** Step position for the controls' position line ("Action 2 of 5 · Step 1 of 3"). */
  step?: { index: number; count: number };
  /** The last step of the demo: its end frame shows Replay prominently. */
  finale?: boolean;
  /**
   * Makes the player one focusable "demo screen" group with this name (the
   * embed), so its keys work while it has focus.
   */
  label?: string;
  /** Id of the text that explains the keys, for that group. */
  describedBy?: string;
}

interface Pt {
  x: number;
  y: number;
}

const tr = (p: Pt) => `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;

export function ScenePlayer({
  scene,
  loops = 3,
  forceStatic = false,
  className,
  keys = false,
  newTerms,
  captions = true,
  explainList = true,
  active = true,
  onEnded,
  controls = "full",
  step,
  finale = false,
  label,
  describedBy,
}: ScenePlayerProps) {
  const reducedPref = useReducedMotion();
  const reduced = reducedPref || forceStatic;
  const [W, H] = SCENE_SIZE[scene.aspect];
  const boxRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLSpanElement>(null);
  const bodyRef = useRef<HTMLSpanElement>(null);
  const capPosRef = useRef<HTMLDivElement>(null);
  const capRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<Array<HTMLSpanElement | null>>([]);
  /** Last cursor position and scroll offset, shared by the run loop and the paused frame. */
  const posRef = useRef<Pt | null>(null);
  const scrollYRef = useRef(0);
  /** Op the demo is on (the one whose caption shows). */
  const atRef = useRef(-1);
  /** Op the next run starts from (resume after a pause). */
  const startRef = useRef(0);
  /** The running demo's cancel flag, so Pause stops it before React cleans up. */
  const tokenRef = useRef<{ cancelled: boolean }>({ cancelled: true });
  /** The demo has run at least once (an inactive player that never started just waits). */
  const startedRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const termsId = useId();
  const [overrides, setOverrides] = useState<Overrides>(EMPTY_OVERRIDES);
  const [cap, setCap] = useState<{ idx: number; visible: boolean } | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [narrow, setNarrow] = useState(false);
  const script: CursorScript = useMemo(() => scene.script ?? [], [scene.script]);
  const hasScript = script.length > 0;
  const timeline = useMemo(() => computeTimeline(scene.script), [scene.script]);
  const caps = useMemo(() => captionsOf(scene), [scene]);
  const capByOp = useMemo(() => new Map(caps.map((c) => [c.opIndex, c])), [caps]);
  const stops = useMemo(() => stopIndices(scene.script), [scene.script]);
  const names = useMemo(() => stopNames(scene, stops), [scene, stops]);
  const durations = useMemo(() => stopDurations(timeline, stops), [timeline, stops]);
  const items = useMemo(() => explainItems(scene), [scene]);

  // Control state (playerState.ts). `send` runs the reducer at once, so the
  // run loop can be stopped or restarted before React re-renders.
  const [ps, setPs] = useState<PlayerState>(() => initPlayer(stops, script.length - 1, reduced));
  const psRef = useRef(ps);
  const send = useCallback((a: PlayerAction) => {
    const cur = psRef.current;
    const next = playerReducer(cur, a);
    if (next === cur) return;
    const restarted = next.runKey !== cur.runKey;
    if (cur.mode === "playing" && (next.mode !== "playing" || restarted)) tokenRef.current.cancelled = true;
    if (next.mode === "playing" && (cur.mode !== "playing" || restarted)) startRef.current = next.startFrom;
    psRef.current = next;
    setPs(next);
  }, []);

  /** Reduced motion, stepping through the actions one still frame at a time. */
  const manual = reduced && ps.mode === "paused";
  const at = ps.at;
  const marks = useMemo(() => (reduced && !manual ? markersOf(scene) : []), [reduced, manual, scene]);
  const docked = scene.aspect === "phone" || narrow || manual;
  const showCaptions = captions && hasScript && (!reduced || manual);
  const termsFor = (opIndex: number): TermRef[] => (newTerms ? newTerms[opIndex] ?? [] : capByOp.get(opIndex)?.terms ?? []);

  // Scale the fixed-size stage to the box width.
  useLayoutEffect(() => {
    const box = boxRef.current;
    const stage = stageRef.current;
    if (!box || !stage) return;
    const fit = () => {
      stage.style.setProperty("--scene-k", String(box.clientWidth / W));
      setNarrow(box.clientWidth > 0 && box.clientWidth < DOCK_BELOW);
      // Not started yet (waiting to come into view): the cursor rests where the demo starts it.
      const cursor = cursorRef.current;
      if (cursor && !startedRef.current) cursor.style.transform = tr({ x: START.x * box.clientWidth, y: START.y * box.clientHeight });
    };
    fit();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [W]);

  // A new scene (or a change to reduced motion) starts from the top.
  const shown = useRef({ scene, reduced });
  useEffect(() => {
    if (shown.current.scene === scene && shown.current.reduced === reduced) return;
    shown.current = { scene, reduced };
    startedRef.current = false;
    atRef.current = -1;
    setCap(null);
    send({ type: "reset", stops, lastOp: script.length - 1, reduced });
  }, [scene, reduced, stops, script, send]);

  // Reduced motion: the end state (or, stepping, the state after the action
  // shown), its scroll, and numbered markers on the targets.
  useLayoutEffect(() => {
    if (!reduced) return;
    setOverrides(manual ? stateThrough(scene.script, at) : endState(scene.script));
    setCap(manual && captions && scene.script?.[at]?.explain ? { idx: at, visible: true } : null);
  }, [reduced, manual, at, scene, captions]);

  useLayoutEffect(() => {
    if (!reduced) return;
    const box = boxRef.current;
    const stage = stageRef.current;
    if (!box || !stage) return;
    const place = () => {
      const k = box.clientWidth / W || 1;
      placeScroll(stage, scene.script, manual ? at : (scene.script?.length ?? 0) - 1, k, H);
      const br = box.getBoundingClientRect();
      marks.forEach((m, i) => {
        const el = markerRefs.current[i];
        const target = findIn(stage, m.id);
        if (!el) return;
        if (!target) {
          el.hidden = true;
          return;
        }
        const r = target.getBoundingClientRect();
        el.hidden = false;
        el.style.transform = tr({ x: r.right - br.left - 10, y: r.top - br.top - 10 });
      });
    };
    const raf = requestAnimationFrame(place);
    if (typeof ResizeObserver === "undefined") return () => cancelAnimationFrame(raf);
    const ro = new ResizeObserver(() => requestAnimationFrame(place));
    ro.observe(box);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [reduced, manual, at, marks, scene, overrides, W, H]);

  // The animated demo.
  useEffect(() => {
    if (reduced || ps.mode !== "playing" || !hasScript || !active) return;
    const box = boxRef.current;
    const stage = stageRef.current;
    const cursor = cursorRef.current;
    if (!box || !stage || !cursor) return;
    startedRef.current = true;
    const boxEl: HTMLElement = box;
    const stageEl: HTMLElement = stage;
    const token = { cancelled: false };
    tokenRef.current = token;
    const running = new Set<Animation>();
    const startIdx = startRef.current;
    startRef.current = 0;
    const startPt = (): Pt => ({ x: START.x * box.clientWidth, y: START.y * box.clientHeight });
    let pos: Pt = posRef.current ?? startPt();
    let scrollY = scrollYRef.current;

    const k = () => box.clientWidth / W || 1;
    const sleep = (ms: number) => new Promise<void>((res) => window.setTimeout(res, Math.max(0, ms)));
    const frames = () => new Promise<void>((res) => requestAnimationFrame(() => requestAnimationFrame(() => res())));
    const find = (id: string) => findIn(stage, id);
    const patch = (changes: StateChange[]) => {
      if (!token.cancelled && changes.length) setOverrides((o) => applyChanges(o, changes));
    };
    const play = async (el: Element, frames0: Keyframe[], duration: number, keep = true) => {
      const a = el.animate(frames0, { duration, easing: EASE, fill: keep ? "forwards" : "none" });
      running.add(a);
      try {
        await a.finished;
      } catch {
        // cancelled
      }
      running.delete(a);
      return a;
    };
    const setPointer = (on: boolean) => {
      cursor.dataset.pointer = on ? "1" : "";
    };
    const setPos = (p: Pt) => {
      pos = p;
      posRef.current = p;
    };
    const moveCursor = async (to: Pt, ms: number) => {
      if (ms <= 0) {
        cursor.style.transform = tr(to);
        setPos(to);
        return;
      }
      const a = await play(cursor, [{ transform: tr(pos) }, { transform: tr(to) }], ms);
      if (token.cancelled) {
        a.cancel();
        return;
      }
      cursor.style.transform = tr(to);
      a.cancel();
      setPos(to);
    };
    const clickFx = () => {
      if (bodyRef.current) void play(bodyRef.current, [{ transform: "scale(1)" }, { transform: "scale(0.86)" }, { transform: "scale(1)" }], 240, false);
      if (rippleRef.current)
        void play(
          rippleRef.current,
          [
            { transform: "scale(0.95)", opacity: 0.6 },
            { transform: "scale(2.6)", opacity: 0 },
          ],
          460,
          false,
        );
    };
    const scrollTo = async (to: CursorOp["to"], ms: number) => {
      const anchor = typeof to === "string" ? find(to) : null;
      const content = (anchor?.closest("[data-mock-scroll]") as HTMLElement | null) ?? stage.querySelector<HTMLElement>("[data-mock-scroll]");
      if (!content) return sleep(ms);
      const y = scrollTarget(stage, content, to, k(), H);
      const a = await play(content, [{ transform: `translateY(${-scrollY}px)` }, { transform: `translateY(${-y}px)` }], ms);
      if (token.cancelled) {
        a.cancel();
        return;
      }
      content.style.transform = `translateY(${-y}px)`;
      a.cancel();
      scrollY = y;
      scrollYRef.current = y;
    };
    const drag = async (op: CursorOp, ms: number) => {
      const card = typeof op.to === "string" ? find(op.to) : null;
      const col = op.dest ? find(op.dest) : null;
      if (!card || !col || typeof op.to !== "string" || !op.dest) return sleep(ms);
      setPointer(true);
      clickFx();
      patch([
        { id: op.to, set: { dragging: true } },
        { id: op.dest, set: { highlight: true } },
      ]);
      await frames();
      const kk = k();
      const br = box.getBoundingClientRect();
      const cr = card.getBoundingClientRect();
      const drop = col.querySelector<HTMLElement>("[data-mock-drop]") ?? col;
      const dr = drop.getBoundingClientRect();
      const kids = Array.from(drop.children).filter((c) => c !== card);
      const last = kids.length ? kids[kids.length - 1].getBoundingClientRect() : null;
      const dest: Pt = {
        x: dr.left - br.left + Math.min(dr.width / 2, 120 * kk),
        y: (last ? last.bottom + 8 * kk : dr.top) - br.top + cr.height / 2,
      };
      const dx = (dest.x - pos.x) / kk;
      const dy = (dest.y - pos.y) / kk;
      await Promise.all([
        moveCursor(dest, ms),
        play(card, [{ transform: "translate(0px, 0px) rotate(0deg)" }, { transform: `translate(${dx}px, ${dy}px) rotate(-1.5deg)` }], ms),
      ]);
    };
    const showCaption = (idx: number) => {
      if (token.cancelled) return;
      atRef.current = idx;
      send({ type: "reach", at: idx });
      setCap(captions && script[idx]?.explain ? { idx, visible: true } : null);
    };
    const fadeCaption = () => {
      if (!token.cancelled) setCap((c) => (c ? { ...c, visible: false } : c));
    };

    const reset = () => {
      running.forEach((a) => a.cancel());
      running.clear();
      const content = stage.querySelectorAll<HTMLElement>("[data-mock-scroll]");
      content.forEach((c) => (c.style.transform = ""));
      scrollY = 0;
      scrollYRef.current = 0;
      setOverrides(EMPTY_OVERRIDES);
      setCap(null);
      atRef.current = -1;
      send({ type: "reach", at: -1 });
      setPos(startPt());
      cursor.style.transform = tr(pos);
      setPointer(false);
    };

    async function run() {
      for (let loop = 0; loop < loops; loop++) {
        const resume = loop === 0 && startIdx > 0;
        if (resume) {
          // Pick up after a pause: the paused frame already placed the cursor and scroll.
          setOverrides(stateThrough(script, startIdx - 1));
          await frames();
        } else {
          reset();
          await frames();
          await sleep(TIMING.lead);
        }
        let hovered: string | null = null;
        for (const seg of timeline.segments) {
          if (resume && seg.index < startIdx) continue;
          if (token.cancelled) return;
          const op = seg.op;
          if (hovered) {
            patch([{ id: hovered, set: { hovered: false } }]);
            hovered = null;
          }
          if (op.op === "scroll") {
            showCaption(seg.index);
            await scrollTo(op.to, seg.action);
          } else {
            if (seg.travel > 0) {
              const p = pointIn(boxEl, stageEl, op.to, W);
              setPointer(false);
              if (p) await moveCursor(p, seg.travel);
            }
            if (token.cancelled) return;
            showCaption(seg.index);
            const id = typeof op.to === "string" ? op.to : null;
            switch (op.op) {
              case "click":
                setPointer(true);
                clickFx();
                if (id) patch([{ id, set: { pressed: true } }]);
                await sleep(TIMING.click / 2);
                if (id) patch([{ id, set: { pressed: false } }]);
                await sleep(seg.action - TIMING.click / 2);
                break;
              case "hover":
                setPointer(true);
                if (id) {
                  patch([{ id, set: { hovered: true } }]);
                  hovered = id;
                }
                await sleep(seg.action);
                break;
              case "type": {
                setPointer(false);
                clickFx();
                const text = op.text ?? "";
                if (id) patch([{ id, set: { focused: true, value: "" } }]);
                const t0 = performance.now();
                let shown = "";
                while (!token.cancelled && performance.now() - t0 < seg.action) {
                  const next = typedAt(text, performance.now() - t0);
                  if (id && next !== shown) {
                    shown = next;
                    patch([{ id, set: { value: next } }]);
                  }
                  await sleep(TIMING.typeChar / 2);
                }
                break;
              }
              case "drag":
                await drag(op, seg.action);
                break;
              case "move":
                break;
              default:
                await sleep(seg.action);
            }
          }
          if (token.cancelled) return;
          const extra: StateChange[] =
            op.op === "drag" && typeof op.to === "string" && op.dest
              ? [
                  { id: op.to, set: { dragging: false } },
                  { id: op.dest, set: { highlight: false } },
                ]
              : [];
          patch([...opChanges(op), ...extra]);
          if (seg.settle) await sleep(seg.settle);
          if (seg.hold) {
            await sleep(seg.hold - TIMING.captionOut);
            fadeCaption();
            await sleep(Math.min(seg.hold, TIMING.captionOut));
          }
          if (token.cancelled) return;
        }
        if (token.cancelled) return;
        fadeCaption();
        await sleep(TIMING.loopPause);
      }
      if (!token.cancelled) {
        setOverrides(endState(scene.script));
        setCap(null);
        send({ type: "end" });
      }
    }

    void run();
    return () => {
      token.cancelled = true;
      running.forEach((a) => a.cancel());
      running.clear();
    };
  }, [reduced, ps.mode, ps.runKey, hasScript, timeline, scene, script, loops, captions, W, H, active, send]);

  // Paused: the frame right after op `at`, with its caption held.
  useLayoutEffect(() => {
    if (reduced || ps.mode !== "paused" || !hasScript) return;
    const op = script[at];
    const base = stateThrough(script, at);
    setOverrides(op?.op === "hover" && typeof op.to === "string" ? applyChanges(base, [{ id: op.to, set: { hovered: true } }]) : base);
    setCap(captions && op?.explain ? { idx: at, visible: true } : null);
  }, [reduced, ps.mode, at, hasScript, script, captions]);

  // Paused: put the cursor on the op's target and the page at its scroll.
  useLayoutEffect(() => {
    if (reduced || ps.mode !== "paused" || !hasScript) return;
    const box = boxRef.current;
    const stage = stageRef.current;
    const cursor = cursorRef.current;
    if (!box || !stage || !cursor) return;
    const k = box.clientWidth / W || 1;
    scrollYRef.current = placeScroll(stage, script, at, k, H);
    const op = script[at];
    const p = op ? pointIn(box, stage, op.op === "drag" && op.dest ? op.dest : op.to, W) : null;
    if (p) {
      cursor.style.transform = tr(p);
      posRef.current = p;
    }
    cursor.dataset.pointer = op && (op.op === "hover" || op.op === "click" || op.op === "drag") ? "1" : "";
  }, [reduced, ps.mode, at, hasScript, script, overrides, W, H]);

  // Place the caption beside its target (or dock it under the scene), with
  // its pointer aimed at the target's centre.
  useLayoutEffect(() => {
    if (!cap || docked) return;
    const box = boxRef.current;
    const stage = stageRef.current;
    const posEl = capPosRef.current;
    const bubble = capRef.current;
    if (!box || !stage || !posEl || !bubble) return;
    const op = script[cap.idx];
    const br = box.getBoundingClientRect();
    let rect: Rect | null = null;
    const anchor = op?.op === "drag" && op.dest ? op.dest : op?.to;
    if (typeof anchor === "string") {
      const el = findIn(stage, anchor);
      if (el) {
        const r = el.getBoundingClientRect();
        rect = { left: r.left - br.left, top: r.top - br.top, width: r.width, height: r.height };
      }
    }
    const p = posRef.current;
    // Big targets (a whole card or column): anchor on the cursor instead.
    if (p && (!rect || rect.height > br.height * 0.35 || rect.width > br.width * 0.6)) rect = { left: p.x - 12, top: p.y - 12, width: 24, height: 24 };
    if (!rect) rect = { left: br.width / 2 - 12, top: br.height / 2 - 12, width: 24, height: 24 };
    const bw = bubble.offsetWidth;
    const bh = bubble.offsetHeight;
    const place = placeCallout(rect, { width: br.width, height: br.height }, { width: bw, height: bh });
    posEl.style.transform = tr(place);
    posEl.dataset.side = place.side;
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    posEl.style.setProperty("--arrow-x", `${clamp(rect.left + rect.width / 2 - place.x, 16, Math.max(16, bw - 16)).toFixed(1)}px`);
    posEl.style.setProperty("--arrow-y", `${clamp(rect.top + rect.height / 2 - place.y, 14, Math.max(14, bh - 14)).toFixed(1)}px`);
  }, [cap, docked, overrides, termsOpen, script]);

  // A new caption starts collapsed and is announced once.
  const capIdx = cap?.idx ?? -1;
  useEffect(() => {
    setTermsOpen(false);
    const c = capByOp.get(capIdx);
    if (c && c.explain) setAnnounce(`${c.name}: ${c.explain}`);
  }, [capIdx, capByOp]);

  // Controls.
  const pause = useCallback(() => send({ type: "pause" }), [send]);
  const play = useCallback(() => send({ type: "play" }), [send]);
  const next = useCallback(() => send({ type: "next" }), [send]);
  const prev = useCallback(() => send({ type: "prev" }), [send]);
  const replay = useCallback(() => send({ type: "replay" }), [send]);
  const seek = useCallback((k: number) => send({ type: "seek", stop: k }), [send]);
  const showAll = useCallback(() => send({ type: "end" }), [send]);

  // `active` (TutorialEmbed: in view or not). Off: hold where the demo is.
  // On again: resume from there, unless the viewer paused it.
  useEffect(() => {
    if (reduced || !hasScript) return;
    send({ type: "view", visible: active });
  }, [active, reduced, hasScript, send]);

  useEffect(() => {
    if (ps.mode === "ended" && !ps.reduced) onEndedRef.current?.();
  }, [ps.mode, ps.reduced]);

  /** ← / → between actions while paused; true when the key was used. */
  const stepKey = useCallback(
    (e: { key: string; altKey: boolean; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; target: EventTarget | null; defaultPrevented: boolean }) => {
      const cur = psRef.current;
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || cur.mode !== "paused") return false;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return false;
      const el = e.target as HTMLElement | null;
      if (el?.closest?.("input, textarea, select, [role='radiogroup']")) return false;
      const able = e.key === "ArrowRight" ? canNext(cur) : canPrev(cur);
      if (!able) return false; // at the edge: the step navigation around the player takes it
      send({ type: e.key === "ArrowRight" ? "next" : "prev" });
      return true;
    },
    [send],
  );

  // The modal: anywhere in the window (capture, so its step keys wait).
  useEffect(() => {
    if (!keys || !hasScript || ps.mode !== "paused") return;
    const onKey = (e: KeyboardEvent) => {
      if (stepKey(e)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [keys, hasScript, ps.mode, stepKey]);

  // Everywhere else: only while focus is inside this player.
  const onPlayerKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (keys || !hasScript) return;
    if (stepKey(e)) e.preventDefault();
  };

  const capInfo = cap ? capByOp.get(cap.idx) : undefined;
  const capTerms = cap ? termsFor(cap.idx) : [];
  const bubble =
    showCaptions && cap && capInfo && capInfo.explain ? (
      <div
        ref={capRef}
        className={cx(s.cap, docked && s.capDocked, cap.visible && s.capOn)}
        inert={!cap.visible}
        onFocus={pause}
      >
        <p className={s.capName}>{capInfo.name}</p>
        <p className={s.capText}>{capInfo.explain}</p>
        {capTerms.length > 0 && (
          <div className={s.capTerms}>
            <button
              type="button"
              className={s.capMore}
              aria-expanded={termsOpen}
              aria-controls={termsId}
              onClick={() => {
                pause();
                setTermsOpen((o) => !o);
              }}
            >
              <span>What&rsquo;s this?</span>
              <IconChevronDown className={cx(s.chev, termsOpen && s.chevOpen)} />
            </button>
            <dl id={termsId} className={s.capDl} hidden={!termsOpen}>
              {capTerms.map((t) => (
                <div key={t.key ?? t.word} className={s.capTerm}>
                  <dt>{t.word}</dt>
                  <dd>{t.meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    ) : null;

  const position = actionPosition(ps);
  const listCurrent = ps.mode === "ended" ? -1 : at;

  return (
    <div
      className={cx(s.player, label && s.focusable, className)}
      onKeyDown={onPlayerKey}
      tabIndex={label ? 0 : undefined}
      role={label ? "group" : undefined}
      aria-label={label}
      aria-describedby={label ? describedBy : undefined}
      data-demo-screen={label ? "" : undefined}
    >
      <div className={cx(s.frame, scene.aspect === "phone" && s.framePhone)}>
        <div ref={boxRef} className={cx(s.box, s[scene.aspect])} aria-hidden="true" inert>
          <div ref={stageRef} className={cx(s.stage, s[`stage_${scene.aspect}`])}>
            <MockScene root={scene.root} overrides={overrides} />
          </div>
          {!reduced && hasScript && (
            <div ref={cursorRef} className={s.cursor} data-pointer="">
              <span ref={rippleRef} className={s.ripple} />
              <span ref={bodyRef} className={s.cursorBody}>
                <svg className={s.arrow} width="22" height="22" viewBox="0 0 24 24">
                  <path d="M4 2.5v17.2l4.6-4.4 3 6.6 3.1-1.4-3-6.5h6.4z" />
                </svg>
                <svg className={s.hand} width="24" height="24" viewBox="0 0 24 24">
                  <path d="M9 2.8a1.6 1.6 0 0 1 1.6 1.6v6.1h.4V8.9a1.6 1.6 0 0 1 3.2 0v1.6h.4V9.8a1.6 1.6 0 0 1 3.2 0v1h.3a1.6 1.6 0 0 1 2.9 1V16a6 6 0 0 1-6 6h-1.6a6 6 0 0 1-4.6-2.2L4.3 14.4a1.6 1.6 0 0 1 2.4-2.1l.7.8V4.4A1.6 1.6 0 0 1 9 2.8z" />
                </svg>
              </span>
            </div>
          )}
          {marks.map((m, i) => (
            <span
              key={m.n}
              ref={(el) => {
                markerRefs.current[i] = el;
              }}
              className={s.marker}
            >
              {m.n}
            </span>
          ))}
        </div>
        {!docked && showCaptions && (
          <div className={s.capLayer}>
            <div ref={capPosRef} className={s.capPos}>
              {bubble}
            </div>
          </div>
        )}
      </div>
      {docked && showCaptions && caps.some((c) => c.explain) && <div className={cx(s.dock, scene.aspect === "phone" && s.dockPhone)}>{bubble}</div>}
      {showCaptions && (
        <p className={s.sr} aria-live="polite" aria-atomic="true">
          {announce}
        </p>
      )}
      {reduced && !manual && marks.length > 0 && !explainList && (
        <div className={s.legend} role="list" aria-label="Numbers on the screen">
          {marks.map((m) => (
            <div key={m.n} role="listitem" className={s.legendItem}>
              <span className={s.legendNum}>{m.n}.</span> {m.text}
            </div>
          ))}
        </div>
      )}
      {hasScript && (
        <PlayerControls
          mode={shownMode(ps)}
          reduced={reduced}
          actions={names}
          position={position}
          durations={durations}
          canPrev={canPrev(ps)}
          canNext={canNext(ps)}
          onPlay={play}
          onPause={pause}
          onPrev={prev}
          onNext={next}
          onReplay={replay}
          onSeek={seek}
          onShowSteps={() => seek(0)}
          onShowAll={showAll}
          compact={controls === "compact"}
          step={step}
          finale={finale}
        />
      )}
      {explainList && items.length > 0 && <ExplainList reduced={reduced} items={items} termsFor={termsFor} current={listCurrent} />}
    </div>
  );
}

/**
 * "What happens here": a disclosure (closed while the demo plays, open in
 * reduced motion) with one numbered line per action, "1. Name: explanation",
 * the action on screen highlighted. The list is only in the page while open,
 * so a closed list never copies as bare numbers.
 */
function ExplainList({ reduced, items, termsFor, current }: { reduced: boolean; items: ExplainItem[]; termsFor: (opIndex: number) => TermRef[]; current: number }) {
  const [open, setOpen] = useState(reduced);
  const uid = useId();
  useEffect(() => setOpen(reduced), [reduced]);
  return (
    <section className={s.explain} aria-labelledby={`${uid}-t`}>
      <button type="button" id={`${uid}-t`} className={s.explainToggle} aria-expanded={open} aria-controls={`${uid}-p`} onClick={() => setOpen((v) => !v)}>
        <span>What happens here</span>
        <span className={s.explainCount}>
          {items.length} {items.length === 1 ? "action" : "actions"}
        </span>
        <IconChevronDown className={cx(s.chev, open && s.chevOpen)} />
      </button>
      <div id={`${uid}-p`} className={s.explainPanel} hidden={!open}>
        {open && (
          <div className={s.explainList} role="list">
            {items.map((c) => {
              const terms = termsFor(c.opIndex);
              const on = c.opIndex === current;
              return (
                <div key={c.opIndex} role="listitem" className={cx(s.explainItem, on && s.explainOn)} aria-current={on ? "step" : undefined}>
                  <p className={s.explainLine}>
                    <span className={s.explainNum}>{c.n}.</span> <strong className={s.explainName}>{c.name}</strong>: {c.explain}
                  </p>
                  {terms.map((t) => (
                    <p key={t.key ?? t.word} className={s.explainTerm}>
                      <span className={s.explainWord}>{t.word}</span>: {t.meaning}
                    </p>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function cssEscape(id: string): string {
  return typeof CSS !== "undefined" && CSS.escape ? CSS.escape(id) : id.replace(/["\\]/g, "\\$&");
}

function findIn(stage: HTMLElement, id: string): HTMLElement | null {
  return stage.querySelector<HTMLElement>(`[data-mock-id="${cssEscape(id)}"]`);
}

/** Where the cursor points for a target: a node (near its left-centre) or a scene fraction. */
function pointIn(box: HTMLElement, stage: HTMLElement, to: CursorOp["to"], W: number): Pt | null {
  if (to === undefined) return null;
  const br = box.getBoundingClientRect();
  if (typeof to !== "string") return { x: to.x * br.width, y: to.y * br.height };
  const el = findIn(stage, to);
  if (!el) return null;
  const k = box.clientWidth / W || 1;
  const r = el.getBoundingClientRect();
  return { x: r.left - br.left + Math.min(r.width / 2, 120 * k), y: r.top - br.top + r.height / 2 };
}

/** Applies the scroll of the last scroll op at or before `index`, instantly. Returns the offset. */
function placeScroll(stage: HTMLElement, script: CursorScript | undefined, index: number, k: number, H: number): number {
  const ops = (script ?? []).slice(0, Math.max(0, index + 1));
  const last = [...ops].reverse().find((o) => o.op === "scroll");
  stage.querySelectorAll<HTMLElement>("[data-mock-scroll]").forEach((c) => (c.style.transform = ""));
  if (!last) return 0;
  const anchor = typeof last.to === "string" ? findIn(stage, last.to) : null;
  const content = (anchor?.closest("[data-mock-scroll]") as HTMLElement | null) ?? stage.querySelector<HTMLElement>("[data-mock-scroll]");
  if (!content) return 0;
  const y = scrollTarget(stage, content, last.to, k, H);
  content.style.transform = `translateY(${-y}px)`;
  return y;
}

/** Unscaled scroll offset that brings `to` near the top of its scroll area. */
function scrollTarget(stage: HTMLElement, content: HTMLElement, to: CursorOp["to"], k: number, H: number): number {
  const viewport = content.parentElement;
  const max = Math.max(0, content.offsetHeight - (viewport?.clientHeight ?? H));
  let y = 0;
  if (typeof to === "string") {
    const el = stage.querySelector(`[data-mock-id="${cssEscape(to)}"]`);
    if (el) y = (el.getBoundingClientRect().top - content.getBoundingClientRect().top) / k - 16;
  } else if (to) {
    y = to.y * max;
  } else {
    y = max;
  }
  return Math.max(0, Math.min(max, y));
}

export default ScenePlayer;
