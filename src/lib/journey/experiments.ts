/**
 * Experiment assignments (JOURNEYS). The server picks a sticky variant per
 * visitor (GET /api/journey/assign); the browser asks once per session and
 * keeps the answer in sessionStorage, and a variant already shown in this
 * session never changes, even if the answer changes.
 */
import { API_URL } from "@/lib/api";
import type { ExperimentConfig, JourneyAssignResponse } from "@/lib/contracts";
import { trackingAllowed } from "./consent";
import { getVisitorId, touchSession } from "./ids";

export const ASSIGN_KEY = "ilp_journey_assign";

export interface Assignments {
  sessionId: string;
  assignments: Record<string, string>;
  experiments: ExperimentConfig[];
}

let memory: Assignments | null = null;
let pending: Promise<Assignments | null> | null = null;

export type AssignFetcher = (visitorId: string) => Promise<JourneyAssignResponse>;

const defaultFetcher: AssignFetcher = async (visitorId) => {
  const res = await fetch(`${API_URL}/api/journey/assign?visitorId=${encodeURIComponent(visitorId)}`, { credentials: "omit" });
  if (!res.ok) throw new Error(`assign ${res.status}`);
  return (await res.json()) as JourneyAssignResponse;
};

function readCache(sessionId: string): Assignments | null {
  if (memory?.sessionId === sessionId) return memory;
  try {
    const raw = window.sessionStorage.getItem(ASSIGN_KEY);
    const v = raw ? (JSON.parse(raw) as Assignments) : null;
    if (v && v.sessionId === sessionId && v.assignments && typeof v.assignments === "object") {
      memory = v;
      return v;
    }
  } catch {
    // no cache
  }
  return null;
}

/** The cached assignments for this session, without a request. */
export function cachedAssignments(): Assignments | null {
  if (!trackingAllowed()) return null;
  try {
    return readCache(touchSession());
  } catch {
    return null;
  }
}

/** Ask the server once per session (concurrent callers share one request). Null when not allowed or on failure. */
export function loadAssignments(fetcher: AssignFetcher = defaultFetcher): Promise<Assignments | null> {
  if (!trackingAllowed()) return Promise.resolve(null);
  const sessionId = touchSession();
  const hit = readCache(sessionId);
  if (hit) return Promise.resolve(hit);
  if (pending) return pending;
  pending = fetcher(getVisitorId())
    .then((r) => {
      const v: Assignments = { sessionId, assignments: r.assignments ?? {}, experiments: r.experiments ?? [] };
      memory = v;
      try {
        window.sessionStorage.setItem(ASSIGN_KEY, JSON.stringify(v));
      } catch {
        // kept in memory
      }
      return v;
    })
    .catch(() => null)
    .finally(() => {
      pending = null;
    });
  return pending;
}

/** For tests. */
export function resetAssignments(): void {
  memory = null;
  pending = null;
}

/** The control (first variant) of an experiment; "A" when the config is unknown. */
export function controlOf(key: string, a: Assignments | null): string {
  return a?.experiments.find((e) => e.key === key)?.variants[0]?.key ?? "A";
}

/**
 * Pure: the variant to render. A variant already shown in this session wins
 * (sticky), then the server's assignment, then the control. `inExperiment`
 * is false when the visitor is not in a running experiment (no exposure).
 */
export function resolveVariant(
  key: string,
  a: Assignments | null,
  exposed: Record<string, string>,
): { variant: string; control: string; inExperiment: boolean } {
  const control = controlOf(key, a);
  if (exposed[key]) return { variant: exposed[key], control, inExperiment: true };
  const assigned = a?.assignments[key];
  if (assigned) return { variant: assigned, control, inExperiment: true };
  return { variant: control, control, inExperiment: false };
}
