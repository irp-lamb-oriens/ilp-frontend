/**
 * DEADLINES: one outline icon per legal area, drawn like the ui icon set
 * (16px grid, 1.5px stroke, currentColor). Always decorative: the card's
 * area heading carries the name.
 */
import type { ReactNode } from "react";

const PATHS: Record<string, ReactNode> = {
  // a passport
  immigration: (
    <>
      <rect x="3.5" y="2" width="9" height="12" rx="1.2" />
      <circle cx="8" cy="7" r="2" />
      <path d="M6 11h4" />
    </>
  ),
  // a house
  property: (
    <>
      <path d="M2.5 7.5L8 3l5.5 4.5" />
      <path d="M4 6.5V13h8V6.5" />
      <path d="M7 13v-3h2v3" />
    </>
  ),
  // a building with a flag
  corporate: (
    <>
      <path d="M3 13.5V5l5-2.5L13 5v8.5" />
      <path d="M2 13.5h12M6 7h1M9 7h1M6 10h1M9 10h1" />
    </>
  ),
  // a receipt
  tax: (
    <>
      <path d="M4 2h8v12l-2-1.2L8 14l-2-1.2L4 14z" />
      <path d="M6 5.5h4M6 8h4M6 10.5h2" />
    </>
  ),
  // a car
  vehicle: (
    <>
      <path d="M2.5 10.5V8.5l1.5-3.5h8l1.5 3.5v2" />
      <path d="M2.5 10.5h11" />
      <circle cx="5" cy="11.5" r="1.2" />
      <circle cx="11" cy="11.5" r="1.2" />
    </>
  ),
  // two people
  employment: (
    <>
      <circle cx="6" cy="5.5" r="2" />
      <path d="M2.5 13c.4-2.2 1.8-3.5 3.5-3.5s3.1 1.3 3.5 3.5" />
      <circle cx="11" cy="6" r="1.6" />
      <path d="M10.5 9.6c1.6 0 2.7 1.2 3 3.2" />
    </>
  ),
  // a document with a fold
  estate: (
    <>
      <path d="M4 2h5.5L12 4.5V14H4z" />
      <path d="M9.5 2v2.5H12M6 8h4M6 10.5h4" />
    </>
  ),
  // an ID card
  identity: (
    <>
      <rect x="2" y="3.5" width="12" height="9" rx="1.2" />
      <circle cx="5.5" cy="7.5" r="1.4" />
      <path d="M3.8 10.5c.4-.9 1-1.3 1.7-1.3s1.3.4 1.7 1.3M9 6.5h3M9 9h3" />
    </>
  ),
  // a globe
  cross_border: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M2.5 8h11M8 2.5c1.6 1.6 2.3 3.5 2.3 5.5S9.6 11.9 8 13.5M8 2.5C6.4 4.1 5.7 6 5.7 8s.7 3.9 2.3 5.5" />
    </>
  ),
};

/** A calendar, for any area without its own icon. */
const FALLBACK = (
  <>
    <rect x="2.5" y="3.5" width="11" height="10" rx="1.2" />
    <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
  </>
);

export function AreaIcon({ area, size = 20, className }: { area: string; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {PATHS[area] ?? FALLBACK}
    </svg>
  );
}

export default AreaIcon;
