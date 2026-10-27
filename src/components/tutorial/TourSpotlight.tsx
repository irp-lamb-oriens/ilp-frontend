"use client";

/**
 * "Show me on this page": dims the live page around one [data-tour] element
 * and shows the step's text beside it, with a button back to the tutorial.
 * Fades with opacity only; the cut-out is four flat scrim panels, so nothing
 * on the page moves or blurs.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "../ui/Button";
import { cx } from "../ui/cx";
import { useReducedMotion } from "./useReducedMotion";
import s from "./TourSpotlight.module.scss";

export interface TourSpotlightProps {
  target: string;
  title: string;
  body: string;
  onDone: () => void;
}

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;

export function TourSpotlight({ target, title, body, onDone }: TourSpotlightProps) {
  const reduced = useReducedMotion();
  const [box, setBox] = useState<Box | null>(null);
  const [shown, setShown] = useState(false);
  const panels = useRef<Array<HTMLDivElement | null>>([]);
  const ringRef = useRef<HTMLDivElement>(null);
  const calloutRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement | null>(null);

  // Find the element, bring it into view, then track it on scroll and resize.
  useEffect(() => {
    let el: Element | null = null;
    try {
      el = document.querySelector(`[data-tour="${CSS.escape(target)}"]`);
    } catch {
      el = null;
    }
    if (!el) {
      onDone();
      return;
    }
    el.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = (el as Element).getBoundingClientRect();
        setBox({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
      });
    };
    measure();
    const t = window.setTimeout(() => setShown(true), 30);
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [target, reduced, onDone]);

  // Place the panels, ring and callout (static geometry; only opacity animates).
  useLayoutEffect(() => {
    if (!box) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rects = [
      { top: 0, left: 0, width: vw, height: Math.max(0, box.top) },
      { top: box.top + box.height, left: 0, width: vw, height: Math.max(0, vh - box.top - box.height) },
      { top: box.top, left: 0, width: Math.max(0, box.left), height: box.height },
      { top: box.top, left: box.left + box.width, width: Math.max(0, vw - box.left - box.width), height: box.height },
    ];
    rects.forEach((r, i) => {
      const p = panels.current[i];
      if (!p) return;
      Object.assign(p.style, { top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` });
    });
    const ring = ringRef.current;
    if (ring) Object.assign(ring.style, { top: `${box.top}px`, left: `${box.left}px`, width: `${box.width}px`, height: `${box.height}px` });
    const c = calloutRef.current;
    if (c) {
      const cw = Math.min(352, vw - 32);
      const ch = c.offsetHeight || 160;
      const below = box.top + box.height + 12;
      const top = below + ch < vh - 16 ? below : Math.max(16, box.top - ch - 12);
      const left = Math.min(Math.max(16, box.left), vw - cw - 16);
      Object.assign(c.style, { top: `${top}px`, left: `${left}px`, width: `${cw}px` });
    }
  }, [box]);

  useEffect(() => {
    backRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onDone();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDone]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className={cx(s.root, shown && box && s.shown)}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={s.panel}
          aria-hidden="true"
          onClick={onDone}
          ref={(el) => {
            panels.current[i] = el;
          }}
        />
      ))}
      <div ref={ringRef} className={s.ring} aria-hidden="true" />
      <div ref={calloutRef} className={s.callout} role="dialog" aria-modal="false" aria-labelledby="tour-spot-title">
        <p id="tour-spot-title" className={s.title}>
          {title}
        </p>
        <p className={s.body}>{body}</p>
        <span
          ref={(el) => {
            backRef.current = el?.querySelector("button") ?? null;
          }}
        >
          <Button onClick={onDone}>Back to the tutorial</Button>
        </span>
      </div>
    </div>,
    document.body,
  );
}

export default TourSpotlight;
