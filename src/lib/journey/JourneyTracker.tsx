"use client";

/**
 * Mounted once in the root layout (JOURNEYS): a page view on every route
 * change, active time while the tab is visible and the visitor has used the
 * page in the last 30 seconds, an exit with a final flush when the page is
 * hidden or closed, and the experiment assignments fetched early. Renders
 * nothing. Sends nothing without consent (lib/journey/consent.ts).
 */
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { MEASURE_EVENT } from "@/components/legal/preferences";
import { JOURNEY_HEARTBEAT_MS } from "@/lib/contracts";
import { trackingAllowed } from "./consent";
import { loadAssignments } from "./experiments";
import { track } from "./tracker";

const ACTIVE_WINDOW_MS = 30_000;

export default function JourneyTracker() {
  const pathname = usePathname();
  const active = useRef({ ms: 0, lastTick: 0, lastInput: 0, path: "/" });

  // Page view per route (App Router): send the previous page's active time first.
  useEffect(() => {
    if (!pathname) return;
    const a = active.current;
    const now = Date.now();
    if (a.ms > 0 && a.path !== pathname) track.heartbeat(a.ms, a.path);
    active.current = { ms: 0, lastTick: now, lastInput: now, path: pathname };
    track.pageView(pathname);
  }, [pathname]);

  useEffect(() => {
    if (trackingAllowed()) void loadAssignments();

    const onInput = () => {
      active.current.lastInput = Date.now();
    };
    const tick = () => {
      const a = active.current;
      const now = Date.now();
      const visible = document.visibilityState === "visible";
      if (visible && now - a.lastInput < ACTIVE_WINDOW_MS) a.ms += Math.max(0, now - a.lastTick);
      a.lastTick = now;
    };
    const beat = window.setInterval(() => {
      tick();
      const a = active.current;
      if (a.ms >= 1000) {
        track.heartbeat(a.ms, a.path);
        a.ms = 0;
      }
    }, JOURNEY_HEARTBEAT_MS);
    const onHide = () => {
      if (document.visibilityState !== "hidden") {
        active.current.lastTick = Date.now();
        return;
      }
      tick();
      track.flush(true);
    };
    const onPageHide = () => {
      tick();
      track.exit(active.current.ms);
      active.current.ms = 0;
    };
    const onChoice = () => {
      if (!trackingAllowed()) track.forget();
      else void loadAssignments();
    };
    const opts = { passive: true } as const;
    for (const ev of ["pointerdown", "keydown", "scroll", "touchstart", "mousemove"]) window.addEventListener(ev, onInput, opts);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener(MEASURE_EVENT, onChoice);
    return () => {
      window.clearInterval(beat);
      for (const ev of ["pointerdown", "keydown", "scroll", "touchstart", "mousemove"]) window.removeEventListener(ev, onInput);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener(MEASURE_EVENT, onChoice);
    };
  }, []);

  return null;
}
