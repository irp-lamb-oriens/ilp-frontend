/**
 * Narrator state machine (landing narrator). Pure: the component dispatches
 * events and runs the side effects (audio, scroll, analytics) from the state.
 *
 * One audio track per landing. `index` is the cue playing now. It moves in
 * two ways: "reach" when the audio's time crosses the next cue's start (no
 * seek), and "seek" (start, previous, next), which bumps `seek` so the
 * component moves the audio to that cue's start. Every index change scrolls
 * the page to the cue's section.
 *
 * idle -> playing (start) -> paused (pause button, or the visitor scrolls)
 * -> playing (resume, from the same moment) ... -> done at the end.
 */

export type NarratorStatus = "idle" | "playing" | "paused" | "done";
export type PauseReason = "button" | "user-scroll";

export interface NarratorState {
  status: NarratorStatus;
  index: number;
  /** Goes up on every seek (start, previous, next). */
  seek: number;
  pausedBy: PauseReason | null;
  captions: boolean;
  muted: boolean;
}

export type NarratorEvent =
  | { type: "start" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "toggle" }
  | { type: "user-scroll" }
  | { type: "reach"; index: number }
  | { type: "next" }
  | { type: "prev" }
  | { type: "end" }
  | { type: "exit" }
  | { type: "toggle-captions" }
  | { type: "toggle-mute" };

export const initialNarratorState: NarratorState = {
  status: "idle",
  index: 0,
  seek: 0,
  pausedBy: null,
  captions: true,
  muted: false,
};

const seekTo = (s: NarratorState, index: number): NarratorState => ({ ...s, status: "playing", index, seek: s.seek + 1, pausedBy: null });

/** Next state. `count` is the number of cues on the page. */
export function narratorReducer(s: NarratorState, e: NarratorEvent, count: number): NarratorState {
  const last = count - 1;
  const active = s.status === "playing" || s.status === "paused";
  switch (e.type) {
    case "start":
      return seekTo(s, 0);
    case "pause":
      return s.status === "playing" ? { ...s, status: "paused", pausedBy: "button" } : s;
    case "user-scroll":
      return s.status === "playing" ? { ...s, status: "paused", pausedBy: "user-scroll" } : s;
    case "resume":
      return s.status === "paused" ? { ...s, status: "playing", pausedBy: null } : s;
    case "toggle":
      if (s.status === "playing") return { ...s, status: "paused", pausedBy: "button" };
      if (s.status === "paused") return { ...s, status: "playing", pausedBy: null };
      return seekTo(s, 0);
    case "reach": {
      if (s.status !== "playing") return s;
      const index = Math.min(Math.max(0, e.index), last);
      return index === s.index ? s : { ...s, index };
    }
    case "next":
      if (!active) return s;
      return s.index >= last ? { ...s, status: "done", pausedBy: null } : seekTo(s, s.index + 1);
    case "prev":
      return active ? seekTo(s, Math.max(0, s.index - 1)) : s;
    case "end":
      return active ? { ...s, status: "done", pausedBy: null } : s;
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
