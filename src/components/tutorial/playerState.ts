/**
 * The demo player's control state, as a pure reducer: play, pause (by the
 * viewer or because the demo left the screen), previous and next action,
 * seek, replay and the end frame. ScenePlayer drives its animation from this
 * state; PlayerControls only shows it. Also the labels the controls read out
 * and the "What happens here" items. Pure, so the tests cover every boundary.
 *
 * Positions: `at` is the index of the cursor op on screen (-1 before the
 * first one, `lastOp + 1` on the end frame). Actions ("stops") are the ops a
 * viewer steps between (sceneUtils.stopIndices).
 */
import { captionsOf, collectIds } from "./sceneUtils";
import type { Timeline } from "./timeline";
import type { Scene } from "./types";

export type PlayMode = "playing" | "paused" | "ended";
/** Who paused: the viewer, or the page (the demo scrolled off screen). */
export type PauseCause = "user" | "view";

export interface PlayerState {
  mode: PlayMode;
  /** Op on screen: -1 before the first, lastOp + 1 on the end frame. */
  at: number;
  /** Op indices of the actions, ascending. */
  stops: number[];
  /** Index of the script's last op (-1 for an empty script). */
  lastOp: number;
  pausedBy: PauseCause | null;
  /** Op the next run starts from (resume after a pause). */
  startFrom: number;
  /** Bumped to restart the run from the top. */
  runKey: number;
  /** Reduced motion: nothing animates; the end frame or one action at a time. */
  reduced: boolean;
}

export type PlayerAction =
  | { type: "reach"; at: number }
  | { type: "pause"; by?: PauseCause }
  | { type: "play" }
  | { type: "next" }
  | { type: "prev" }
  | { type: "seek"; stop: number }
  | { type: "replay" }
  | { type: "end" }
  | { type: "view"; visible: boolean }
  | { type: "reset"; stops: number[]; lastOp: number; reduced: boolean };

export function initPlayer(stops: number[], lastOp: number, reduced: boolean, runKey = 0): PlayerState {
  return reduced
    ? { mode: "ended", at: lastOp + 1, stops, lastOp, pausedBy: null, startFrom: 0, runKey, reduced }
    : { mode: "playing", at: -1, stops, lastOp, pausedBy: null, startFrom: 0, runKey, reduced };
}

const pausedAt = (s: PlayerState, at: number, by: PauseCause = "user"): PlayerState => ({ ...s, mode: "paused", at, pausedBy: by });

const ended = (s: PlayerState): PlayerState => ({ ...s, mode: "ended", at: s.lastOp + 1, pausedBy: null });

const restart = (s: PlayerState): PlayerState =>
  s.reduced ? ended(s) : { ...s, mode: "playing", at: -1, pausedBy: null, startFrom: 0, runKey: s.runKey + 1 };

export function playerReducer(s: PlayerState, a: PlayerAction): PlayerState {
  switch (a.type) {
    case "reset":
      return initPlayer(a.stops, a.lastOp, a.reduced, s.runKey + 1);
    case "reach":
      return s.mode === "playing" && a.at !== s.at ? { ...s, at: a.at } : s;
    case "pause": {
      const by = a.by ?? "user";
      if (s.mode === "paused") return s.pausedBy === by || by === "view" ? s : { ...s, pausedBy: by };
      if (s.mode !== "playing") return s;
      // Still in the lead-in: a viewer's pause holds the first action.
      if (s.at < 0) return by === "user" && s.stops.length ? pausedAt(s, s.stops[0], by) : s;
      return pausedAt(s, s.at, by);
    }
    case "view":
      if (!a.visible) return s.mode === "playing" && s.at >= 0 ? pausedAt(s, s.at, "view") : s;
      if (s.mode === "paused" && s.pausedBy === "view") return resumeFrom(s);
      return s;
    case "play":
      if (s.reduced) return s;
      if (s.mode === "paused") return resumeFrom(s);
      if (s.mode === "ended") return restart(s);
      return s;
    case "next": {
      const to = s.stops.find((i) => i > s.at);
      return to === undefined ? s : pausedAt(s, to);
    }
    case "prev": {
      const to = [...s.stops].reverse().find((i) => i < s.at);
      return to === undefined ? s : pausedAt(s, to);
    }
    case "seek": {
      if (!s.stops.length) return s;
      const k = Math.max(0, Math.min(s.stops.length - 1, Math.floor(a.stop)));
      return pausedAt(s, s.stops[k]);
    }
    case "replay":
      return restart(s);
    case "end":
      return ended(s);
    default:
      return s;
  }
}

