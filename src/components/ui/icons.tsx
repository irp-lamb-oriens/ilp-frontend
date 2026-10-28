/**
 * Small line icons for the form primitives (16px, 1.5px stroke, currentColor).
 * Always decorative: the button or control around them carries the name.
 */
import type { SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;

function Svg({ children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      {children}
    </svg>
  );
}

export const IconPlus = (p: IconProps) => <Svg {...p}><path d="M8 3v10M3 8h10" /></Svg>;
export const IconMinus = (p: IconProps) => <Svg {...p}><path d="M3 8h10" /></Svg>;
export const IconClose = (p: IconProps) => <Svg {...p}><path d="M4 4l8 8M12 4l-8 8" /></Svg>;
export const IconCopy = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
    <path d="M10.5 3.5v-.5a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v6.5a1 1 0 0 0 1 1h.5" />
  </Svg>
);
export const IconClock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="5.75" />
    <path d="M8 5v3.25l2 1.25" />
  </Svg>
);
export const IconCalendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
    <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
  </Svg>
);
export const IconCheck = (p: IconProps) => <Svg {...p}><path d="M3.5 8.5l3 3 6-7" /></Svg>;

// Notice tone icons (outline, same 16px / 1.5px stroke as the rest).
export const IconInfo = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="6.25" />
    <path d="M8 7.25v4M8 4.75v.01" />
  </Svg>
);
export const IconSuccess = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="6.25" />
    <path d="M5.25 8.25l1.9 1.9 3.6-4" />
  </Svg>
);
export const IconWarning = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 2.25l6.25 11H1.75z" />
    <path d="M8 6.5v3M8 11.25v.01" />
  </Svg>
);
export const IconDanger = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5.4 1.75h5.2l3.65 3.65v5.2l-3.65 3.65H5.4L1.75 10.6V5.4z" />
    <path d="M8 4.75v3.75M8 10.75v.01" />
  </Svg>
);
export const IconNote = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 1.75h6l3 3v9.5h-9z" />
    <path d="M9.5 1.75v3h3M5.75 8h4.5M5.75 10.5h4.5" />
  </Svg>
);
export const IconChevronDown = (p: IconProps) => <Svg {...p}><path d="M4 6l4 4 4-4" /></Svg>;
export const IconChevronRight = (p: IconProps) => <Svg {...p}><path d="M6 4l4 4-4 4" /></Svg>;
export const IconArrowLeft = (p: IconProps) => <Svg {...p}><path d="M13 8H3M7 4L3 8l4 4" /></Svg>;
export const IconArrowRight = (p: IconProps) => <Svg {...p}><path d="M3 8h10M9 4l4 4-4 4" /></Svg>;
/** A speech bubble: member messages and comments (notes use IconNote). */
export const IconMessage = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 3h10a1 1 0 011 1v6a1 1 0 01-1 1H7l-3 2.5V11H3a1 1 0 01-1-1V4a1 1 0 011-1z" />
  </Svg>
);
export const IconFilter = (p: IconProps) => <Svg {...p}><path d="M2.5 3.5h11M4.5 8h7M6.5 12.5h3" /></Svg>;
export const IconColumns = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
    <path d="M6.25 2.5v11M9.75 2.5v11" />
  </Svg>
);
export const IconBookmark = (p: IconProps) => <Svg {...p}><path d="M4.5 2.5h7v11L8 10.75 4.5 13.5z" /></Svg>;
export const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="7" cy="7" r="4.25" />
    <path d="M10.25 10.25l3.25 3.25" />
  </Svg>
);
export const IconChevronLeft = (p: IconProps) => <Svg {...p}><path d="M10 3.5L5.5 8l4.5 4.5" /></Svg>;
export const IconDensity = (p: IconProps) => <Svg {...p}><path d="M2.5 4h11M2.5 8h11M2.5 12h11" /></Svg>;
