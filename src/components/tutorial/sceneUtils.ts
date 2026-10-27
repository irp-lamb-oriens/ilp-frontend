/**
 * Scene helpers shared by the renderer, the player and the tests: id
 * collection, state patches, the reduced-motion end state and the plain
 * description of what the cursor does. Pure.
 */
import type { CursorOp, CursorScript, MockNode, PatchValue, Scene, StateChange, TermRef, TutorialStep } from "./types";

export interface Overrides {
  /** Field patches by node or sub-item id. */
  patch: Record<string, Record<string, PatchValue>>;
  /** Board card id → column id. */
  moves: Record<string, string>;
}

export const EMPTY_OVERRIDES: Overrides = { patch: {}, moves: {} };

export interface IdInfo {
  kind: string;
  label: string;
}

function textOf(n: Record<string, unknown>): string {
  for (const k of ["label", "title", "text", "term", "value", "placeholder", "author"]) {
    const v = n[k];
    if (typeof v === "string" && v) return v;
  }
  return "";
}

/** Every id in the tree, including table rows, list items, board columns and cards. */
export function collectIds(root: MockNode): Map<string, IdInfo> {
  const ids = new Map<string, IdInfo>();
  const add = (id: string | undefined, kind: string, label: string) => {
    if (!id) return;
    if (ids.has(id)) throw new Error(`Duplicate mock id "${id}"`);
    ids.set(id, { kind, label });
  };
  const walk = (n: MockNode) => {
    add(n.id, n.type, textOf(n as unknown as Record<string, unknown>));
    switch (n.type) {
      case "frame":
        n.actions?.forEach(walk);
        walk(n.body);
        n.overlays?.forEach(walk);
        break;
      case "stack":
      case "row":
      case "grid":
      case "drawer":
      case "dialog":
        n.children.forEach(walk);
        break;
      case "card":
        n.children?.forEach(walk);
        break;
      case "table":
        n.rows.forEach((r) => {
          const first = r.cells[0];
          add(r.id, "row", typeof first === "string" ? first : "");
          r.cells.forEach((c) => typeof c !== "string" && walk(c));
        });
        break;
      case "list":
        n.items.forEach((i) => add(i.id, "item", i.title));
        break;
      case "board":
        n.columns.forEach((c) => {
          add(c.id, "column", c.title);
          c.cards.forEach((k) => add(k.id, "card", k.title));
        });
        break;
      case "timeline":
        n.items.forEach((i) => add(i.id, "entry", i.title));
        break;
      case "tabs":
        n.tabs.forEach((t) => add(t.id, "tab", t.label));
        break;
      case "menu":
        n.items.forEach((i) => add(i.id, "menuitem", i.label));
        break;
      case "deflist":
        n.items.forEach((i) => add(i.id, "term", i.term));
        break;
      default:
        break;
    }
  };
  walk(root);
  return ids;
}

/** Every id a script points at: targets, drop columns and state-change ids. */
export function scriptRefs(script: CursorScript | undefined): string[] {
  const out: string[] = [];
  for (const op of script ?? []) {
    if (typeof op.to === "string") out.push(op.to);
    if (op.dest) out.push(op.dest);
    for (const c of op.then ?? []) {
      out.push(c.id);
      if (c.moveTo) out.push(c.moveTo);
    }
  }
  return out;
}

/** Ids the script references that the scene does not contain. */
export function missingRefs(scene: Scene): string[] {
  const ids = collectIds(scene.root);
  return scriptRefs(scene.script).filter((id) => !ids.has(id));
}

export function applyChanges(o: Overrides, changes: StateChange[] | undefined): Overrides {
  if (!changes || changes.length === 0) return o;
  const patch = { ...o.patch };
  const moves = { ...o.moves };
  for (const c of changes) {
    if (c.set) patch[c.id] = { ...(patch[c.id] ?? {}), ...c.set };
    if (c.moveTo) moves[c.id] = c.moveTo;
  }
  return { patch, moves };
}

/** The changes an op makes when it finishes (typing writes the value first). */
export function opChanges(op: CursorOp): StateChange[] {
  const out: StateChange[] = [];
  if (op.op === "type" && typeof op.to === "string" && op.text !== undefined) {
    out.push({ id: op.to, set: { value: op.text, focused: false } });
  }
  if (op.op === "drag" && typeof op.to === "string" && op.dest) out.push({ id: op.to, moveTo: op.dest });
  return [...out, ...(op.then ?? [])];
}

/** State after the whole script: the reduced-motion frame. */
export function endState(script: CursorScript | undefined): Overrides {
  let o = EMPTY_OVERRIDES;
  for (const op of script ?? []) o = applyChanges(o, opChanges(op));
  return o;
}

export interface Marker {
  n: number;
  id: string;
  text: string;
}

const VERB: Partial<Record<CursorOp["op"], string>> = {
  click: "Select",
  hover: "Point at",
  type: "Type in",
  drag: "Drag",
};

function nameFor(op: CursorOp, ids: Map<string, IdInfo>): string {
  if (op.label) return op.label;
  if (typeof op.to === "string") return ids.get(op.to)?.label || op.to;
  return "the screen";
}

function sentence(op: CursorOp, ids: Map<string, IdInfo>): string | null {
  const name = nameFor(op, ids);
  switch (op.op) {
    case "click":
      return `selects “${name}”.`;
    case "hover":
      return `points at “${name}”.`;
    case "type":
      return `types “${op.text ?? ""}”${op.label ? "" : ` into “${name}”`}.`;
    case "drag": {
      const dest = op.dest ? ids.get(op.dest)?.label ?? op.dest : "another column";
      return `drags “${name}” to “${dest}”.`;
    }
    case "scroll":
      return typeof op.to === "string" ? `scrolls to “${name}”.` : "scrolls down.";
    default:
      return null;
  }
}

