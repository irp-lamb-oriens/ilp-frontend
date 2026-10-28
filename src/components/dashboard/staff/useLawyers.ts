"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { staffApi } from "@/lib/api";

export interface LawyerOption {
  id: string;
  name: string;
  email?: string | null;
  legalAreas?: string[];
}

let cache: Promise<LawyerOption[]> | null = null;

function load(): Promise<LawyerOption[]> {
  if (!cache) {
    cache = staffApi
      .get<{ providers: Array<{ id: string; name?: string | null; email?: string | null; legalAreas?: string[]; active?: boolean }> }>(
        "/api/dashboard/providers",
      )
      .then((r) =>
        (r.providers ?? [])
          .filter((p) => p.active !== false)
          .map((p) => ({ id: p.id, name: p.name || p.email || p.id, email: p.email, legalAreas: p.legalAreas ?? [] })),
      )
      .catch(() => {
        cache = null;
        return [];
      });
  }
  return cache;
}

/** Lawyers (providers) for names and the assign picker. Fetched once per page load. */
export function useLawyers(): { lawyers: LawyerOption[]; loaded: boolean; nameOf: (id?: string | null) => string } {
  const [lawyers, setLawyers] = useState<LawyerOption[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let live = true;
    load().then((l) => {
      if (!live) return;
      setLawyers(l);
      setLoaded(true);
    });
    return () => {
      live = false;
    };
  }, []);
  // Stable while the list is unchanged, so tables can memoize their columns on it.
  const byId = useMemo(() => new Map(lawyers.map((l) => [l.id, l.name])), [lawyers]);
  const nameOf = useCallback((id?: string | null) => (id ? byId.get(id) ?? "Assigned lawyer" : "Unassigned"), [byId]);
  return { lawyers, loaded, nameOf };
}
