"use client";

import { useId, type ReactNode } from "react";
import s from "./Term.module.scss";

/**
 * Inline term with a plain-language gloss on hover and keyboard focus.
 * Country-specific names stay in the copy; the tooltip explains them.
 */
export default function Term({
  children,
  gloss,
}: {
  children: ReactNode;
  gloss: string;
}) {
  const id = useId();
  return (
    <span className={s.term} tabIndex={0} aria-describedby={id}>
      {children}
      <span className={s.tip} id={id} role="tooltip">
        {gloss}
      </span>
    </span>
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
        <Term key={i} gloss={glossary[key]}>
          {part}
        </Term>
      );
    }
    return part;
  });
}