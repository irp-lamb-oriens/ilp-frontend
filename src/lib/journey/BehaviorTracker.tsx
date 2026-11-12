"use client";

/**
 * BEHAVIOR: mounted once in the root layout next to JourneyTracker. On public
 * pages, with measurement consent, it feeds one collector per page view
 * (lib/journey/behavior.ts) and sends its summary when the visitor leaves the
 * page or hides the tab. Renders nothing. Does nothing inside the portals,
 * inside the staff heat map preview (an iframe), or without consent.
 */
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { API_URL } from "@/lib/api";
import { type ClickTarget, type Collector, behaviorPath, createCollector, deviceFor, isInteractive } from "./behavior";
import { trackingAllowed } from "./consent";

const ACTIVE_WINDOW_MS = 30_000;
const TICK_MS = 1000;
const DEAD_WAIT_MS = 700;

function framed(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function docSize(): { w: number; h: number } {
  const d = document.documentElement;
  return { w: Math.max(d.scrollWidth, d.clientWidth), h: Math.max(d.scrollHeight, d.clientHeight) };
}

function describe(el: Element): { target: ClickTarget; interactive: boolean } {
  const hit = el.closest("a,button,input,select,textarea,summary,label,[role=button],[role=link],[role=tab],[role=menuitem]") ?? el;
  const tag = hit.tagName.toLowerCase();
  const target: ClickTarget = { tag, role: hit.getAttribute("role") };
  if (tag === "a") {
    try {
      const u = new URL((hit as HTMLAnchorElement).href, window.location.href);
      target.external = u.origin !== window.location.origin;
      target.linkPath = target.external ? null : u.pathname;
    } catch {
      target.linkPath = null;
    }
  }
  if (tag === "input" || tag === "select" || tag === "textarea") {
    // The field's type and name only. Never its value.
    target.inputType = hit.getAttribute("type");
    target.inputName = hit.getAttribute("name") || hit.id || null;
  } else if (tag === "a" || tag === "button" || tag === "summary" || tag === "label" || target.role) {
    target.text = (hit.getAttribute("aria-label") || hit.textContent || "").slice(0, 80);
  }
  return { target, interactive: isInteractive(target) };
}

function send(c: Collector): void {
  if (!c.touched()) return;
  const body = JSON.stringify(c.summary(deviceFor(window.innerWidth)));
  const url = `${API_URL}/api/journey/behavior`;
  try {
    if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon(url, new Blob([body], { type: "text/plain;charset=UTF-8" }))) return;
  } catch {
    // fall through
  }
  try {
    void fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true, credentials: "omit" }).catch(() => undefined);
  } catch {
    // measurement never breaks the page
  }
}

export default function BehaviorTracker() {
  const pathname = usePathname();
  const col = useRef<Collector | null>(null);
  const lastInput = useRef(0);

  // One collector per page view: send the previous page's summary first.
  useEffect(() => {
    if (col.current) send(col.current);
    col.current = null;
    if (!pathname || framed() || !trackingAllowed()) return;
    const path = behaviorPath(pathname);
    if (path) {
      col.current = createCollector(path);
      lastInput.current = Date.now();
    }
  }, [pathname]);

  useEffect(() => {
    if (framed()) return;
    let raf = 0;
    const seeNow = (ms = 0) => {
      const c = col.current;
      if (!c) return;
      c.see(window.scrollY, window.innerHeight, docSize().h, ms);
    };
    const onScroll = () => {
      lastInput.current = Date.now();
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        seeNow();
      });
    };
    const onInput = () => {
      lastInput.current = Date.now();
    };
    const tick = window.setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - lastInput.current < ACTIVE_WINDOW_MS) seeNow(TICK_MS);
    }, TICK_MS);

    const onClick = (e: MouseEvent) => {
      const c = col.current;
      if (!c || !(e.target instanceof Element)) return;
      lastInput.current = Date.now();
      const { w, h } = docSize();
      const { target, interactive } = describe(e.target);
      const index = c.click(e.pageX, e.pageY, w, h, target, Date.now());
      if (index < 0 || interactive) return;
      // Dead click: a click on something that is not a control, after which
      // nothing on the page changes, scrolls or navigates.
      const href = window.location.href;
      const y = window.scrollY;
      let changed = false;
      const mo = new MutationObserver(() => {
        changed = true;
      });
      try {
        mo.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
      } catch {
        return;
      }
      window.setTimeout(() => {
        mo.disconnect();
        const selecting = (window.getSelection()?.toString() ?? "") !== "";
        if (!changed && !selecting && window.location.href === href && Math.abs(window.scrollY - y) < 4 && col.current === c) c.dead(index);
      }, DEAD_WAIT_MS);
    };

    const onError = () => col.current?.error();

    // Page speed, where the browser supports it.
    const observers: PerformanceObserver[] = [];
    const watch = (type: string, fn: (entry: PerformanceEntry) => void, extra: Record<string, unknown> = {}) => {
      try {
        const po = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) fn(entry);
        });
        po.observe({ type, buffered: true, ...extra } as PerformanceObserverInit);
        observers.push(po);
      } catch {
        // not supported here
      }
    };
    watch("largest-contentful-paint", (e) => col.current?.vitals({ lcp: e.startTime }));
    watch("layout-shift", (e) => {
      const ls = e as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
      if (!ls.hadRecentInput && ls.value) col.current?.vitals({ clsDelta: ls.value });
    });
    watch("event", (e) => {
      if (e.duration >= 40) col.current?.vitals({ inp: e.duration });
    }, { durationThreshold: 40 });

    // Hidden tab or closed page: send what we have. If the visitor comes
    // back, what follows is a continuation of the same view, not a new one.
    const onHide = () => {
      if (document.visibilityState !== "hidden") {
        lastInput.current = Date.now();
        return;
      }
      const c = col.current;
      if (!c) return;
      send(c);
      col.current = createCollector(c.path, true);
    };
    const onPageHide = () => {
      if (col.current) send(col.current);
      col.current = null;
    };

    const passive = { passive: true } as const;
    window.addEventListener("scroll", onScroll, passive);
    for (const ev of ["pointerdown", "keydown", "touchstart", "mousemove"]) window.addEventListener(ev, onInput, passive);
    document.addEventListener("click", onClick, true);
    window.addEventListener("error", onError);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.clearInterval(tick);
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      for (const ev of ["pointerdown", "keydown", "touchstart", "mousemove"]) window.removeEventListener(ev, onInput);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("error", onError);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
      for (const po of observers) po.disconnect();
    };
  }, []);

  return null;
}
