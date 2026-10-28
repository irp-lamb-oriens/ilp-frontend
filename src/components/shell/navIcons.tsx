/**
 * Nav icons for the lawyer and staff portals, drawn like the member set
 * (components/status/navIcons.tsx) and the ui icon set: 16px grid shown at
 * 18px, 1.5px stroke, currentColor, always decorative (the nav link carries
 * the name). They replace the old text glyphs (◷ ▦ ☰ ⚙ and similar).
 */
import type { SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;

function Svg({ children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      {children}
    </svg>
  );
}

/** Today: a clock face. */
export const IconNavToday = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="5.75" />
    <path d="M8 4.75V8l2.25 1.5" />
  </Svg>
);

/** Board and pipeline: three columns of cards. */
export const IconNavBoard = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="2.5" width="3.25" height="11" rx="1" />
    <rect x="6.4" y="2.5" width="3.25" height="7.5" rx="1" />
    <rect x="10.75" y="2.5" width="3.25" height="9" rx="1" />
  </Svg>
);

/** Clients and members: a list with bullets. */
export const IconNavList = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5.5 4h8M5.5 8h8M5.5 12h8" />
    <path d="M2.5 4h.01M2.5 8h.01M2.5 12h.01" />
  </Svg>
);

/** Members: two people. */
export const IconNavPeople = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="6" cy="5.5" r="2.25" />
    <path d="M1.75 13c.5-2.2 2.1-3.4 4.25-3.4s3.75 1.2 4.25 3.4" />
    <path d="M10.5 3.6a2.25 2.25 0 010 4.1M12 9.9c1.2.5 2 1.6 2.25 3.1" />
  </Svg>
);

/** Finance: a banknote. */
export const IconNavMoney = (p: IconProps) => (
  <Svg {...p}>
    <rect x="1.75" y="4" width="12.5" height="8" rx="1.25" />
    <circle cx="8" cy="8" r="1.75" />
    <path d="M4 6.25v.01M12 9.75v.01" />
  </Svg>
);

/** Availability: a calendar. */
export const IconNavCalendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="3" width="12" height="11" rx="1.5" />
    <path d="M2 6.5h12M5.25 1.75v2.5M10.75 1.75v2.5" />
  </Svg>
);

/** Opportunities: a tag. */
export const IconNavTag = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2 2.75v4.5l6.5 6.5 5.25-5.25-6.5-6.5H2.75a.75.75 0 00-.75.75z" />
    <path d="M5 5.25v.01" />
  </Svg>
);

/** Lawyers: a briefcase. */
export const IconNavBriefcase = (p: IconProps) => (
  <Svg {...p}>
    <rect x="1.75" y="4.75" width="12.5" height="8.5" rx="1.25" />
    <path d="M5.75 4.75v-1.5a1 1 0 011-1h2.5a1 1 0 011 1v1.5M1.75 8.5h12.5" />
  </Svg>
);

/** Reports: a bar chart. */
export const IconNavChart = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2 13.75h12" />
    <path d="M4 11.5V8M7.25 11.5V4.5M10.5 11.5V6.5M13 11.5V9.5" />
  </Svg>
);

/** Settings: a set of sliders. */
export const IconNavSliders = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2 4.5h7M12 4.5h2M2 11.5h2M7 11.5h7" />
    <circle cx="10.5" cy="4.5" r="1.5" />
    <circle cx="5.5" cy="11.5" r="1.5" />
  </Svg>
);

/** Privacy: a shield. */
export const IconNavShield = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 1.75l5.25 2v4c0 3.1-2.2 5.4-5.25 6.5C4.95 13.15 2.75 10.85 2.75 7.75v-4z" />
    <path d="M5.75 8l1.5 1.5 3-3" />
  </Svg>
);
