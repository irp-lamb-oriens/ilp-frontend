/**
 * BEHAVIOR: what a visitor does on one public page, kept as one small summary
 * and sent once when they leave it (server/API/behavior). Feeds the heat maps
 * in /dashboard/journeys/behavior.
 *
 * Recorded: where clicks land (as a share of the page's width and height),
 * the control clicked (its label, never a field's value), how far the page
 * was scrolled, which parts were on screen and for how long, rage clicks,
 * dead clicks, page speed and script errors.
 * Never recorded: anything typed, keystrokes, the screen itself, or anything
 * inside the signed-in portals. Nothing is collected without the visitor's
 * measurement consent (lib/journey/consent.ts).
 *
 * This file is pure (no window access) so tests can drive it; the wiring to
 * the browser is in BehaviorTracker.tsx.
 */

export const DWELL_BANDS = 20;
export const MAX_CLICKS = 60;
export const RAGE_WINDOW_MS = 1000;
export const RAGE_RADIUS_PX = 30;
export const RAGE_COUNT = 3;

const NOT_PUBLIC = ["/dashboard", "/lawyer", "/status", "/csm", "/partners", "/ui", "/api", "/app", "/r"];

export type BehaviorDevice = "phone" | "tablet" | "desktop";

export interface BehaviorClick {
  x: number;
  y: number;
  el?: string;
  k: "c" | "r" | "d";
}

export interface BehaviorSummary {
  path: string;
  device: BehaviorDevice;
  docH: number;
  activeMs: number;
  maxScroll: number;
  dwell: number[];
  clicks: BehaviorClick[];
  lcp?: number;
  cls?: number;
  inp?: number;
  errors: number;
  /** True for what happened after the page was hidden and shown again: not a new view. */
  cont?: boolean;
}

