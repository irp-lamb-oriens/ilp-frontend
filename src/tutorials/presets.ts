/**
 * Building blocks for tutorial configs: node factories, cursor ops, the
 * role shells, a small pool of placeholder people (fictional, varied, in the
 * spirit of server/scripts/placeholderPeople.ts) and dates relative to today.
 * Plain data only, so the configs stay short and node --test can load them.
 */
import type {
  BoardColumn,
  ButtonNode,
  CardNode,
  CursorOp,
  CursorScript,
  DrawerNode,
  FrameNode,
  GapSize,
  GridCols,
  InputNode,
  ListItem,
  MockNode,
  MockPillSpec,
  MockTone,
  PatchValue,
  Scene,
  SceneAspect,
  StateChange,
  StatTileNode,
  TableRow,
  TextNode,
  TimelineEntry,
  TutorialRole,
  TutorialStep,
} from "../components/tutorial/types";

// ─── People and dates ───────────────────────────────────────────────────────

/** Fictional members (random first/last pairings). */
export const MEMBERS = {
  linda: "Linda Pendleton",
  joseLuis: "José-Luis Ibáñez",
  imani: "Imani Okafor",
  hiroshi: "Hiroshi Tanaka",
  priya: "Priya Raman",
  maricel: "Maricel Dela Cruz",
  genevieve: "Geneviève Tremblay",
  omar: "Omar Haddad",
  asa: "Åsa van der Berg",
  kai: "Kai Nguyễn-Tremblay",
  winona: "Winona Yazzie",
  dmitri: "Dmitri Petrović",
  chloe: "Chloé Lefèvre",
  russell: "Russell Ashby",
  colleen: "Colleen McAllister",
} as const;

/** Partner lawyers (fictional). */
export const LAWYERS = {
  andrea: "Lic. Andrea Vargas",
  mauricio: "Lic. Mauricio Solano",
  daniela: "Lic. Daniela Chaves",
} as const;

/** ILP team (fictional). */
export const TEAM = {
  csm: "Sofía Campos",
  csmEmail: "sofia@ilp.legal",
  csm2Email: "tomas@ilp.legal",
} as const;

export const FEE = "US$79.99";

const DAY_MS = 86_400_000;

