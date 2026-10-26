/**
 * Legal document versions (P6). A ConsentRecord stores the version the person
 * saw, so bump an id whenever its text changes in a way that needs fresh
 * consent. Keep equal to LEGAL_VERSIONS in server/API/privacy/policy.ts (the
 * server refuses a consent sent with a different version).
 */
export const LEGAL_VERSIONS = {
  terms: "terms-2026-10-26-draft1",
  privacy: "privacy-2026-10-26-draft1",
  recording: "recording-ai-2026-10-26-draft1",
  cookies: "cookies-2026-10-26-draft1",
  disclaimer: "disclaimer-2026-10-26-draft1",
  accessibility: "accessibility-2026-10-26-draft1",
  subprocessors: "subprocessors-2026-10-26-draft1",
} as const;

export type LegalDocId = keyof typeof LEGAL_VERSIONS;

/** Every legal page, in footer order. */
export const LEGAL_DOCS: Array<{ id: LegalDocId; title: string; href: string; short: string }> = [
  { id: "privacy", title: "Privacy Policy", href: "/privacy", short: "Privacy" },
  { id: "terms", title: "Terms of Membership", href: "/terms", short: "Terms" },
  { id: "recording", title: "Call recording and AI notice", href: "/legal/recording", short: "Recording and AI" },
  { id: "cookies", title: "Cookie and storage notice", href: "/legal/cookies", short: "Cookies" },
  { id: "disclaimer", title: "Legal information disclaimer", href: "/legal/disclaimer", short: "Disclaimer" },
  { id: "subprocessors", title: "Service providers (sub-processors)", href: "/legal/subprocessors", short: "Sub-processors" },
  { id: "accessibility", title: "Accessibility statement", href: "/legal/accessibility", short: "Accessibility" },
];

export const LEGAL_UPDATED = "October 26, 2026";
