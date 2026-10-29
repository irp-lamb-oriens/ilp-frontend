"use client";

import { forwardRef, useEffect, useRef, type ReactNode } from "react";
import {
  EASE,
  FLAT,
  SETTLED,
  WAVE_BARS,
  bandEdges,
  createFrameLoop,
  easeBars,
  fillBars,
  mapBars,
  meterLevel,
  simulatedBars,
  waveMode,
} from "@/lib/narration/wave";
import s from "./Narrator.module.scss";

/**
 * The narrator's voice wave and its play/pause control: a <button> holding
 * a canvas of WAVE_BARS bars mirrored around a centre line, in the accent
 * colour, flat. Live, it follows the analyser; caption-only, a soft
 * simulated wave follows the caption timing; paused, it settles to a flat
 * line and the frame loop stops. The loop also stops while the tab is
 * hidden. With reduced motion the bars do not animate: a static level
 * meter redraws at most every 250 ms. Buffers are allocated once; the
 * canvas is sized on mount and on window resize only.
 */

interface VoiceWaveProps {
  playing: boolean;
  /** The analyser, or null in caption-only mode. */
  analyser: () => AnalyserNode | null;
  /** Simulated voice level (0..1) and time (s) for caption-only mode. */
  simulated: () => { level: number; time: number };
  onToggle: () => void;
  label: string;
  /** Glyph shown on hover, focus and while paused. */
  glyph: ReactNode;
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function draw(ctx: CanvasRenderingContext2D, bars: Float32Array, w: number, h: number, color: string) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = color;
  const n = bars.length;
  const step = w / n;
  const barW = Math.max(1, step * 0.55);
  const mid = h / 2;
  for (let i = 0; i < n; i++) {
    const v = Math.max(FLAT, Math.min(1, bars[i]));
    const bh = Math.max(1, v * h);
    ctx.fillRect(i * step + (step - barW) / 2, mid - bh / 2, barW, bh);
  }
}

const VoiceWave = forwardRef<HTMLButtonElement, VoiceWaveProps>(function VoiceWave({ playing, analyser, simulated, onToggle, label, glyph }, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const live = useRef({ playing, analyser, simulated });
  live.current = { playing, analyser, simulated };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const cur = new Float32Array(WAVE_BARS);
    const target = new Float32Array(WAVE_BARS);
    let bins: Uint8Array<ArrayBuffer> | null = null;
    let edges: Uint16Array | null = null;
    let forNode: AnalyserNode | null = null;
    let w = 0;
    let h = 0;
    let color = "";
    fillBars(cur, FLAT);

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width * dpr));
      h = Math.max(1, Math.round(r.height * dpr));
      canvas.width = w;
      canvas.height = h;
      color = getComputedStyle(canvas).color;
      draw(ctx, cur, w, h, color);
    };

    /** Fill `target` from the analyser or the simulation; false when there is nothing to follow. */
    const sample = (): boolean => {
      const node = live.current.analyser();
      if (node) {
        if (node !== forNode) {
          forNode = node;
          bins = new Uint8Array(node.frequencyBinCount);
          edges = bandEdges(WAVE_BARS, node.context.sampleRate, node.fftSize);
        }
        node.getByteFrequencyData(bins as Uint8Array<ArrayBuffer>);
        mapBars(bins as Uint8Array, edges as Uint16Array, target);
        return true;
      }
      const sim = live.current.simulated();
      simulatedBars(sim.time, sim.level, target);
      return true;
    };

    const frame = () => {
      const mode = waveMode({ playing: live.current.playing, reduced: false, live: !!live.current.analyser() });
      if (mode === "settle") fillBars(target, FLAT);
      else sample();
      const change = easeBars(cur, target, EASE);
      draw(ctx, cur, w, h, color);
      return mode !== "settle" || change > SETTLED;
    };
    const loop = createFrameLoop(frame);

    // Reduced motion: a static meter, at most every 250 ms.
    let timer = 0;
    const meter = () => {
      if (live.current.playing) {
        sample();
        fillBars(cur, Math.max(FLAT, meterLevel(target)));
      } else fillBars(cur, FLAT);
      draw(ctx, cur, w, h, color);
    };

    const update = () => {
      const reduce = reducedMotion();
      const visible = document.visibilityState !== "hidden";
      window.clearInterval(timer);
      timer = 0;
      if (reduce) {
        loop.stop();
        meter();
        if (visible && live.current.playing) timer = window.setInterval(meter, 250);
        return;
      }
      if (visible) loop.start();
      else loop.stop();
    };

    resize();
    update();
    const onUpdate = () => update();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onUpdate);
    canvas.addEventListener("narrator:update", onUpdate);
    return () => {
      loop.stop();
      window.clearInterval(timer);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onUpdate);
      canvas.removeEventListener("narrator:update", onUpdate);
    };
  }, []);

  // Play and pause restart the loop (paused: it settles, then stops).
  useEffect(() => {
    canvasRef.current?.dispatchEvent(new Event("narrator:update"));
  }, [playing]);

  return (
    <button ref={ref} type="button" className={s.wave} aria-label={label} aria-pressed={playing} data-playing={playing ? "true" : "false"} onClick={onToggle}>
      <canvas ref={canvasRef} className={s.waveCanvas} aria-hidden="true" />
      <span className={s.waveGlyph} aria-hidden="true">
        {glyph}
      </span>
    </button>
  );
});

export default VoiceWave;
