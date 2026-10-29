"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type JourneyFilterState, apiQuery, filtersToParams, readFilters, withFilter } from "./model";
import type { Sampled } from "./journeysApi";

/** Journeys filters, kept in the URL so a view can be shared and the back button works. */
export function useJourneyFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "/dashboard/journeys";
  const search = params?.toString() ?? "";
  const filters = useMemo(() => readFilters(new URLSearchParams(search)), [search]);
  const query = useMemo(() => apiQuery(filters), [filters]);

  const replace = useCallback(
    (next: JourneyFilterState) => {
      const qs = filtersToParams(next).toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );
  const set = useCallback((key: keyof JourneyFilterState, value: string | undefined) => replace(withFilter(filters, key, value)), [filters, replace]);
  const setRange = useCallback((from: string, to: string) => replace({ ...filters, range: "custom", from, to }), [filters, replace]);
  const reset = useCallback(() => replace({ range: "28" }), [replace]);
  const qs = filtersToParams(filters).toString();
  return { filters, query, set, setRange, reset, qs, queryKey: JSON.stringify(query) };
}

export interface Loaded<T> {
  data: T | null;
  sample: boolean;
  error: string | null;
  loading: boolean;
  retry: () => void;
}

/** Load one Journeys report; reloads when `key` changes. Old data stays visible while new data loads. */
export function useJourneyData<T>(load: () => Promise<Sampled<T>>, key: string): Loaded<T> {
  const [state, setState] = useState<{ data: T | null; sample: boolean; error: string | null; loading: boolean }>({ data: null, sample: false, error: null, loading: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    load()
      .then((r) => live && setState({ data: r.data, sample: r.sample, error: null, loading: false }))
      .catch((e) => live && setState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : "The report could not be loaded." })));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, n]);
  return { ...state, retry: () => setN((x) => x + 1) };
}
