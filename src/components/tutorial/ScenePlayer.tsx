"use client";

/**
 * Plays one scene: the mock UI scaled to the available width, plus an
 * animated cursor that moves, hovers, clicks, types, drags and scrolls as the
 * step's CursorScript says. Motion is transform/opacity only (Web Animations
 * API); state changes re-render the mock. The script loops a few times, then
 * rests on its end state. Reduced motion shows the end state with numbered
 * markers and a written list instead.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cx } from "../ui/cx";
import { MockScene } from "./mock/MockScene";
import { applyChanges, EMPTY_OVERRIDES, endState, markers as markersOf, opChanges, type Overrides } from "./sceneUtils";
import { computeTimeline, TIMING, typedAt } from "./timeline";
import type { CursorOp, CursorPoint, Scene, StateChange } from "./types";
import { useReducedMotion } from "./useReducedMotion";
import s from "./ScenePlayer.module.scss";

export const SCENE_SIZE = { desktop: [960, 600], wide: [960, 540], phone: [390, 720] } as const;

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const START: CursorPoint = { x: 0.82, y: 0.86 };

export interface ScenePlayerProps {
  scene: Scene;
  /** Loops before the demo rests on its end state. Default 3. */
  loops?: number;
  /** Force the static, numbered frame (the gallery uses it to preview). */
  forceStatic?: boolean;
  className?: string;
}

interface Pt {
  x: number;
  y: number;
}

