/**
 * The journey tracker (JOURNEYS): first-party measurement of how people move
 * through the public site, posted in batches to POST /api/journey/events.
 *
 *   track.step("check_start");
 *   track.click("home.hero.check");
 *   track.formError("join.email");   // the field id only, never its value
 *
 * Nothing is stored or sent unless `trackingAllowed()` (measurement allowed,
 * no GPC, no Do Not Track, no opt-out). Inside the signed-in portals
 * (/dashboard, /lawyer, /status) only one page view of the portal itself is
 * counted per session; nothing on those screens is tracked.
 */
import { API_URL } from "@/lib/api";
import { type FunnelStepId, type JourneyDevice, type JourneyEventInput, type JourneyEventType, isCountryCode } from "@/lib/contracts";
import { type Attribution, parseAttribution, resolveAttribution } from "./attribution";
import { trackingAllowed } from "./consent";
import { clearJourneyIds, getVisitorId, touchSession } from "./ids";
import { type EventQueue, type Transport, createQueue } from "./queue";
import { cleanTarget, sanitizeEvent } from "./sanitize";

export const ATTRIBUTION_KEY = "ilp_journey_src";
export const EXPOSED_KEY = "ilp_journey_exposed";
const COUNTRY_KEY = "ilp_country";

/** Signed-in areas: only a page view of the portal root is counted. /ui is never counted. */
const PORTALS = ["/dashboard", "/lawyer", "/status"];
const NEVER = ["/ui"];

export function portalRoot(path: string): string | null {
  for (const p of PORTALS) if (path === p || path.startsWith(`${p}/`)) return p;
  return null;
}

function excluded(path: string): boolean {
  return NEVER.some((p) => path === p || path.startsWith(`${p}/`));
}

export function deviceOf(width: number): JourneyDevice {
  return width < 768 ? "phone" : width < 1024 ? "tablet" : "desktop";
}

const fetchTransport: Transport = (events, { beacon }) => {
  const url = `${API_URL}/api/journey/events`;
  const body = JSON.stringify({ events });
  try {
    if (typeof fetch === "function") {
      void fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true, credentials: "omit" }).catch(() => undefined);
      return;
    }
  } catch {
    // fall through to the beacon
  }
  if (beacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon(url, new Blob([body], { type: "text/plain;charset=UTF-8" }));
  }
};

interface TrackerState {
  queue: EventQueue;
  attribution: Attribution | null;
  exposed: Record<string, string>;
  portalsSeen: Set<string>;
  lastPath: string;
}

let state: TrackerState | null = null;

function st(): TrackerState {
  if (!state) {
    state = { queue: createQueue({ transport: fetchTransport }), attribution: null, exposed: readExposed(), portalsSeen: new Set(), lastPath: "/" };
  }
  return state;
}

/** For tests: replace the transport and forget everything. */
export function resetTracker(transport?: Transport, queueOptions: Partial<Parameters<typeof createQueue>[0]> = {}): void {
  state = {
    queue: createQueue({ transport: transport ?? fetchTransport, ...queueOptions }),
    attribution: null,
    exposed: {},
    portalsSeen: new Set(),
    lastPath: "/",
  };
}