/** Short text for screen readers: what the cursor does in this scene. */
export function describeScene(scene: Scene): string {
  const ids = collectIds(scene.root);
  const parts = (scene.script ?? []).map((op) => sentence(op, ids)).filter((s): s is string => !!s);
  return parts.length ? `The demo ${parts.join(" Then it ")}` : "";
}

/** Numbered markers for the reduced-motion frame: one per action on a node. */
export function markers(scene: Scene): Marker[] {
  return captionsOf(scene)
    .filter((c) => c.id !== null)
    .map((c) => ({ n: c.n, id: c.id as string, text: c.terse }));
}

// ─── Captions ───────────────────────────────────────────────────────────────

/** Ops that do not count as an action on their own (unless they carry a caption). */
const PASSIVE = new Set<CursorOp["op"]>(["move", "wait", "scroll"]);

/** True when the op is something a person would do (or it explains something). */
export function isAction(op: CursorOp): boolean {
  return !!op.explain || !PASSIVE.has(op.op);
}

/** Op indices the paused player steps between with ← / →. */
export function stopIndices(script: CursorScript | undefined): number[] {
  const out: number[] = [];
  (script ?? []).forEach((op, i) => {
    if (isAction(op)) out.push(i);
  });
  return out;
}

/** Every term an op offers: `terms` first, then `term`. */
export function termsOf(op: CursorOp): TermRef[] {
  const out = [...(op.terms ?? [])];
  if (op.term && !out.some((t) => sameTerm(t, op.term as TermRef))) out.push(op.term);
  return out;
}

function sameTerm(a: TermRef, b: TermRef): boolean {
  return (a.key ?? a.word.toLowerCase()) === (b.key ?? b.word.toLowerCase());
}

export interface CaptionInfo {
  /** Index of the op in the script. */
  opIndex: number;
  /** Number shared with the reduced-motion marker. */
  n: number;
  /** Target node id, or null when the op has none. */
  id: string | null;
  /** Element name, bold in the caption. */
  name: string;
  /** Plain-language explanation; empty for ops written before captions existed. */
  explain: string;
  /** The terse fallback ("Select “Close task”"). */
  terse: string;
  terms: TermRef[];
}

/** The ordered captions of a scene: one per action, numbered like the markers. */
export function captionsOf(scene: Scene): CaptionInfo[] {
  const ids = collectIds(scene.root);
  const out: CaptionInfo[] = [];
  (scene.script ?? []).forEach((op, opIndex) => {
    const verb = VERB[op.op];
    const targeted = typeof op.to === "string";
    if (!op.explain && (!verb || !targeted)) return;
    const name = nameFor(op, ids);
    const terse = op.op === "type" ? `Type “${op.text ?? ""}”` : verb ? `${verb} “${name}”` : name;
    out.push({ opIndex, n: out.length + 1, id: targeted ? (op.to as string) : null, name, explain: op.explain ?? "", terse, terms: termsOf(op) });
  });
  return out;
}

export const MAX_TERMS = 3;

/**
 * For each step and op, the terms used there for the first time in the
 * tutorial. The player offers only these under the caption, so a meaning is
 * shown once per tutorial.
 */
export function firstUseTerms(steps: TutorialStep[]): TermRef[][][] {
  const seen: TermRef[] = [];
  return steps.map((st) =>
    (st.scene.script ?? []).map((op) => {
      // At most three meanings under one caption; the rest wait for a later caption.
      const fresh = termsOf(op)
        .filter((t) => !seen.some((x) => sameTerm(x, t)))
        .slice(0, MAX_TERMS);
      seen.push(...fresh);
      return fresh;
    }),
  );
}

/** State after ops 0..index (inclusive): the frame the paused player shows. */
export function stateThrough(script: CursorScript | undefined, index: number): Overrides {
  return endState((script ?? []).slice(0, Math.max(0, index + 1)));
}

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export type CalloutSide = "below" | "above" | "right" | "left" | "inside";

/**
 * Where to put a caption of size `bubble` next to `target`, inside an area
 * of `area` size. Tries below, above, right, then left; if none fits, it
 * takes the roomiest side and clamps into the area. Pure, for the tests.
 */
export function placeCallout(target: Rect, area: { width: number; height: number }, bubble: { width: number; height: number }, gap = 14, pad = 8): { x: number; y: number; side: CalloutSide } {
  const W = area.width;
  const H = area.height;
  const bw = Math.min(bubble.width, W - pad * 2);
  const bh = bubble.height;
  const clampX = (x: number) => Math.max(pad, Math.min(W - pad - bw, x));
  const clampY = (y: number) => Math.max(pad, Math.min(H - pad - bh, y));
  const cx = target.left + target.width / 2;
  const cy = target.top + target.height / 2;
  const bottom = target.top + target.height;
  const right = target.left + target.width;
  const below = { x: clampX(cx - bw / 2), y: bottom + gap, side: "below" as const };
  if (below.y + bh <= H - pad) return below;
  const above = { x: clampX(cx - bw / 2), y: target.top - gap - bh, side: "above" as const };
  if (above.y >= pad) return above;
  const rightP = { x: right + gap, y: clampY(cy - bh / 2), side: "right" as const };
  if (rightP.x + bw <= W - pad) return rightP;
  const leftP = { x: target.left - gap - bw, y: clampY(cy - bh / 2), side: "left" as const };
  if (leftP.x >= pad) return leftP;
  const roomBelow = H - bottom;
  const roomAbove = target.top;
  return { x: clampX(cx - bw / 2), y: clampY(roomBelow >= roomAbove ? bottom + gap : target.top - gap - bh), side: "inside" };
}