/** "Oct 30", n days from today. */
export function dateIn(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "Thursday", n days from today. */
export function weekdayIn(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toLocaleDateString("en-US", { weekday: "long" });
}

/** "Thu Oct 30", n days from today. */
export function dayIn(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// ─── Shells ─────────────────────────────────────────────────────────────────

export const NAV: Record<TutorialRole, string[]> = {
  staff: ["Today", "Members", "Pipeline", "Opportunities", "Lawyers", "Finance", "Reports", "Settings", "Privacy"],
  lawyer: ["Today", "Board", "Clients", "Finance", "Availability"],
  client: ["Overview", "Profile", "Money", "Messages"],
};

const SEARCH: Partial<Record<TutorialRole, string>> = {
  staff: "Search members by name or email",
  lawyer: "Search clients and matters",
};

export interface ShellOpts {
  title?: string;
  actions?: MockNode[];
  overlays?: MockNode[];
  search?: string | null;
}

/** The role's shell around a page body, with that role's real nav labels. */
export function mockShell(role: TutorialRole, active: string, body: MockNode, opts: ShellOpts = {}): FrameNode {
  return {
    type: "frame",
    role,
    nav: NAV[role],
    active,
    title: opts.title,
    actions: opts.actions,
    overlays: opts.overlays,
    search: opts.search === null ? undefined : opts.search ?? SEARCH[role],
    body,
  };
}

// ─── Node factories ─────────────────────────────────────────────────────────

type Id = { id?: string };

export const stack = (children: MockNode[], gap: GapSize = 3, id?: string): MockNode => ({ type: "stack", gap, children, id });
export const row = (children: MockNode[], align: "start" | "center" | "between" | "end" = "center", gap: GapSize = 2, id?: string): MockNode => ({
  type: "row",
  align,
  gap,
  children,
  id,
  wrap: true,
});
export const grid = (cols: GridCols, children: MockNode[], gap: GapSize = 3): MockNode => ({ type: "grid", cols, gap, children });
export const text = (t: string, variant: TextNode["variant"] = "body", id?: string): MockNode => ({ type: "text", text: t, variant, id });
export const h2 = (t: string, id?: string) => text(t, "h2", id);
export const h3 = (t: string, id?: string) => text(t, "h3", id);
export const meta = (t: string, id?: string) => text(t, "meta", id);
export const pill = (label: string, tone: MockTone = "neutral", id?: string, size: "sm" | "md" = "sm"): MockNode => ({ type: "pill", label, tone, id, size });
export const p = (label: string, tone: MockTone = "neutral"): MockPillSpec => ({ label, tone });
export const btn = (label: string, variant: ButtonNode["variant"] = "primary", id?: string, size: "sm" | "md" = "md"): MockNode => ({
  type: "button",
  label,
  variant,
  id,
  size,
});
export const card = (title: string | undefined, children: MockNode[], opts: Omit<Partial<CardNode>, "type" | "children"> = {}): MockNode => ({
  type: "card",
  title,
  children,
  ...opts,
});
export const stat = (label: string, value: string, opts: Omit<Partial<StatTileNode>, "type" | "label" | "value"> = {}): MockNode => ({
  type: "statTile",
  label,
  value,
  ...opts,
});
export const list = (items: ListItem[], variant: "rows" | "plain" = "rows", id?: string): MockNode => ({ type: "list", items, variant, id });
export const table = (columns: string[], rows: TableRow[], id?: string): MockNode => ({ type: "table", columns, rows, id });
export const input = (label: string | undefined, opts: Omit<Partial<InputNode>, "type" | "label"> = {}): MockNode => ({ type: "input", label, ...opts });
export const chip = (label: string, selected = false, id?: string): MockNode => ({ type: "chip", label, selected, id });
export const toggle = (label: string, on = false, id?: string, kind: "switch" | "checkbox" = "switch"): MockNode => ({ type: "toggle", label, on, id, kind });
export const tabs = (labels: string[], active: string, id?: string, ids?: string[]): MockNode => ({
  type: "tabs",
  active,
  id,
  tabs: labels.map((label, i) => ({ label, id: ids?.[i] })),
});
export const board = (columns: BoardColumn[], id?: string): MockNode => ({ type: "board", columns, id });
export const timeline = (items: TimelineEntry[], id?: string): MockNode => ({ type: "timeline", items, id });
export const progress = (label: string, value: number, valueText?: string, tone: "accent" | "success" | "warning" = "accent", id?: string): MockNode => ({
  type: "progress",
  label,
  value,
  valueText,
  tone,
  id,
});
export const drawer = (id: string, title: string, children: MockNode[], subtitle?: string): DrawerNode => ({
  type: "drawer",
  id,
  title,
  subtitle,
  open: false,
  children,
});
export const dialog = (id: string, title: string, children: MockNode[]): MockNode => ({ type: "dialog", id, title, open: false, children });
export const toast = (id: string, t: string): MockNode => ({ type: "toast", id, text: t, visible: false });
export const menu = (id: string, items: Array<{ id?: string; label: string }>): MockNode => ({ type: "menu", id, items, open: false });
export const message = (from: "me" | "team" | "ai", author: string, t: string, metaLine?: string, id?: string): MockNode => ({
  type: "message",
  from,
  author,
  text: t,
  meta: metaLine,
  id,
});
export const deflist = (items: Array<{ term: string; value: string; id?: string }>, id?: string): MockNode => ({ type: "deflist", items, id });
export const divider = (): MockNode => ({ type: "divider" });
export const timeRange = (from: string, to: string, label?: string, id?: string): MockNode => ({ type: "timeRange", from, to, label, id });

/** Same node, with an id. */
export function withId<T extends MockNode>(node: T, id: string): T & Id {
  return { ...node, id };
}

/** Same node, hidden until a state change shows it. */
export function hidden<T extends MockNode>(node: T): T {
  return { ...node, hidden: true };
}

// ─── State changes ──────────────────────────────────────────────────────────

export const set = (id: string, patch: Record<string, PatchValue>): StateChange => ({ id, set: patch });
export const show = (id: string): StateChange => set(id, { hidden: false });
export const hide = (id: string): StateChange => set(id, { hidden: true });
export const open = (id: string): StateChange => set(id, { open: true });
export const shut = (id: string): StateChange => set(id, { open: false });
export const mark = (id: string, on = true): StateChange => set(id, { highlight: on });
export const toastOn = (id: string): StateChange => set(id, { visible: true });

// ─── Cursor ops ─────────────────────────────────────────────────────────────

export const click = (to: string, then?: StateChange[], label?: string): CursorOp => ({ op: "click", to, then, label });
export const hover = (to: string, then?: StateChange[], duration?: number): CursorOp => ({ op: "hover", to, then, duration });
export const type = (to: string, value: string, then?: StateChange[], label?: string): CursorOp => ({ op: "type", to, text: value, then, label });
export const drag = (card: string, dest: string, then?: StateChange[]): CursorOp => ({ op: "drag", to: card, dest, then });
export const scroll = (to?: string): CursorOp => ({ op: "scroll", to });
export const wait = (ms = 700, then?: StateChange[]): CursorOp => ({ op: "wait", duration: ms, then });
export const move = (to: string | { x: number; y: number }): CursorOp => ({ op: "move", to });

// ─── Steps ──────────────────────────────────────────────────────────────────

export function scene(root: MockNode, script: CursorScript = [], aspect: SceneAspect = "desktop"): Scene {
  return { aspect, root, script };
}

export function step(id: string, title: string, body: string, sc: Scene, extra: Partial<TutorialStep> = {}): TutorialStep {
  return { id, title, body, scene: sc, ...extra };
}

/**
 * A member's phone screen (aspect "phone"): top bar, the page, and the
 * bottom navigation the shell shows below 768px.
 */
export function mockPhone(active: string, title: string, body: MockNode[]): MockNode {
  return stack(
    [
      row([text("ILP", "strong"), text("LH", "label")], "between"),
      divider(),
      text(title, "h1"),
      ...body,
      divider(),
      row(NAV.client.map((label) => text(label, label === active ? "strong" : "meta")), "between"),
    ],
    4,
  );
}
