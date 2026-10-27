/**
 * Cursor script timing. Pure: turns a CursorScript into segments with start
 * and end times, so the player and the tests agree on one timeline.
 *
 * Each op has two parts: travel (the cursor glides to the target) and action
 * (press, typing, dragging, scrolling, waiting). State changes in `then`
 * land at the segment's end. After the last op the scene holds for
 * `loopPause`, resets and plays again.
 */
import type { CursorOp, CursorScript } from "./types";

export const TIMING = {
  /** Pause before the first op so the scene can be read. */
  lead: 700,
  travel: 650,
  /** Travel when the cursor is already on the target. */
  travelSame: 0,
  click: 320,
  hover: 500,
  typeLead: 200,
  typeChar: 45,
  drag: 950,
  scroll: 750,
  wait: 700,
  /** After an op changes the scene (a drawer opens), before the next op measures it. */
  settle: 320,
  loopPause: 2200,
} as const;

export interface Segment {
  index: number;
  op: CursorOp;
  start: number;
  /** Travel ends (action starts) at start + travel. */
  travel: number;
  action: number;
  /** Pause after the state changes land. */
  settle: number;
  end: number;
}

export interface Timeline {
  segments: Segment[];
  /** End of the last op (before the loop pause). */
  end: number;
  /** One full loop including the pause. */
  total: number;
}

function sameTarget(a: CursorOp["to"], b: CursorOp["to"]): boolean {
  if (a === undefined || b === undefined) return false;
  if (typeof a === "string" || typeof b === "string") return a === b;
  return a.x === b.x && a.y === b.y;
}

function travelFor(op: CursorOp, prev: CursorOp["to"]): number {
  if (op.op === "wait" || op.op === "scroll" || op.to === undefined) return 0;
  return sameTarget(op.to, prev) ? TIMING.travelSame : TIMING.travel;
}

export function actionFor(op: CursorOp): number {
  if (typeof op.duration === "number") return Math.max(0, op.duration);
  switch (op.op) {
    case "move":
      return 0;
    case "click":
      return TIMING.click;
    case "hover":
      return TIMING.hover;
    case "type":
      return TIMING.typeLead + (op.text?.length ?? 0) * TIMING.typeChar;
    case "drag":
      return TIMING.drag;
    case "scroll":
      return TIMING.scroll;
    case "wait":
      return TIMING.wait;
    default:
      return 0;
  }
}

export function computeTimeline(script: CursorScript | undefined): Timeline {
  const segments: Segment[] = [];
  let t = script && script.length ? TIMING.lead : 0;
  let at: CursorOp["to"] = undefined;
  (script ?? []).forEach((op, index) => {
    const travel = travelFor(op, at);
    const action = actionFor(op);
    const settle = (op.then && op.then.length > 0) || op.op === "drag" ? TIMING.settle : 0;
    segments.push({ index, op, start: t, travel, action, settle, end: t + travel + action + settle });
    t += travel + action + settle;
    // A drag leaves the cursor on the destination column, not on the card.
    if (op.op === "drag" && op.dest) at = op.dest;
    else if (op.to !== undefined && op.op !== "scroll") at = op.to;
  });
  return { segments, end: t, total: segments.length ? t + TIMING.loopPause : 0 };
}

/** Characters of `text` visible `elapsed` ms into a type action. */
export function typedAt(text: string, elapsed: number): string {
  if (elapsed <= TIMING.typeLead) return "";
  const n = Math.floor((elapsed - TIMING.typeLead) / TIMING.typeChar) + 1;
  return text.slice(0, Math.max(0, Math.min(text.length, n)));
}
