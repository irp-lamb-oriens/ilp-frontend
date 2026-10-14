"use client";

import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import s from "./Term.module.scss";

const GAP = 8;
const EDGE = 8;

/**
 * Inline term with a plain-language gloss on hover and keyboard focus.
 * The tooltip renders in a portal so it escapes any overflow-hidden mask
 * slot (e.g. inside an animated heading) and is never clipped.
 */
export default function Term({
  children,
  gloss,
  tabbable = true,
}: {
  children: ReactNode;
  gloss: string;
  /** Set false inside headings so they do not add tab stops. */
  tabbable?: boolean;
}) {
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const rectRef = useRef<{ top: number; bottom: number; centerX: number } | null>(null);

  const show = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    rectRef.current = { top: r.top, bottom: r.bottom, centerX: r.left + r.width / 2 };
    setOpen(true);
  };
  const hide = () => setOpen(false);

  // Once the tooltip is mounted, measure it and clamp it inside the viewport.
  useLayoutEffect(() => {
    if (!open || !tipRef.current || !rectRef.current) return;
    const tip = tipRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const anchor = rectRef.current;

    // Horizontal: center over the term, clamped to the left/right edges.
    const half = tip.width / 2;
    let left = anchor.centerX - half;
    if (left < EDGE) left = EDGE;
    else if (left + tip.width > vw - EDGE) left = vw - tip.width - EDGE;

    // Vertical: prefer above the term; flip below when there is no room.
    const above = anchor.top - tip.height - GAP;
    const below = anchor.bottom + GAP;
    const top = above >= EDGE ? above : below;

    setPos({ top, left });
  }, [open]);

  return (
    <>
      <span
        ref={ref}
        className={s.term}
        tabIndex={tabbable ? 0 : -1}
        aria-describedby={id}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {open &&
        pos &&
        createPortal(
          <span
            ref={tipRef}
            id={id}
            role="tooltip"
            className={s.tip}
            style={{ top: pos.top, left: pos.left }}
          >
            {gloss}
          </span>,
          document.body,
        )}
    </>
  );
}

/**
 * Tokenizes plain text and wraps any phrase present in `glossary` in a Term.
 * Longest keys match first, so "beneficial-owner registry" wins over
 * "beneficial-owner". Returns plain text when no glossary is supplied.
 */
export function renderGlossary(
  text: string,
  glossary?: Record<string, string>,
  tabbable = true,
): ReactNode {
  if (!glossary || Object.keys(glossary).length === 0) return text;

  const keys = Object.keys(glossary).sort((a, b) => b.length - a.length);
  const escaped = keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "gi");

  return text.split(re).map((part, i) => {
    if (!part) return null;
    const key = keys.find((k) => k.toLowerCase() === part.toLowerCase());
    if (key) {
      return (
        <Term key={i} gloss={glossary[key]} tabbable={tabbable}>
          {part}
        </Term>
      );
    }
    return part;
  });
}

export interface TitleSegment {
  text: string;
  gloss?: string;
  spaceAfter: boolean;
}

/**
 * Splits heading text into animated units for RevealTitle. Glossary phrases
 * (including multi-word ones) collapse into a single term segment; everything
 * else stays word-by-word. Without a glossary, behavior matches a plain space
 * split so existing headings animate unchanged.
 */
export function tokenizeTitle(
  text: string,
  glossary?: Record<string, string>,
): TitleSegment[] {
  if (!glossary || Object.keys(glossary).length === 0) {
    const words = text.split(" ");
    return words.map((w, i) => ({ text: w, spaceAfter: i < words.length - 1 }));
  }

  const keys = Object.keys(glossary).sort((a, b) => b.length - a.length);
  const segments: TitleSegment[] = [];
  let i = 0;

  while (i < text.length) {
    let matched = false;
    for (const key of keys) {
      const len = key.length;
      if (text.slice(i, i + len).toLowerCase() !== key.toLowerCase()) continue;
      const next = text[i + len];
      const isWordEnd = next === undefined || next === " " || next === "\u00a0";
      if (!isWordEnd) continue;
      const spaceAfter = next === " " || next === "\u00a0";
      segments.push({ text: text.slice(i, i + len), gloss: glossary[key], spaceAfter });
      i += len + (spaceAfter ? 1 : 0);
      matched = true;
      break;
    }

    if (matched) continue;

    let j = i;
    while (j < text.length && text[j] !== " " && text[j] !== "\u00a0") j++;
    const spaceAfter = text[j] === " " || text[j] === "\u00a0";
    segments.push({ text: text.slice(i, j), spaceAfter });
    i = j + (spaceAfter ? 1 : 0);
  }

  return segments;
}