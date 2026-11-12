/** BEHAVIOR: staff reads of the heat-map totals (server/API/behavior). */
import { staffApi } from "@/lib/api";

export type BehaviorDevice = "phone" | "tablet" | "desktop";
export type HeatLayer = "clicks" | "rage" | "dead" | "scroll" | "attention";

export interface BehaviorPage {
  path: string;
  views: number;
  avgActiveMs: number | null;
  avgScroll: number | null;
  quickRate: number;
  clicks: number;
  rage: number;
  dead: number;
  rageRate: number;
  deadRate: number;
  errors: number;
  lcpMs: number | null;
  slowRate: number | null;
  cls: number | null;
  inpMs: number | null;
  devices: Record<BehaviorDevice, number>;
}

export interface BehaviorPages {
  from: string;
  to: string;
  total: { views: number; clicks: number; rage: number; dead: number; errors: number };
  pages: BehaviorPage[];
}

export type Cell = [col: number, row: number, count: number];

export interface BehaviorHeat extends BehaviorPage {
  from: string;
  to: string;
  device: BehaviorDevice | null;
  grid: { cols: number; rows: number };
  avgDocH: number | null;
  /** Share of views that reached each tenth of the page, top to bottom. */
  reach: number[];
  /** Share of on-screen time per twentieth of the page, top to bottom. */
  attention: number[];
  cells: Cell[];
  rageCells: Cell[];
  deadCells: Cell[];
  elements: Array<{ label: string; clicks: number; rage: number; dead: number; share: number }>;
  insights: Array<{ tone: "danger" | "warning" | "info"; text: string }>;
}

const B = "/api/dashboard/journeys/behavior";

export const getBehaviorPages = (from: string, to: string) => staffApi.get<BehaviorPages>(`${B}/pages`, { query: { from, to } });

export const getBehaviorHeat = (path: string, from: string, to: string, device: BehaviorDevice | "") =>
  staffApi.get<BehaviorHeat>(`${B}/page`, { query: { path, from, to, device: device || undefined } });

export const LAYERS: Array<{ id: HeatLayer; label: string; help: string }> = [
  { id: "clicks", label: "Clicks", help: "Where people click or tap. Warmer spots get more clicks." },
  { id: "rage", label: "Rage clicks", help: "Spots people click three or more times in a second. Something there looks broken or slow." },
  { id: "dead", label: "Dead clicks", help: "Clicks on things that do nothing. People expected a link or a button there." },
  { id: "scroll", label: "Scroll reach", help: "How many views got this far down. Darker means fewer people saw it." },
  { id: "attention", label: "Attention", help: "Where the page spent the most time on screen. Warmer bands were looked at longer." },
];

export const DEVICE_WIDTH: Record<BehaviorDevice, number> = { phone: 390, tablet: 820, desktop: 1280 };
export const DEVICE_LABEL: Record<BehaviorDevice, string> = { phone: "Phone", tablet: "Tablet", desktop: "Computer" };

/** Where a cell sits on a canvas of w × h, and how large one cell is. */
export function cellBox(col: number, row: number, grid: { cols: number; rows: number }, w: number, h: number) {
  const cw = w / grid.cols;
  const ch = h / grid.rows;
  return { cx: (col + 0.5) * cw, cy: (row + 0.5) * ch, cw, ch };
}

/** 0-1 heat for a count, on a square-root scale so one hot spot does not hide the rest. */
export function heatOf(count: number, max: number): number {
  return max > 0 ? Math.min(1, Math.sqrt(count / max)) : 0;
}

/** The tenth of the page where reach first drops below `share` (the "fold" most people stop at), or null. */
export function dropBand(reach: number[], share = 0.5): number | null {
  const i = reach.findIndex((r) => r < share);
  return i < 0 ? null : i;
}
