"use client";

/**
 * useExperiment (JOURNEYS): the variant this visitor sees.
 *
 *   const { variant, ready, isControl } = useExperiment("hero-headline");
 *
 * - The first render (server and client) is not ready, so hydration matches.
 *   The caller reserves the slot's space: it renders the control while
 *   loading when `whileLoading: "control"`, or an invisible placeholder of
 *   the same size (default "wait").
 * - Without measurement consent, or when the answer takes longer than
 *   `timeoutMs` (300 ms), the control is shown and nothing is recorded.
 * - The exposure is recorded once, after the variant has rendered and
 *   `exposeWhen` is true (e.g. only once the question list is on screen).
 */
import { useEffect, useRef, useState } from "react";
import { type Assignments, cachedAssignments, controlOf, loadAssignments, resolveVariant } from "./experiments";
import { trackingAllowed } from "./consent";
import { track } from "./tracker";

export interface UseExperimentOptions {
  whileLoading?: "control" | "wait";
  exposeWhen?: boolean;
  timeoutMs?: number;
}

export interface ExperimentState {
  variant: string;
  control: string;
  ready: boolean;
  isControl: boolean;
  /** The visitor is in the running experiment and the variant counts. */
  counted: boolean;
}

export const EXPERIMENT_TIMEOUT_MS = 300;

export function useExperiment(key: string, opts: UseExperimentOptions = {}): ExperimentState {
  const { exposeWhen = true, timeoutMs = EXPERIMENT_TIMEOUT_MS } = opts;
  const [state, setState] = useState<ExperimentState>({ variant: "A", control: "A", ready: false, isControl: true, counted: false });
  const exposedRef = useRef(false);

  useEffect(() => {
    let live = true;
    const settle = (a: Assignments | null, counted: boolean) => {
      if (!live) return;
      const r = resolveVariant(key, a, track.exposed());
      const variant = counted && r.inExperiment ? r.variant : r.control;
      setState({ variant, control: r.control, ready: true, isControl: variant === r.control, counted: counted && r.inExperiment });
    };
    if (!trackingAllowed()) {
      settle(null, false);
      return () => {
        live = false;
      };
    }
    const cached = cachedAssignments();
    if (cached) {
      settle(cached, true);
      return () => {
        live = false;
      };
    }
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      settle(null, false); // too slow: the control, not counted
    }, timeoutMs);
    void loadAssignments().then((a) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      settle(a, !!a);
    });
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [key, timeoutMs]);

  useEffect(() => {
    if (!state.ready || !state.counted || !exposeWhen || exposedRef.current) return;
    exposedRef.current = true;
    track.exposure(key, state.variant);
  }, [key, state.ready, state.counted, state.variant, exposeWhen]);

  if (!state.ready && opts.whileLoading === "control") return { ...state, variant: state.control };
  return state;
}

export { controlOf };