function resumeFrom(s: PlayerState): PlayerState {
  if (s.at + 1 > s.lastOp) return restart(s);
  return { ...s, mode: "playing", pausedBy: null, startFrom: s.at + 1 };
}

/** Index of the current action in `stops`: -1 before the first, stops.length on the end frame. */
export function actionPosition(s: Pick<PlayerState, "at" | "stops" | "lastOp">): number {
  if (s.at > s.lastOp) return s.stops.length;
  let k = -1;
  s.stops.forEach((op, i) => {
    if (op <= s.at) k = i;
  });
  return k;
}

export const canPrev = (s: PlayerState) => s.stops.some((i) => i < s.at);
export const canNext = (s: PlayerState) => s.stops.some((i) => i > s.at);

/**
 * What the controls show. A demo held because it left the screen looks as if
 * it is still playing, so nothing changes under the viewer's eyes.
 */
export function shownMode(s: Pick<PlayerState, "mode" | "pausedBy">): PlayMode {
  return s.mode === "paused" && s.pausedBy === "view" ? "playing" : s.mode;
}

// ─── Labels ─────────────────────────────────────────────────────────────────

/** "Action 2 of 5: Close task" (scrubber segments). */
export function actionLabel(index: number, count: number, name: string): string {
  return `Action ${index + 1} of ${count}${name ? `: ${name}` : ""}`;
}

/** "Step 2 of 4: Results" (step dots). */
export function stepLabel(index: number, count: number, title: string): string {
  return `Step ${index + 1} of ${count}${title ? `: ${title}` : ""}`;
}

/** "Action 2 of 5 · Step 1 of 3". Either part is left out when there is nothing to count. */
export function positionText(p: { action: number; actions: number; step?: number; steps?: number }): string {
  const parts: string[] = [];
  if (p.actions > 0) parts.push(`Action ${Math.min(p.actions, Math.max(1, p.action + 1))} of ${p.actions}`);
  if (p.steps && p.steps > 1 && p.step !== undefined) parts.push(`Step ${p.step + 1} of ${p.steps}`);
  return parts.join(" · ");
}

// ─── Actions and their names ────────────────────────────────────────────────

/** The name of each action (stop), for the scrubber: its caption name, else its target's label. */
export function stopNames(scene: Scene, stops: number[]): string[] {
  const caps = new Map(captionsOf(scene).map((c) => [c.opIndex, c.name]));
  const ids = collectIds(scene.root);
  return stops.map((i) => {
    const op = scene.script?.[i];
    const fromTarget = typeof op?.to === "string" ? ids.get(op.to)?.label : undefined;
    return caps.get(i) || op?.label || fromTarget || "Action";
  });
}

/**
 * How long each action is on screen while the demo plays (ms), from its
 * caption appearing to the next one appearing: drives the scrubber fill.
 */
export function stopDurations(timeline: Timeline, stops: number[]): number[] {
  const shownAt = (op: number) => {
    const seg = timeline.segments[op];
    return seg ? seg.start + seg.travel : timeline.end;
  };
  return stops.map((op, k) => Math.max(0, (k + 1 < stops.length ? shownAt(stops[k + 1]) : timeline.end) - shownAt(op)));
}

export interface ExplainItem {
  opIndex: number;
  n: number;
  name: string;
  explain: string;
  /** "1. Name: explanation", as it reads and copies. */
  text: string;
}

/** The "What happens here" list: one numbered line per action, never empty. */
export function explainItems(scene: Scene): ExplainItem[] {
  return captionsOf(scene)
    .map((c) => {
      const name = c.name.trim();
      const explain = (c.explain || c.terse).trim();
      return { opIndex: c.opIndex, n: c.n, name, explain, text: `${c.n}. ${name}: ${explain}` };
    })
    .filter((c) => c.name && c.explain);
}
