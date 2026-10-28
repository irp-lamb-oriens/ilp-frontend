/**
 * BOARDS: keyboard drag on a board, as a pure reducer (tests/boards.test.mjs).
 *
 *   Space on a card           → pick it up (Enter still opens it)
 *   ← / →                     → choose the column it will land in (columns it may not enter are skipped)
 *   ↑ / ↓                     → choose its place in that column
 *   Space or Enter            → drop (a move when the column changed)
 *   Esc                       → put it back
 *
 * Each step returns the text screen readers hear.
 */

export interface KbColumn {
  id: string;
  label: string;
  /** Cards loaded in the column (where the card may be placed). */
  count: number;
}

export type KbState =
  | { mode: "idle" }
  | { mode: "lifted"; cardId: string; cardLabel: string; from: string; to: string; index: number };

export type KbAction =
  | { type: "lift"; cardId: string; cardLabel: string; from: string; index: number }
  | { type: "left" | "right" | "up" | "down" }
  | { type: "drop" }
  | { type: "cancel" };

export interface KbContext {
  columns: KbColumn[];
  /** Columns the lifted card may enter (default: every column). */
  allowed?: string[] | null;
}

export interface KbResult {
  state: KbState;
  /** For the live region. */
  announce?: string;
  /** Set on a drop into another column. */
  move?: { cardId: string; from: string; to: string; index: number };
}

export const KB_IDLE: KbState = { mode: "idle" };

const labelOf = (ctx: KbContext, id: string) => ctx.columns.find((c) => c.id === id)?.label ?? id;

/** Card count in a column, as the lifted card sees it (it does not count itself in its own column). */
function slots(ctx: KbContext, s: Extract<KbState, { mode: "lifted" }>, col: string): number {
  const n = ctx.columns.find((c) => c.id === col)?.count ?? 0;
  return col === s.from ? Math.max(0, n - 1) : n;
}

export function boardKeyboardReducer(state: KbState, action: KbAction, ctx: KbContext): KbResult {
  if (action.type === "lift") {
    if (state.mode === "lifted") return { state };
    const next: KbState = { mode: "lifted", cardId: action.cardId, cardLabel: action.cardLabel, from: action.from, to: action.from, index: action.index };
    return {
      state: next,
      announce: `Picked up ${action.cardLabel} in ${labelOf(ctx, action.from)}. Use the left and right arrow keys to choose a column, Space to drop, Escape to cancel.`,
    };
  }
  if (state.mode !== "lifted") return { state };
  switch (action.type) {
    case "left":
    case "right": {
      const order = ctx.columns.map((c) => c.id);
      const ok = (id: string) => id === state.from || !ctx.allowed || ctx.allowed.includes(id);
      let i = order.indexOf(state.to);
      const step = action.type === "left" ? -1 : 1;
      for (let j = i + step; j >= 0 && j < order.length; j += step) {
        if (ok(order[j])) {
          i = j;
          break;
        }
      }
      const to = order[i];
      if (to === state.to) return { state, announce: `${labelOf(ctx, to)} is the ${action.type === "left" ? "first" : "last"} column it can go to.` };
      const next = { ...state, to, index: 0 };
      return { state: next, announce: `Over ${labelOf(ctx, to)}${to === state.from ? ", where it started" : ""}. Position 1 of ${slots(ctx, next, to) + 1}.` };
    }
    case "up":
    case "down": {
      const max = slots(ctx, state, state.to);
      const index = Math.max(0, Math.min(max, state.index + (action.type === "up" ? -1 : 1)));
      if (index === state.index) return { state };
      return { state: { ...state, index }, announce: `Position ${index + 1} of ${max + 1} in ${labelOf(ctx, state.to)}.` };
    }
    case "drop": {
      if (state.to === state.from) return { state: KB_IDLE, announce: `${state.cardLabel} dropped back in ${labelOf(ctx, state.from)}. Nothing changed.` };
      return {
        state: KB_IDLE,
        announce: `Moving ${state.cardLabel} to ${labelOf(ctx, state.to)}.`,
        move: { cardId: state.cardId, from: state.from, to: state.to, index: state.index },
      };
    }
    case "cancel":
      return { state: KB_IDLE, announce: `Move cancelled. ${state.cardLabel} stays in ${labelOf(ctx, state.from)}.` };
  }
  return { state };
}

/** Key → action while a card has focus. Null: the key is not ours. */
export function keyToAction(key: string, lifted: boolean): KbAction["type"] | null {
  if (key === " " || key === "Spacebar") return lifted ? "drop" : "lift";
  // Enter opens a card; while one is lifted it drops it.
  if (key === "Enter") return lifted ? "drop" : null;
  if (!lifted) return null;
  if (key === "Escape") return "cancel";
  if (key === "ArrowLeft") return "left";
  if (key === "ArrowRight") return "right";
  if (key === "ArrowUp") return "up";
  if (key === "ArrowDown") return "down";
  return null;
}

/** Put a card into its column (top, or at `index`) and out of every other one. Pure; used by the board's optimistic moves. */
export function placeCard<T>(columns: Record<string, T[]>, card: T, to: string, keyOf: (t: T) => string, index = 0): Record<string, T[]> {
  const id = keyOf(card);
  const out: Record<string, T[]> = {};
  for (const [col, items] of Object.entries(columns)) {
    const rest = items.filter((x) => keyOf(x) !== id);
    if (col === to) {
      const at = Math.max(0, Math.min(index, rest.length));
      out[col] = [...rest.slice(0, at), card, ...rest.slice(at)];
    } else out[col] = rest;
  }
  return out;
}
