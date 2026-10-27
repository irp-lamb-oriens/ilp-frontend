/**
 * Tutorial engine types. Interface-agnostic: a tutorial is plain data (steps,
 * a declarative mock scene per step, and a cursor script). Nothing here knows
 * about the dashboard, lawyer or status pages.
 *
 * Copy is plain strings so a locale map can replace them later
 * (see docs/workstreams/TUTORIALS.md).
 */

export type TutorialRole = "staff" | "lawyer" | "client";

export interface Tutorial {
  /** Stable id, e.g. "staff.today". Used as the storage key. */
  id: string;
  /** Bump to show the tutorial again to people who already saw it. */
  version: number;
  title: string;
  /** One line for the Tutorials list and the gallery. */
  summary?: string;
  audience?: TutorialRole[];
  /**
   * Route the tutorial belongs to. Strings match the whole path and accept
   * Next-style dynamic segments ("/dashboard/members/[id]").
   */
  route?: string | RegExp;
  /** Default "first-visit". */
  autoStart?: "first-visit" | "never";
  steps: TutorialStep[];
}

export interface TutorialStep {
  id: string;
  title: string;
  /** One or two short sentences. Must make sense without the animation. */
  body: string;
  scene: Scene;
  /** Optional data-tour value on the live page for "Show me on this page". */
  target?: string;
  /** What the cursor does, for screen readers. Generated from the script when omitted. */
  describe?: string;
}

/**
 * Scene size. "desktop" is a 960 × 600 frame, "wide" 960 × 540, "phone"
 * 390 × 720. The frame is scaled down to the modal width.
 */
export type SceneAspect = "desktop" | "wide" | "phone";

export interface Scene {
  aspect: SceneAspect;
  root: MockNode;
  script?: CursorScript;
}

// ─── Mock nodes ─────────────────────────────────────────────────────────────

export type MockTone = "neutral" | "info" | "success" | "warning" | "danger";

/** Fields every node accepts. State changes patch these too. */
export interface MockBase {
  /** Target for the cursor and for state changes. Unique within a scene. */
  id?: string;
  hidden?: boolean;
  /** Accent outline, e.g. the row the cursor just picked. */
  highlight?: boolean;
}

export interface MockPillSpec {
  label: string;
  tone?: MockTone;
}

export interface FrameNode extends MockBase {
  type: "frame";
  role: TutorialRole;
  /** Nav labels; defaults to the role's real navigation. */
  nav?: string[];
  active?: string;
  /** Page title (h1) in the page head. */
  title?: string;
  /** Right side of the page head. */
  actions?: MockNode[];
  /** Search placeholder in the top bar. Omit to hide the search. */
  search?: string;
  body: MockNode;
  /**
   * Drawers, dialogs, toasts and menus that sit above the page. They stay put
   * when the body scrolls.
   */
  overlays?: MockNode[];
}

export type GapSize = 1 | 2 | 3 | 4 | 6;

export interface StackNode extends MockBase {
  type: "stack";
  gap?: GapSize;
  children: MockNode[];
}

export interface RowNode extends MockBase {
  type: "row";
  gap?: GapSize;
  align?: "start" | "center" | "between" | "end";
  wrap?: boolean;
  children: MockNode[];
}

/** Column patterns as fr ratios. */
export type GridCols = "1-1" | "2-1" | "1-2" | "3-1" | "3-2" | "1-1-1" | "2-1-1" | "1-1-1-1" | "2-1-1-1" | "2-1-1-1-1";

export interface GridNode extends MockBase {
  type: "grid";
  cols: GridCols;
  gap?: GapSize;
  children: MockNode[];
}

export interface CardNode extends MockBase {
  type: "card";
  title?: string;
  /** Small line under the title. */
  meta?: string;
  /** "accent" is the soft light-blue surface (Next step, MRR). */
  tone?: "default" | "accent" | "mist";
  children?: MockNode[];
}

export interface StatTileNode extends MockBase {
  type: "statTile";
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "flat";
  hint?: string;
  size?: "md" | "lg";
}

export interface TableRow {
  id?: string;
  cells: Array<string | MockNode>;
  highlight?: boolean;
  hidden?: boolean;
}

export interface TableNode extends MockBase {
  type: "table";
  columns: string[];
  rows: TableRow[];
}

export interface ListItem {
  id?: string;
  /** Initials in a round avatar. "auto" derives them from the title. */
  avatar?: string;
  /** Left column text instead of an avatar, e.g. a time "9:30". */
  lead?: string;
  leadMeta?: string;
  title: string;
  meta?: string;
  /** Quoted line under the meta, e.g. the member's question. */
  quote?: string;
  pill?: MockPillSpec;
  pills?: MockPillSpec[];
  trailing?: string;
  highlight?: boolean;
  hidden?: boolean;
}

export interface ListNode extends MockBase {
  type: "list";
  items: ListItem[];
  /** "rows" = bordered rows (queues); "plain" = compact rail list. */
  variant?: "rows" | "plain";
}

