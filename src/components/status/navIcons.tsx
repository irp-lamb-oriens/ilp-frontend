/**
 * Member nav icons, drawn like the ui icon set (components/ui/icons.tsx):
 * 16px, 1.5px stroke, currentColor, always decorative (the nav link carries
 * the name). They replace the old text glyphs and the envelope emoji.
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

/** Overview: a house. */
export const IconHome = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 7.5L8 3l5.5 4.5" />
    <path d="M4 6.5v6.5h3v-3.5h2V13h3V6.5" />
  </Svg>
);

/** Profile: a person. */
export const IconPerson = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="5.5" r="2.5" />
    <path d="M3 13.5c.6-2.6 2.6-4 5-4s4.4 1.4 5 4" />
  </Svg>
);

/** Money: a card. */
export const IconCard = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="3.5" width="12" height="9" rx="1.5" />
    <path d="M2 6.5h12M4.5 10h2.5" />
  </Svg>
);

/** Messages: a speech bubble. */
export const IconChat = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 3.5h10a1 1 0 011 1v6a1 1 0 01-1 1H7l-3 2.5v-2.5H3a1 1 0 01-1-1v-6a1 1 0 011-1z" />
    <path d="M5 6.5h6M5 8.5h4" />
  </Svg>
);

/** Book a call: a video camera. */
export const IconVideo = (p: IconProps) => (
  <Svg {...p}>
    <rect x="1.5" y="4.5" width="9" height="7" rx="1.5" />
    <path d="M10.5 7l4-2v6l-4-2" />
  </Svg>
);

/** Deadlines: a calendar with a check. */
export const IconDeadlines = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
    <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
    <path d="M6 10l1.5 1.5L10 9" />
  </Svg>
);
