"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";

/** The running Lenis instance, or null (reduced motion, before mount). */
let active: Lenis | null = null;

/**
 * Scroll the page to y (px). Goes through Lenis when it is running, so its
 * own animated position does not pull the page back; otherwise native.
 * smooth=false jumps there at once.
 */
export function scrollPageTo(y: number, smooth: boolean) {
  if (active) {
    active.scrollTo(y, { immediate: !smooth, force: true });
    return;
  }
  window.scrollTo({ top: y, behavior: smooth ? "smooth" : "auto" });
}

/**
 * Global Lenis smooth scroll. Mounted once around the app body so every page
 * scrolls with inertia. Disabled under prefers-reduced-motion so vestibular
 * users keep the native scroll. The rAF loop is torn down on unmount.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis({ lerp: 0.1, duration: 1.2 });
    active = lenis;
    let rafId = 0;

    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      if (active === lenis) active = null;
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}