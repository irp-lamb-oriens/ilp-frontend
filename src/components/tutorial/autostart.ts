"use client";

/**
 * First-visit auto-start. Waits until the page's own loading is done
 * (no aria-busy region inside <main>) and no dialog or drawer is open (for
 * example the unsaved-changes prompt), then opens the route's tutorial once.
 */
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTutorialOptional } from "./context";
import type { TutorialRole } from "./types";

/** NEXT_PUBLIC_TUTORIALS_AUTOSTART=false turns auto-start off everywhere. */
export const AUTOSTART_ENV = process.env.NEXT_PUBLIC_TUTORIALS_AUTOSTART !== "false";

const POLL_MS = 300;
const STABLE_TICKS = 3;
const GIVE_UP_MS = 20000;

/** True when nothing on the page is loading and no modal layer is open. */
export function pageIsReady(doc: Document): boolean {
  if (doc.visibilityState === "hidden") return false;
  if (doc.querySelector('[aria-modal="true"]')) return false;
  const busy = Array.from(doc.querySelectorAll('main [aria-busy="true"]')).some((el) => el.tagName !== "BUTTON");
  return !busy && !!doc.querySelector("main");
}

/**
 * Call from a role shell once the viewer is signed in. Pass enabled=false
 * while the session is still being checked.
 */
export function useTutorialAutoStart(role: TutorialRole, enabled: boolean): void {
  const api = useTutorialOptional();
  const pathname = usePathname();
  const apiRef = useRef(api);
  apiRef.current = api;
  const hasApi = !!api;

  useEffect(() => {
    if (!hasApi || !enabled || !AUTOSTART_ENV || !pathname) return;
    let cancelled = false;
    let timer = 0;
    const began = Date.now();

    void (async () => {
      const cur = apiRef.current;
      if (!cur) return;
      const reg = await cur.ensureLoaded();
      if (cancelled) return;
      const t = reg.forRoute(pathname, role);
      if (!t || t.autoStart === "never" || !apiRef.current?.shouldAutoStart(t.id)) return;
      let stable = 0;
      const tick = () => {
        if (cancelled || Date.now() - began > GIVE_UP_MS) return;
        const a = apiRef.current;
        if (!a || a.active) return;
        stable = pageIsReady(document) ? stable + 1 : 0;
        if (stable >= STABLE_TICKS) {
          void a.start(t.id, { auto: true });
          return;
        }
        timer = window.setTimeout(tick, POLL_MS);
      };
      timer = window.setTimeout(tick, POLL_MS);
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [hasApi, enabled, pathname, role]);
}
