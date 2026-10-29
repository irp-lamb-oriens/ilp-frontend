/**
 * Voice wave for the narrator's player bar. Plain functions, no DOM, so
 * tests/narration.test.mjs can check them.
 *
 * Live: the analyser's frequency bins (0..255) are grouped into N bars over
 * the voice range (VOICE_LO..VOICE_HI Hz, log spaced, so the low formants
 * do not crowd out the rest), lifted slightly toward the high bands (which
 * carry less energy) and normalized to 0..1. Drawn bars ease toward these
 * targets every frame. Without audio (caption-only) a soft simulated wave
 * follows the caption timing. Paused, the bars settle to a flat line and the
 * frame loop stops.
 */

export const WAVE_BARS = 32;
export const FFT_SIZE = 512;
export const SMOOTHING = 0.8;
export const VOICE_LO = 80;
export const VOICE_HI = 4000;
/** Height of a flat bar (share of the wave's height): the calm line. */
export const FLAT = 0.06;
/** Easing per frame toward the target heights. */
export const EASE = 0.25;
/** Below this change per frame, the bars count as settled. */
export const SETTLED = 0.002;

export type WaveMode = "live" | "simulated" | "settle" | "static";

/**
 * Bin edges of `bars` log-spaced bands from lo to hi Hz: edges[k]..edges[k+1]
 * (end exclusive) are the bins of bar k. Every band has at least one bin;
 * edges never pass the bin count.
 */
export function bandEdges(bars: number, sampleRate: number, fftSize: number, lo = VOICE_LO, hi = VOICE_HI): Uint16Array {
  const binHz = sampleRate / fftSize;
  const binCount = fftSize / 2;
  const edges = new Uint16Array(bars + 1);
  for (let k = 0; k <= bars; k++) {
    const f = lo * Math.pow(hi / lo, k / bars);
    edges[k] = Math.min(binCount, Math.max(1, Math.round(f / binHz)));
  }
  for (let k = 1; k <= bars; k++) if (edges[k] <= edges[k - 1]) edges[k] = Math.min(binCount, edges[k - 1] + 1);
  return edges;
}

/**
 * Map frequency bins (0..255) to bar heights 0..1 in `out` (no allocation).
 * Each bar is the mean of its band, shaped by a gentle curve, lifted toward
 * the high bands and clamped.
 */
export function mapBars(bins: ArrayLike<number>, edges: ArrayLike<number>, out: Float32Array, gain = 1.35): void {
  const n = out.length;
  for (let i = 0; i < n; i++) {
    const a = edges[i];
    const b = Math.max(a + 1, edges[i + 1]);
    let sum = 0;
    let count = 0;
    for (let k = a; k < b && k < bins.length; k++) {
      sum += bins[k];
      count++;
    }
    const mean = count ? sum / count / 255 : 0;
    const tilt = 1 + 0.6 * (n > 1 ? i / (n - 1) : 0);
    out[i] = Math.min(1, Math.pow(mean, 0.8) * gain * tilt);
  }
}

/** Ease `cur` toward `target` in place; returns the largest change. */
export function easeBars(cur: Float32Array, target: Float32Array, k = EASE): number {
  let max = 0;
  for (let i = 0; i < cur.length; i++) {
    const d = (target[i] - cur[i]) * k;
    cur[i] += d;
    if (Math.abs(d) > max) max = Math.abs(d);
  }
  return max;
}

/** Fill `out` with `v`. */
export function fillBars(out: Float32Array, v: number): void {
  out.fill(v);
}

/**
 * Simulated voice for caption-only mode: a soft moving wave, taller in the
 * middle, scaled by `level` (0..1). `t` in seconds.
 */
export function simulatedBars(t: number, level: number, out: Float32Array): void {
  const n = out.length;
  for (let i = 0; i < n; i++) {
    const envelope = Math.pow(Math.sin((Math.PI * (i + 0.5)) / n), 0.6);
    const a = 0.5 + 0.5 * Math.sin(t * 2.1 + i * 0.55);
    const b = 0.5 + 0.5 * Math.sin(t * 3.7 - i * 0.31);
    out[i] = level * envelope * (0.35 + 0.65 * a * b);
  }
}

/**
 * How loud the simulated voice is at time t, from the cue timing: speaking
 * from a cue's start until the section [pause] before the next cue, quiet
 * in that pause.
 */
export function speechLevel(t: number, starts: readonly number[], total: number, pause = 1): number {
  let i = 0;
  for (let k = 0; k < starts.length; k++) if (starts[k] <= t) i = k;
  if (t < (starts[0] ?? 0) || t >= total) return 0;
  const end = i + 1 < starts.length ? starts[i + 1] - pause : total;
  return t < end ? 0.8 : 0.12;
}

/** What the wave shows. */
export function waveMode(o: { playing: boolean; reduced: boolean; live: boolean }): WaveMode {
  if (o.reduced) return "static";
  if (!o.playing) return "settle";
  return o.live ? "live" : "simulated";
}

/** Mean height of the bars (the reduced-motion level meter). */
export function meterLevel(bars: ArrayLike<number>): number {
  let sum = 0;
  for (let i = 0; i < bars.length; i++) sum += bars[i];
  return bars.length ? sum / bars.length : 0;
}

/**
 * A frame loop that runs while `frame` returns true and can be stopped from
 * outside (paused, page hidden). raf/caf are injectable for tests.
 */
export function createFrameLoop(
  frame: (time: number) => boolean,
  raf: (cb: (time: number) => void) => number = (cb) => requestAnimationFrame(cb),
  caf: (id: number) => void = (id) => cancelAnimationFrame(id),
) {
  let id = 0;
  let running = false;
  const tick = (time: number) => {
    if (!running) return;
    if (frame(time)) id = raf(tick);
    else running = false;
  };
  return {
    start() {
      if (running) return;
      running = true;
      id = raf(tick);
    },
    stop() {
      if (!running) return;
      running = false;
      caf(id);
    },
    get running() {
      return running;
    },
  };
}
