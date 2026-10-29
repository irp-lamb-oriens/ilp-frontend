/**
 * Event hygiene (JOURNEYS). Every event passes through `sanitizeEvent` before
 * it is queued: only contract fields are kept, the path loses its query
 * string and any id-like segment, a target must be a component or field id,
 * and an event that still holds anything that looks like an email address
 * is dropped. No names, no emails, no free text ever leave the browser.
 */
import {
  type CountryCode,
  type FunnelStepId,
  type JourneyDevice,
  type JourneyEventInput,
  type JourneyEventType,
  JOURNEY_DEVICES,
  JOURNEY_EVENT_TYPES,
  SERVER_JOURNEY_STEPS,
  isCountryCode,
  isFunnelStepId,
} from "@/lib/contracts";
import { cleanSlug } from "./attribution";

const TARGET_RE = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const EMAIL_RE = /[^\s@"'<>]+@[^\s@"'<>]+\.[a-z]{2,}/i;
const MAX_MS = 6 * 60 * 60_000;

/** A component or field id ("check.next", "join.email"), or undefined. Never free text. */
export function cleanTarget(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim().toLowerCase();
  if (!TARGET_RE.test(t)) return undefined;
  if (/\d{6,}/.test(t)) return undefined; // phone numbers, ids
  return t;
}

/** A path segment that could identify someone or something: an email, a long number, a token. */
function idLike(seg: string): boolean {
  return seg.includes("@") || /\d{4,}/.test(seg) || /^[0-9a-f-]{16,}$/i.test(seg) || seg.length > 40 || /[^a-z0-9._~-]/i.test(seg);
}

/** Pathname only: no query string or hash, id-like segments replaced by ":id". */
export function cleanPath(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return "/";
  let p = raw.split(/[?#]/)[0] || "/";
  try {
    if (/^https?:\/\//i.test(p)) p = new URL(p).pathname;
  } catch {
    p = "/";
  }
  let decoded = p;
  try {
    decoded = decodeURIComponent(p);
  } catch {
    decoded = p;
  }
  const segs = decoded.split("/").filter(Boolean).map((s) => (idLike(s) ? ":id" : s.toLowerCase()));
  return `/${segs.join("/")}`.slice(0, 200);
}

/** True when any string in the value looks like an email address. */
export function holdsEmail(v: unknown): boolean {
  try {
    return EMAIL_RE.test(JSON.stringify(v));
  } catch {
    return true;
  }
}

function cleanVariants(v: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!v || typeof v !== "object") return out;
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    const key = cleanSlug(k, 64);
    const variant = cleanSlug(val, 64);
    if (key && variant) out[key] = variant;
  }
  return out;
}

/** Browser-side steps only: the server records the rest and drops them from the browser. */
export function browserStep(v: unknown): FunnelStepId | undefined {
  return isFunnelStepId(v) && !SERVER_JOURNEY_STEPS.includes(v) ? v : undefined;
}

/** The event with only contract fields, cleaned; null when it cannot be sent safely. */
export function sanitizeEvent(e: Partial<JourneyEventInput> & Record<string, unknown>): JourneyEventInput | null {
  if (!e || typeof e !== "object") return null;
  const type = e.type as JourneyEventType;
  if (!JOURNEY_EVENT_TYPES.includes(type)) return null;
  if (typeof e.visitorId !== "string" || !/^[A-Za-z0-9_-]{8,64}$/.test(e.visitorId)) return null;
  if (typeof e.sessionId !== "string" || !/^[A-Za-z0-9_-]{8,64}$/.test(e.sessionId)) return null;
  const device = (JOURNEY_DEVICES.includes(e.device as JourneyDevice) ? e.device : "desktop") as JourneyDevice;
  const out: JourneyEventInput = {
    visitorId: e.visitorId,
    sessionId: e.sessionId,
    type,
    path: cleanPath(e.path),
    variants: cleanVariants(e.variants),
    device,
  };
  if (e.source === "inbound" || e.source === "outbound") out.source = e.source;
  if (typeof e.channel === "string" && cleanSlug(e.channel) === e.channel) out.channel = e.channel as JourneyEventInput["channel"];
  if (typeof e.outreachId === "string" && /^[A-Za-z0-9_-]{6,64}$/.test(e.outreachId)) out.outreachId = e.outreachId;
  if (e.utm && typeof e.utm === "object") {
    const u = e.utm as Record<string, unknown>;
    const utm = { source: cleanSlug(u.source), medium: cleanSlug(u.medium), campaign: cleanSlug(u.campaign), content: cleanSlug(u.content) };
    const kept = Object.fromEntries(Object.entries(utm).filter(([, v]) => v));
    if (Object.keys(kept).length) out.utm = kept;
  }
  if (type === "step") {
    const step = browserStep(e.step);
    if (!step) return null;
    out.step = step;
  }
  // On a click or form error, `step` names the step the form belongs to (any funnel step).
  if ((type === "click" || type === "form_error") && isFunnelStepId(e.step)) out.step = e.step;
  if (type === "click" || type === "form_error" || (type === "heartbeat" && e.target !== undefined)) {
    const target = cleanTarget(e.target);
    if (!target) return null;
    out.target = target;
  }
  if ((type === "heartbeat" || type === "exit") && e.durationMs !== undefined) {
    const ms = Number(e.durationMs);
    if (!Number.isFinite(ms) || ms < 0) return null;
    out.durationMs = Math.round(Math.min(ms, MAX_MS));
  }
  if (typeof e.country === "string" && isCountryCode(e.country)) out.country = e.country as CountryCode;
  if (typeof e.at === "string" && !Number.isNaN(Date.parse(e.at))) out.at = new Date(e.at).toISOString();
  if (holdsEmail(out)) return null;
  return out;
}
