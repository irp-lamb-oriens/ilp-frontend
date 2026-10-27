/**
 * Tutorial registry: id lookup and route matching. Pure (no React, no DOM),
 * so tests run it directly under node --test.
 */
import type { Tutorial, TutorialRole } from "./types";

/** Strip query and hash, collapse a trailing slash ("/status/" → "/status"). */
export function normalizePath(pathname: string): string {
  const bare = pathname.split(/[?#]/)[0] || "/";
  return bare.length > 1 ? bare.replace(/\/+$/, "") || "/" : bare;
}

/** "/dashboard/members/[id]" → /^\/dashboard\/members\/[^/]+$/ */
export function routeToRegExp(pattern: string): RegExp {
  const parts = normalizePath(pattern)
    .split("/")
    .map((seg) => {
      if (/^\[\.\.\..+\]$/.test(seg)) return ".+";
      if (/^\[.+\]$/.test(seg)) return "[^/]+";
      return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    });
  return new RegExp(`^${parts.join("/")}$`);
}

/** Higher is more specific: static string > dynamic string > RegExp. */
function specificity(route: string | RegExp): number {
  if (route instanceof RegExp) return 1;
  const segs = normalizePath(route).split("/").filter(Boolean);
  const dynamic = segs.filter((s) => /^\[.+\]$/.test(s)).length;
  return 100 + segs.length * 10 - dynamic * 5 + (dynamic === 0 ? 50 : 0);
}

export function routeMatches(route: string | RegExp | undefined, pathname: string): boolean {
  if (!route) return false;
  const path = normalizePath(pathname);
  const re = route instanceof RegExp ? route : routeToRegExp(route);
  return re.test(path);
}

function forAudience(t: Tutorial, role?: TutorialRole): boolean {
  return !role || !t.audience || t.audience.length === 0 || t.audience.includes(role);
}

export interface TutorialRegistry {
  all: readonly Tutorial[];
  get(id: string): Tutorial | undefined;
  /** The most specific tutorial for this path (and role, when given). */
  forRoute(pathname: string, role?: TutorialRole): Tutorial | undefined;
  forRole(role: TutorialRole): Tutorial[];
}

export function matchTutorial(list: readonly Tutorial[], pathname: string, role?: TutorialRole): Tutorial | undefined {
  let best: Tutorial | undefined;
  let bestScore = -1;
  for (const t of list) {
    if (!t.route || !forAudience(t, role) || !routeMatches(t.route, pathname)) continue;
    const score = specificity(t.route);
    if (score > bestScore) {
      best = t;
      bestScore = score;
    }
  }
  return best;
}

export function createRegistry(list: readonly Tutorial[]): TutorialRegistry {
  const byId = new Map<string, Tutorial>();
  for (const t of list) {
    if (byId.has(t.id)) throw new Error(`Duplicate tutorial id: ${t.id}`);
    byId.set(t.id, t);
  }
  return {
    all: list,
    get: (id) => byId.get(id),
    forRoute: (pathname, role) => matchTutorial(list, pathname, role),
    forRole: (role) => list.filter((t) => t.audience?.includes(role)),
  };
}
