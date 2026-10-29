/**
 * Narrator state machine (landing narrator). Pure: the component dispatches
 * events and runs the side effects (audio, scroll, analytics) from the state.
 *
 * idle -> playing (start) -> paused (pause button, or the visitor scrolls)
 * -> playing (resume, from the same point of the same cue) ... -> done after
 * the last cue ends. Every time a cue (re)starts, `epoch` goes up, so the
 * component restarts audio and scroll even when the index stays the same.
 */

export type NarratorStatus = "idle" | "playing" | "paused" | "done";
export type PauseReason = "button" | "user-scroll";

export interface NarratorState {
  status: NarratorStatus;
  index: number;
  epoch: number;
  pausedBy: PauseReason | null;
  captions: boolean;
  muted: boolean;
}

export type NarratorEvent =
  | { type: "start"; index?: number }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "toggle" }
  | { type: "user-scroll" }
  | { type: "cue-end" }
  | { type: "next" }
  | { type: "prev" }
  | { type: "exit" }
  | { type: "toggle-captions" }
  | { type: "toggle-mute" };

export const initialNarratorState: NarratorState = {
  status: "idle",
  index: 0,
  epoch: 0,
  pausedBy: null,
  captions: true,
  muted: false,
};

const go = (s: NarratorState, index: number): NarratorState => ({ ...s, status: "playing", index, epoch: s.epoch + 1, pausedBy: null });

/** Next state. `count` is the number of cues on the page. */
export function narratorReducer(s: NarratorState, e: NarratorEvent, count: number): NarratorState {
  const last = count - 1;
  const active = s.status === "playing" || s.status === "paused";
  switch (e.type) {
    case "start":
      return go(s, Math.min(Math.max(0, e.index ?? 0), last));
    case "pause":
      return s.status === "playing" ? { ...s, status: "paused", pausedBy: "button" } : s;
    case "user-scroll":
      return s.status === "playing" ? { ...s, status: "paused", pausedBy: "user-scroll" } : s;
    case "resume":
      return s.status === "paused" ? { ...s, status: "playing", pausedBy: null } : s;
    case "toggle":
      if (s.status === "playing") return { ...s, status: "paused", pausedBy: "button" };
      if (s.status === "paused") return { ...s, status: "playing", pausedBy: null };
      return go(s, 0);
    case "cue-end":
    case "next":
      if (!active) return s;
      return s.index >= last ? { ...s, status: "done", pausedBy: null } : go(s, s.index + 1);
    case "prev":
      return active ? go(s, Math.max(0, s.index - 1)) : s;
    case "exit":
      return { ...s, status: "idle", index: 0, pausedBy: null };
    case "toggle-captions":
      return { ...s, captions: !s.captions };
    case "toggle-mute":
      return { ...s, muted: !s.muted };
    default:
      return s;
  }
}
