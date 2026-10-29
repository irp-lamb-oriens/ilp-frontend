/**
 * First-party ids for journey measurement (JOURNEYS): a random visitor id in
 * localStorage (`ilp_vid`) and a per-tab session id in sessionStorage that
 * starts over after 30 minutes without activity. Neither is personal. Both
 * are created only when tracking is allowed (the caller checks).
 */
import { JOURNEY_VISITOR_KEY } from "@/lib/contracts";

export const SESSION_KEY = "ilp_journey_session";
export const SESSION_IDLE_MS = 30 * 60_000;
const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

export function randomId(): string {
  try {
    return crypto.randomUUID().replace(/-/g, "");
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  }
}

let memoryVisitor: string | null = null;
let memorySession: SessionState | null = null;

/** This browser's visitor id, created on first use. */
export function getVisitorId(): string {
  try {
    const have = window.localStorage.getItem(JOURNEY_VISITOR_KEY);
    if (have && ID_RE.test(have)) return have;
    const id = randomId();
    window.localStorage.setItem(JOURNEY_VISITOR_KEY, id);
    return id;
  } catch {
    memoryVisitor = memoryVisitor ?? randomId();
    return memoryVisitor;
  }
}

export interface SessionState {
  id: string;
  last: number;
}

/** Pure: keep the session while it is active, start a new one after 30 idle minutes. */
export function nextSession(prev: SessionState | null, now: number, makeId: () => string = randomId): SessionState {
  if (prev && ID_RE.test(prev.id) && now - prev.last < SESSION_IDLE_MS && now >= prev.last - 60_000) return { id: prev.id, last: now };
  return { id: makeId(), last: now };
}

function readSession(): SessionState | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return memorySession;
    const v = JSON.parse(raw) as SessionState;
    return typeof v?.id === "string" && typeof v?.last === "number" ? v : null;
  } catch {
    return memorySession;
  }
}

/** The current session id; marks the session active now. */
export function touchSession(now = Date.now()): string {
  const s = nextSession(readSession(), now);
  memorySession = s;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    // storage blocked: the in-memory session lasts for this page
  }
  return s.id;
}

/** The current session id without touching it, or null. */
export function peekSession(now = Date.now()): string | null {
  const s = readSession();
  return s && now - s.last < SESSION_IDLE_MS ? s.id : null;
}

/** Forget every journey id in this browser (opt-out, "No thanks"). */
export function clearJourneyIds(): void {
  memoryVisitor = null;
  memorySession = null;
  try {
    window.localStorage.removeItem(JOURNEY_VISITOR_KEY);
  } catch {
    // nothing stored
  }
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // nothing stored
  }
}
