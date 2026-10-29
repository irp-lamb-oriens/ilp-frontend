/**
 * Web Audio graph for the narrator's voice wave: the narrator's audio
 * element -> AnalyserNode -> speakers. Created only from the visitor's
 * click on Start (browsers allow an AudioContext to run only after a user
 * gesture), once per audio element: an element can feed only one
 * MediaElementSource. The audio files are same-origin, so the analyser can
 * read them.
 */
import { FFT_SIZE, SMOOTHING } from "./wave";

export interface VoiceGraph {
  ctx: AudioContext;
  analyser: AnalyserNode;
}

type Ctor = new () => AudioContext;

const graphs = new WeakMap<HTMLMediaElement, VoiceGraph>();

/** The browser's AudioContext constructor, or null. */
export function audioContextCtor(): Ctor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { AudioContext?: Ctor; webkitAudioContext?: Ctor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/**
 * The analyser graph for `audio`, created on first call. Returns null when
 * Web Audio is missing or fails; the audio then plays on its own.
 */
export function voiceGraph(audio: HTMLMediaElement, Ctx: Ctor | null = audioContextCtor()): VoiceGraph | null {
  const existing = graphs.get(audio);
  if (existing) return existing;
  if (!Ctx) return null;
  try {
    const ctx = new Ctx();
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = SMOOTHING;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    const graph = { ctx, analyser };
    graphs.set(audio, graph);
    return graph;
  } catch {
    return null;
  }
}

/** Resume a suspended context (on play); never throws. */
export function resumeGraph(graph: VoiceGraph | null): void {
  if (graph && graph.ctx.state === "suspended") graph.ctx.resume().catch(() => undefined);
}