export interface PillNode extends MockBase {
  type: "pill";
  label: string;
  tone?: MockTone;
  size?: "md" | "sm";
}

export interface ButtonNode extends MockBase {
  type: "button";
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "link";
  size?: "md" | "sm";
  pressed?: boolean;
  disabled?: boolean;
}

export interface InputNode extends MockBase {
  type: "input";
  label?: string;
  value?: string;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  /** Shows a chevron, like a Select. */
  select?: boolean;
  focused?: boolean;
}

export interface TimeRangeNode extends MockBase {
  type: "timeRange";
  label?: string;
  from: string;
  to: string;
}

export interface ChipNode extends MockBase {
  type: "chip";
  label: string;
  selected?: boolean;
}

export interface ToggleNode extends MockBase {
  type: "toggle";
  label: string;
  /** "switch" or "checkbox". */
  kind?: "switch" | "checkbox";
  on?: boolean;
}

export interface TextNode extends MockBase {
  type: "text";
  text: string;
  variant?: "h1" | "h2" | "h3" | "body" | "meta" | "label" | "eyebrow" | "strong" | "big";
}

export interface BoardCard {
  id?: string;
  title: string;
  meta?: string;
  pill?: MockPillSpec;
  badge?: MockPillSpec;
  highlight?: boolean;
  hidden?: boolean;
}

export interface BoardColumn {
  id?: string;
  title: string;
  highlight?: boolean;
  cards: BoardCard[];
}

export interface BoardNode extends MockBase {
  type: "board";
  columns: BoardColumn[];
}

export interface TimelineEntry {
  id?: string;
  title: string;
  meta?: string;
  state?: "done" | "current" | "upcoming";
  highlight?: boolean;
  hidden?: boolean;
}

export interface TimelineNode extends MockBase {
  type: "timeline";
  items: TimelineEntry[];
}

export interface ProgressNode extends MockBase {
  type: "progress";
  label: string;
  /** 0..1 */
  value: number;
  valueText?: string;
  tone?: "accent" | "success" | "warning";
}

export interface DrawerNode extends MockBase {
  type: "drawer";
  title: string;
  subtitle?: string;
  open?: boolean;
  children: MockNode[];
}

export interface DialogNode extends MockBase {
  type: "dialog";
  title: string;
  open?: boolean;
  children: MockNode[];
}

export interface ToastNode extends MockBase {
  type: "toast";
  text: string;
  visible?: boolean;
}

export interface TabsNode extends MockBase {
  type: "tabs";
  tabs: Array<{ id?: string; label: string }>;
  active: string;
}

export interface MenuNode extends MockBase {
  type: "menu";
  items: Array<{ id?: string; label: string; highlight?: boolean; hidden?: boolean }>;
  open?: boolean;
}

export interface MessageNode extends MockBase {
  type: "message";
  from: "me" | "team" | "ai";
  author: string;
  text: string;
  /** Small line, e.g. "Today 9:14" or the AI disclaimer. */
  meta?: string;
}

export interface DividerNode extends MockBase {
  type: "divider";
}

export interface DefListNode extends MockBase {
  type: "deflist";
  items: Array<{ id?: string; term: string; value: string; highlight?: boolean; hidden?: boolean }>;
}

export type MockNode =
  | FrameNode
  | StackNode
  | RowNode
  | GridNode
  | CardNode
  | StatTileNode
  | TableNode
  | ListNode
  | PillNode
  | ButtonNode
  | InputNode
  | TimeRangeNode
  | ChipNode
  | ToggleNode
  | TextNode
  | BoardNode
  | TimelineNode
  | ProgressNode
  | DrawerNode
  | DialogNode
  | ToastNode
  | TabsNode
  | MenuNode
  | MessageNode
  | DividerNode
  | DefListNode;

export type MockNodeType = MockNode["type"];

// ─── Cursor script ──────────────────────────────────────────────────────────

/** A patch to any node or sub-item (row, list item, board card) by id. */
export type PatchValue = string | number | boolean | MockPillSpec | undefined;

export interface StateChange {
  id: string;
  set?: Record<string, PatchValue>;
  /** Board cards only: move the card to this column id. */
  moveTo?: string;
}

export type CursorOpName = "move" | "hover" | "click" | "type" | "drag" | "scroll" | "wait";

export interface CursorPoint {
  /** 0..1 of the scene width / height. */
  x: number;
  y: number;
}

export interface CursorOp {
  op: CursorOpName;
  /** Node id (or sub-item id) or a point in scene fractions. */
  to?: string | CursorPoint;
  /** "type": the text typed into the target input. */
  text?: string;
  /** "drag": the board column id the card is dropped in. */
  dest?: string;
  /** Milliseconds for the action part (not the travel). */
  duration?: number;
  /** Applied when the op finishes (for "type", the value is typed first). */
  then?: StateChange[];
  /** Words for screen readers and reduced-motion markers, e.g. "Close task". */
  label?: string;
}

export type CursorScript = CursorOp[];