function readExposed(): Record<string, string> {
  try {
    const raw = window.sessionStorage.getItem(EXPOSED_KEY);
    const v = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

function attribution(): Attribution {
  const s = st();
  let stored: Attribution | null = null;
  try {
    stored = parseAttribution(window.localStorage.getItem(ATTRIBUTION_KEY));
  } catch {
    stored = s.attribution;
  }
  let a: Attribution;
  try {
    a = resolveAttribution({ search: window.location.search, referrer: document.referrer, host: window.location.hostname }, stored ?? s.attribution);
  } catch {
    a = s.attribution ?? { source: "inbound", channel: "direct" };
  }
  s.attribution = a;
  try {
    window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(a));
  } catch {
    // kept in memory
  }
  return a;
}

function country(): string | undefined {
  try {
    const v = window.localStorage.getItem(COUNTRY_KEY) ?? "";
    return isCountryCode(v) ? v : undefined;
  } catch {
    return undefined;
  }
}

function currentPath(): string {
  try {
    return window.location.pathname;
  } catch {
    return st().lastPath;
  }
}

function emit(type: JourneyEventType, extra: Partial<JourneyEventInput> = {}): boolean {
  if (!trackingAllowed()) return false;
  const path = extra.path ?? currentPath();
  if (excluded(path)) return false;
  const portal = portalRoot(path);
  if (portal && type !== "page_view") return false;
  const a = attribution();
  const ev = sanitizeEvent({
    visitorId: getVisitorId(),
    sessionId: touchSession(),
    source: a.source,
    channel: a.channel,
    utm: a.utm,
    outreachId: a.outreachId,
    type,
    variants: { ...st().exposed },
    device: deviceOf(typeof window !== "undefined" ? window.innerWidth : 1280),
    country: country(),
    at: new Date().toISOString(),
    ...extra,
    path: portal ?? path,
  } as JourneyEventInput & Record<string, unknown>);
  if (!ev) return false;
  st().queue.push(ev);
  return true;
}

export const track = {
  /** A page view. In a portal, once per session for the portal root. */
  pageView(path?: string): boolean {
    const p = path ?? currentPath();
    const portal = portalRoot(p);
    if (portal) {
      if (st().portalsSeen.has(portal)) return false;
      const sent = emit("page_view", { path: portal });
      if (sent) st().portalsSeen.add(portal);
      return sent;
    }
    st().lastPath = p;
    return emit("page_view", { path: p });
  },
  /** A member-funnel or lawyer-funnel step the browser sees. */
  step(id: FunnelStepId): boolean {
    return emit("step", { step: id });
  },
  /** A click on a primary control, by its stable id ("home.hero.check"). */
  click(targetId: string, step?: FunnelStepId): boolean {
    const t = cleanTarget(targetId);
    return t ? emit("click", { target: t, ...(step ? { step } : {}) }) : false;
  },
  /** A validation error on a field, by field id only ("join.email"). Never the value. */
  formError(fieldId: string, step?: FunnelStepId): boolean {
    const t = cleanTarget(fieldId);
    return t ? emit("form_error", { target: t, ...(step ? { step } : {}) }) : false;
  },
  /** Several field errors from one failed submit, on the form of `step`. */
  formErrors(prefix: string, fieldIds: string[], step?: FunnelStepId): void {
    for (const f of fieldIds) track.formError(`${prefix}.${f}`, step);
  },
  /** Active time on the current page since the last heartbeat. */
  heartbeat(durationMs: number, path?: string): boolean {
    return emit("heartbeat", { durationMs, ...(path ? { path } : {}) });
  },
  /** The page is closing: last active time, then send everything now. */
  exit(durationMs: number): boolean {
    const sent = emit("exit", { durationMs });
    st().queue.flush(true);
    return sent;
  },
  /**
   * The visitor saw an experiment variant. From now on every event carries it
   * in `variants`; one zero-length heartbeat with target "exposure.<key>"
   * records the exposure itself. Sent once per experiment per session.
   */
  exposure(key: string, variant: string): boolean {
    const s = st();
    if (s.exposed[key] === variant) return false;
    if (!trackingAllowed()) return false;
    s.exposed = { ...s.exposed, [key]: variant };
    try {
      window.sessionStorage.setItem(EXPOSED_KEY, JSON.stringify(s.exposed));
    } catch {
      // kept in memory
    }
    return emit("heartbeat", { durationMs: 0, target: `exposure.${key}` });
  },
  /** Variants already shown in this session (sticky). */
  exposed(): Record<string, string> {
    return { ...st().exposed };
  },
  flush(beacon = false): void {
    st().queue.flush(beacon);
  },
  /** Drop waiting events and forget the ids (the visitor said no). */
  forget(): void {
    st().queue.clear();
    st().attribution = null;
    st().exposed = {};
    clearJourneyIds();
    try {
      window.localStorage.removeItem(ATTRIBUTION_KEY);
      window.sessionStorage.removeItem(EXPOSED_KEY);
    } catch {
      // nothing stored
    }
  },
  waiting(): number {
    return st().queue.size();
  },
};

export type Track = typeof track;

/**
 * The visitor id to send with the free check, the claim, join and the lawyer
 * application (`visitorId` in the body, contracts JOURNEY_VISITOR_HEADER), so
 * the server can link the visit to the lead or account. Undefined without consent.
 */
export function journeyVisitorId(): string | undefined {
  try {
    return trackingAllowed() ? getVisitorId() : undefined;
  } catch {
    return undefined;
  }
}
