"use client";

import type { ReactNode } from "react";
import { RevealText, Stage, StageItem } from "@/components/motion/Story";
import s from "./landing.module.scss";

export type LandingIconName = "calendar" | "play" | "profile" | "path" | "globe" | "example" | "price" | "question" | "lawyer";

const PATHS: Record<LandingIconName, ReactNode> = {
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4M8 13.5h3" />
    </>
  ),
  play: (
    <>
      <rect x="3" y="4.5" width="18" height="13" rx="2" />
      <path d="M10.5 8.5v5l4-2.5z" />
      <path d="M8 20.5h8" />
    </>
  ),
  profile: (
    <>
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
      <circle cx="12" cy="9.5" r="2.5" />
      <path d="M8 16.5c.8-1.8 2.2-2.6 4-2.6s3.2.8 4 2.6" />
    </>
  ),
  path: (
    <>
      <circle cx="5.5" cy="6" r="2" />
      <circle cx="18.5" cy="18" r="2" />
      <path d="M7.5 6h7a3.5 3.5 0 0 1 0 7h-5a3.5 3.5 0 0 0 0 7h7" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5s1.1-6.1 3.5-8.5z" />
    </>
  ),
  example: (
    <>
      <path d="M5 4.5h10l4 4v11H5z" />
      <path d="M15 4.5v4h4M8.5 12.5h7M8.5 16h5" />
    </>
  ),
  price: (
    <>
      <path d="M3.5 12.5 11 5h8v8l-7.5 7.5z" />
      <circle cx="15.5" cy="8.5" r="1.3" />
    </>
  ),
  question: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6M12 16.8v.2" />
    </>
  ),
  lawyer: (
    <>
      <path d="M12 4v16M6 20h12M5 8h14" />
      <path d="M5 8l-2.5 6a2.5 2.5 0 0 0 5 0zM19 8l-2.5 6a2.5 2.5 0 0 0 5 0z" />
    </>
  ),
};

/** Outline icon for a homepage section heading. Decorative. */
export function LandingIcon({ name, className }: { name: LandingIconName; className?: string }) {
  return (
    <svg
      className={className ?? s.headIcon}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

interface SectionHeadProps {
  /** What the section is, as a sentence-case heading. */
  title: string;
  /** One sentence on why it matters to the reader. */
  why: ReactNode;
  /** The key phrase of `why`, underlined in the accent once it is read. */
  mark?: string;
  icon?: LandingIconName;
  center?: boolean;
  /** Show the heading at once (inside pinned or sticky stages). */
  immediate?: boolean;
  className?: string;
  /** Id for the heading, so the section can be aria-labelledby it. */
  id?: string;
}

/**
 * The "what / why" head every homepage section opens with, staged like every
 * scroll story level (motion/Story.tsx): the icon tile and its accent rule
 * first, then the heading rises in, then the why line brightens phrase by
 * phrase and its key phrase is underlined.
 */
export function SectionHead({ title, why, mark, icon, center, immediate, className, id }: SectionHeadProps) {
  return (
    <Stage
      className={[s.sectionHead, center ? s.centerHead : "", className ?? ""].join(" ").trim()}
      immediate={immediate}
      amount={0.5}
    >
      {icon && (
        <StageItem level="eyebrow" className={s.headMarker}>
          <LandingIcon name={icon} />
        </StageItem>
      )}
      <StageItem as="h2" level="title" id={id} className={s.headingXl}>
        {title}
      </StageItem>
      {typeof why === "string" ? (
        <RevealText text={why} mark={mark} className={s.sub} />
      ) : (
        <StageItem level="body">
          <p className={s.sub}>{why}</p>
        </StageItem>
      )}
    </Stage>
  );
}
