"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";

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
    let rafId = 0;

    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}