/** A public page path we measure; null for portals and odd paths. */
export function behaviorPath(pathname: string): string | null {
  const p = (pathname.split(/[?#]/)[0] || "/").toLowerCase().replace(/\/+$/, "") || "/";
  if (!/^\/[a-z0-9\-/]{0,80}$/.test(p)) return null;
  if (NOT_PUBLIC.some((x) => p === x || p.startsWith(`${x}/`))) return null;
  return p;
}

export function deviceFor(width: number): BehaviorDevice {
  return width < 768 ? "phone" : width < 1024 ? "tablet" : "desktop";
}

/** What we know about a clicked element, read by the browser wiring. */
export interface ClickTarget {
  tag: string;
  role?: string | null;
  /** For links: the href's path when it stays on this site, else null. */
  linkPath?: string | null;
  external?: boolean;
  /** Visible text of a button or link (UI copy). Never read from form fields. */
  text?: string;
  inputType?: string | null;
  inputName?: string | null;
}

const INTERACTIVE = new Set(["a", "button", "input", "select", "textarea", "summary", "label", "option"]);

export function isInteractive(t: ClickTarget): boolean {
  return INTERACTIVE.has(t.tag) || t.role === "button" || t.role === "link" || t.role === "tab" || t.role === "menuitem";
}

/** A short, stable label for a clicked control. Digits runs and emails are dropped by the server too. */
export function labelFor(t: ClickTarget): string {
  const text = (t.text ?? "").replace(/\s+/g, " ").trim().slice(0, 48);
  if (t.tag === "a") return t.external ? "link: another site" : `link: ${t.linkPath ?? text ?? ""}`.slice(0, 80);
  if (t.tag === "button" || t.role === "button" || t.role === "tab") return `button: ${text || "no label"}`;
  if (t.tag === "input" || t.tag === "select" || t.tag === "textarea") return `field: ${(t.inputName || t.inputType || t.tag).slice(0, 40)}`;
  if (t.tag === "summary") return `toggle: ${text || "details"}`;
  if (t.tag === "label") return `label: ${text}`;
  return t.tag;
}

export interface Collector {
  path: string;
  /** Deepest point seen and time on screen per band; call on scroll and once a second while active. */
  see(scrollY: number, viewH: number, docH: number, activeMs?: number): void;
  /** A click at page coordinates. Returns its index (for dead-click marking), or -1 when not kept. */
  click(pageX: number, pageY: number, docW: number, docH: number, target: ClickTarget, at: number): number;
  /** Nothing happened after click `index` on a non-interactive element. */
  dead(index: number): void;
  vitals(v: { lcp?: number; clsDelta?: number; inp?: number }): void;
  error(): void;
  /** True when there is something worth sending. */
  touched(): boolean;
  summary(device: BehaviorDevice): BehaviorSummary;
}

export function createCollector(path: string, cont = false): Collector {
  let activeMs = 0;
  let maxScroll = 0;
  let docHSeen = 0;
  const dwell: number[] = Array(DWELL_BANDS).fill(0);
  const clicks: BehaviorClick[] = [];
  const recent: Array<{ x: number; y: number; at: number }> = [];
  let raged = false;
  let lcp: number | undefined;
  let cls = 0;
  let clsSeen = false;
  let inp: number | undefined;
  let errors = 0;

  return {
    path,
    see(scrollY, viewH, docH, ms = 0) {
      if (!(docH > 0) || !(viewH > 0)) return;
      docHSeen = Math.max(docHSeen, Math.round(docH));
      const bottom = Math.min(docH, Math.max(0, scrollY) + viewH);
      maxScroll = Math.max(maxScroll, Math.min(100, Math.round((bottom / docH) * 100)));
      if (ms > 0) {
        activeMs += ms;
        const band = docH / DWELL_BANDS;
        const first = Math.max(0, Math.floor(Math.max(0, scrollY) / band));
        const last = Math.min(DWELL_BANDS - 1, Math.floor((bottom - 1) / band));
        for (let i = first; i <= last; i++) dwell[i] += ms;
      }
    },
    click(pageX, pageY, docW, docH, target, at) {
      if (!(docW > 0) || !(docH > 0)) return -1;
      docHSeen = Math.max(docHSeen, Math.round(docH));
      // Rage: the third fast click on one spot (counted once per burst).
      while (recent.length && at - recent[0].at > RAGE_WINDOW_MS) recent.shift();
      if (!recent.length) raged = false;
      const near = recent.filter((r) => Math.hypot(r.x - pageX, r.y - pageY) <= RAGE_RADIUS_PX).length;
      recent.push({ x: pageX, y: pageY, at });
      const rage = near + 1 >= RAGE_COUNT && !raged;
      if (rage) raged = true;
      if (clicks.length >= MAX_CLICKS) return -1;
      clicks.push({
        x: Math.min(999, Math.max(0, Math.round((pageX / docW) * 1000))),
        y: Math.min(999, Math.max(0, Math.round((pageY / docH) * 1000))),
        el: labelFor(target),
        k: rage ? "r" : "c",
      });
      return clicks.length - 1;
    },
    dead(index) {
      const c = clicks[index];
      if (c && c.k === "c") c.k = "d";
    },
    vitals(v) {
      if (v.lcp !== undefined && v.lcp > 0) lcp = Math.round(v.lcp);
      if (v.clsDelta !== undefined && v.clsDelta > 0) {
        cls += v.clsDelta;
        clsSeen = true;
      }
      if (v.inp !== undefined && v.inp > (inp ?? 0)) inp = Math.round(v.inp);
    },
    error() {
      errors = Math.min(50, errors + 1);
    },
    touched() {
      return activeMs >= 1000 || clicks.length > 0;
    },
    summary(device) {
      return {
        path,
        device,
        docH: Math.max(100, docHSeen),
        activeMs: Math.round(activeMs),
        maxScroll,
        dwell: dwell.map((n) => Math.round(n)),
        clicks: clicks.slice(),
        ...(cont ? { cont: true } : {}),
        ...(!cont && lcp !== undefined ? { lcp } : {}),
        ...(!cont && clsSeen ? { cls: Math.round(cls * 1000) } : {}),
        ...(inp !== undefined ? { inp } : {}),
        errors,
      };
    },
  };
}
