"use client";

import { useCallback, useEffect, useState } from "react";
import { csmGet } from "@/lib/csm";
import { useSkeleton } from "@/components/ui";
import { useCsm } from "./CsmFrame";

/**
 * Load one CSM route with the page's scope (?csm=, ?unassigned=). Reloads
 * when the scope changes. `skeleton*` follow the shared loading timing
 * (UX_LOADING.md): no flash for fast answers, no flicker for slow ones.
 */
export function useCsmData<T>(path: string, extra: Record<string, string | undefined> = {}) {
  const { scope } = useCsm();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify({ path, scope, extra });
  const load = useCallback(() => {
    setError(null);
    csmGet<T>(path, extra)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "This page could not be loaded."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    setData(null);
    load();
  }, [load]);
  const { showSkeleton, skeletonVisible } = useSkeleton(!data && !error);
  return { data, error, reload: load, showSkeleton, skeletonVisible };
}