const tr = (p: Pt) => `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;

export function ScenePlayer({ scene, loops = 3, forceStatic = false, className }: ScenePlayerProps) {
  const reducedPref = useReducedMotion();
  const reduced = reducedPref || forceStatic;
  const [W, H] = SCENE_SIZE[scene.aspect];
  const boxRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLSpanElement>(null);
  const bodyRef = useRef<HTMLSpanElement>(null);
  const markerRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [overrides, setOverrides] = useState<Overrides>(EMPTY_OVERRIDES);
  const [playing, setPlaying] = useState(true);
  const [runKey, setRunKey] = useState(0);
  const hasScript = !!scene.script?.length;
  const timeline = useMemo(() => computeTimeline(scene.script), [scene.script]);
  const marks = useMemo(() => (reduced ? markersOf(scene) : []), [reduced, scene]);

  // Scale the fixed-size stage to the box width.
  useLayoutEffect(() => {
    const box = boxRef.current;
    const stage = stageRef.current;
    if (!box || !stage) return;
    const fit = () => stage.style.setProperty("--scene-k", String(box.clientWidth / W));
    fit();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [W]);

  // A new scene starts playing from the top.
  useEffect(() => {
    setPlaying(true);
    setRunKey((k) => k + 1);
  }, [scene]);

  // Reduced motion: end state, final scroll, numbered markers on the targets.
  useLayoutEffect(() => {
    if (!reduced) return;
    setOverrides(endState(scene.script));
  }, [reduced, scene]);

  useLayoutEffect(() => {
    if (!reduced) return;
    const box = boxRef.current;
    const stage = stageRef.current;
    if (!box || !stage) return;
    const place = () => {
      const k = box.clientWidth / W || 1;
      const lastScroll = [...(scene.script ?? [])].reverse().find((o) => o.op === "scroll");
      const content = stage.querySelector<HTMLElement>("[data-mock-scroll]");
      if (content) {
        content.style.transform = "";
        if (lastScroll) content.style.transform = `translateY(${-scrollTarget(stage, content, lastScroll.to, k, H)}px)`;
      }
      const br = box.getBoundingClientRect();
      marks.forEach((m, i) => {
        const el = markerRefs.current[i];
        const target = stage.querySelector(`[data-mock-id="${cssEscape(m.id)}"]`);
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
  }, [reduced, marks, scene, overrides, W, H]);

  // The animated demo.
  useEffect(() => {
    if (reduced || !playing || !hasScript) return;
    const box = boxRef.current;
    const stage = stageRef.current;
    const cursor = cursorRef.current;
    if (!box || !stage || !cursor) return;
    const token = { cancelled: false };
    const running = new Set<Animation>();
    let pos: Pt = { x: START.x * box.clientWidth, y: START.y * box.clientHeight };
    let scrollY = 0;

    const k = () => box.clientWidth / W || 1;
    const sleep = (ms: number) => new Promise<void>((res) => window.setTimeout(res, Math.max(0, ms)));
    const frames = () => new Promise<void>((res) => requestAnimationFrame(() => requestAnimationFrame(() => res())));
    const find = (id: string) => stage.querySelector<HTMLElement>(`[data-mock-id="${cssEscape(id)}"]`);
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
    const pointFor = (to: CursorOp["to"]): Pt | null => {
      if (to === undefined) return null;
      const br = box.getBoundingClientRect();
      if (typeof to !== "string") return { x: to.x * br.width, y: to.y * br.height };
      const el = find(to);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left - br.left + Math.min(r.width / 2, 120 * k()), y: r.top - br.top + r.height / 2 };
    };
    const setPointer = (on: boolean) => {
      cursor.dataset.pointer = on ? "1" : "";
    };
    const moveCursor = async (to: Pt, ms: number) => {
      if (ms <= 0) {
        cursor.style.transform = tr(to);
        pos = to;
        return;
      }
      const a = await play(cursor, [{ transform: tr(pos) }, { transform: tr(to) }], ms);
      cursor.style.transform = tr(to);
      a.cancel();
      pos = to;
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
      content.style.transform = `translateY(${-y}px)`;
      a.cancel();
      scrollY = y;
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

    const reset = () => {
      running.forEach((a) => a.cancel());
      running.clear();
      const content = stage.querySelectorAll<HTMLElement>("[data-mock-scroll]");
      content.forEach((c) => (c.style.transform = ""));
      scrollY = 0;
      setOverrides(EMPTY_OVERRIDES);
      pos = { x: START.x * box.clientWidth, y: START.y * box.clientHeight };
      cursor.style.transform = tr(pos);
      setPointer(false);
    };

    async function run() {
      for (let loop = 0; loop < loops; loop++) {
        reset();
        await frames();
        await sleep(TIMING.lead);
        let hovered: string | null = null;
        for (const seg of timeline.segments) {
          if (token.cancelled) return;
          const op = seg.op;
          if (hovered) {
            patch([{ id: hovered, set: { hovered: false } }]);
            hovered = null;
          }
          if (op.op === "scroll") {
            await scrollTo(op.to, seg.action);
          } else {
            if (seg.travel > 0) {
              const p = pointFor(op.to);
              setPointer(false);
              if (p) await moveCursor(p, seg.travel);
            }
            if (token.cancelled) return;
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
        }
        if (token.cancelled) return;
        await sleep(TIMING.loopPause);
      }
      if (!token.cancelled) {
        setOverrides(endState(scene.script));
        setPlaying(false);
      }
    }

    void run();
    return () => {
      token.cancelled = true;
      running.forEach((a) => a.cancel());
      running.clear();
    };
  }, [reduced, playing, runKey, hasScript, timeline, scene, loops, W, H]);

  return (
    <div className={cx(s.player, className)}>
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
      {reduced && marks.length > 0 && (
        <ol className={s.legend}>
          {marks.map((m) => (
            <li key={m.n}>
              <span className={s.legendNum} aria-hidden="true">
                {m.n}
              </span>
              {m.text}
            </li>
          ))}
        </ol>
      )}
      {!reduced && hasScript && (
        <div className={s.controls}>
          <button
            type="button"
            className={s.control}
            onClick={() => {
              setPlaying(true);
              setRunKey((k) => k + 1);
            }}
          >
            Replay
          </button>
          <button type="button" className={s.control} aria-pressed={!playing} onClick={() => setPlaying((p) => !p)}>
            {playing ? "Pause demo" : "Play demo"}
          </button>
        </div>
      )}
    </div>
  );
}

function cssEscape(id: string): string {
  return typeof CSS !== "undefined" && CSS.escape ? CSS.escape(id) : id.replace(/["\\]/g, "\\$&");
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
