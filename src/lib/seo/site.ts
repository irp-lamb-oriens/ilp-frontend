/**
 * SEO source of truth (SEO workstream, 2026-10-29): the canonical origin, the
 * public routes with their search titles and descriptions, and the paths that
 * must never be indexed. app/sitemap.ts, app/robots.ts, every page's
 * metadata and tests/seo.test.mjs read this file.
 *
 * Titles stay at 60 characters or less and descriptions at 155 or less
 * (tests/seo.test.mjs). Copy follows frontend/copy-rules.md. ILP is a
 * membership service, not a law firm: no title or description says ILP
 * gives legal advice.
 */

/** Canonical origin, no trailing slash. www redirects here (next.config.mjs). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://internationallegalpartner.com").replace(/\/+$/, "");

export const SITE_NAME = "International Legal Partner";
export const SITE_SHORT = "ILP";

/** Plain description of what ILP is, used in structured data. */
export const ORG_DESCRIPTION =
  "International Legal Partner (ILP) is a legal membership service for people from the United States and Canada who live in or own property in Colombia, Costa Rica, Mexico, Panama, Portugal or Spain. ILP is not a law firm: legal advice comes from independent partner lawyers licensed in each country.";

export const COUNTRY_NAMES = ["Colombia", "Costa Rica", "Mexico", "Panama", "Portugal", "Spain"] as const;

export type ChangeFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface PublicRoute {
  path: string;
  title: string;
  description: string;
  /** Sitemap priority, 0 to 1. */
  priority: number;
  changeFrequency: ChangeFrequency;
}

/** Every indexable page. Order: money pages, countries, audiences, company, legal. */
export const PUBLIC_ROUTES: PublicRoute[] = [
  {
    path: "/",
    title: "Legal membership for expats in Latin America and Spain | ILP",
    description:
      "Calls with a lawyer licensed in your country, a legal profile and reminders before legal dates in Colombia, Costa Rica, Mexico, Panama, Portugal or Spain.",
    priority: 1,
    changeFrequency: "weekly",
  },
  {
    path: "/check",
    title: "Free deadline check for expats in 6 countries | ILP",
    description:
      "Answer a few questions and see the residency, property tax, company and vehicle dates that may apply to you abroad. Free, about two minutes, no account.",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: "/pricing",
    title: "Pricing: US$79.99 a month legal membership | ILP",
    description:
      "One plan: US$79.99 a month plus a US$100 activation fee. Up to three 20-minute calls a month with a lawyer licensed in your country. Other work is quoted.",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/join",
    title: "Join ILP: legal membership for North Americans abroad",
    description:
      "Join for US$79.99 a month plus a US$100 activation fee. Your customer success manager sets up your legal profile and books your first lawyer call.",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/how-it-works",
    title: "How ILP works: free check, lawyer calls, follow-up",
    description:
      "From the free deadline check to a call with a lawyer licensed in your country, then written next steps and follow-up from your customer success manager.",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/costa-rica",
    title: "Costa Rica legal deadlines for expats: DIMEX, marchamo | ILP",
    description:
      "DIMEX renewal, CCSS payments, municipal property tax, corporation tax and the marchamo: the Costa Rica dates that may apply to you, with a lawyer to ask.",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: "/mexico",
    title: "Mexico legal deadlines for expats: residency, predial | ILP",
    description:
      "Resident card renewal, INM change notices, SAT returns, predial and your fideicomiso: the Mexico dates that may apply to you, with a lawyer to ask.",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: "/panama",
    title: "Panama legal deadlines for expats: tasa única, residency | ILP",
    description:
      "Provisional residency cards, the yearly tasa única, records with your resident agent and property tax installments: Panama dates that may apply to you.",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: "/colombia",
    title: "Colombia legal deadlines for expats: visa, cédula, DIAN | ILP",
    description:
      "Visa registration, cédula de extranjería, DIAN returns, predial and matrícula mercantil: the Colombia dates that may apply to you, with a lawyer to ask.",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: "/portugal",
    title: "Portugal legal deadlines for expats: AIMA renewal, IMI | ILP",
    description:
      "D7 and D8 permit renewal with AIMA, IRS returns, IMI property tax and IUC: the Portugal dates that may apply to you, with a lawyer licensed in Portugal.",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: "/spain",
    title: "Spain legal deadlines for expats: NLV renewal, IBI, 720 | ILP",
    description:
      "Non-lucrative visa and TIE renewal, IRPF, Modelo 720, IBI and the non-resident return: the Spain dates that may apply to you, with a lawyer to ask.",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: "/attorneys",
    title: "For lawyers: advise ILP members in your country",
    description:
      "Lawyers licensed in Colombia, Costa Rica, Mexico, Panama, Portugal or Spain take 20-minute member calls with a brief before each one. ILP does the follow-up.",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  {
    path: "/lawyers/apply",
    title: "Apply as a partner lawyer | ILP",
    description:
      "Apply to take 20-minute video calls with ILP members as a lawyer licensed in Colombia, Costa Rica, Mexico, Panama, Portugal or Spain.",
    priority: 0.5,
    changeFrequency: "monthly",
  },
  {
    path: "/customer-success",
    title: "Customer success at ILP: the member's contact",
    description:
      "Customer success managers welcome ILP members, prepare their profile for the first lawyer call, send the lawyer's next steps and follow up on quotes.",
    priority: 0.5,
    changeFrequency: "monthly",
  },
  {
    path: "/about",
    title: "About International Legal Partner (ILP)",
    description:
      "ILP is a legal membership for North Americans abroad, not a law firm. Independent lawyers licensed in each country give the advice; ILP does the follow-up.",
    priority: 0.5,
    changeFrequency: "monthly",
  },
  {
    path: "/liability-protection",
    title: "Professional liability protection (planned) | ILP",
    description:
      "ILP plans conditional professional liability protection of up to US$100,000 for eligible covered services. It is not active yet; these are the terms.",
    priority: 0.3,
    changeFrequency: "yearly",
  },
  {
    path: "/legal",
    title: "Legal notices and policies | ILP",
    description: "ILP's terms, privacy policy, recording and AI notice, cookie notice, disclaimer, service providers and accessibility statement.",
    priority: 0.3,
    changeFrequency: "yearly",
  },
  {
    path: "/terms",
    title: "Terms of Membership | ILP",
    description: "The terms of the ILP legal membership: what it includes, price and automatic renewal, online cancellation, refunds, and legal work beyond your calls.",
    priority: 0.3,
    changeFrequency: "yearly",
  },
  {
    path: "/privacy",
    title: "Privacy Policy | ILP",
    description: "How ILP collects, uses, shares and protects your personal information, how long it is kept and how to use your privacy rights.",
    priority: 0.3,
    changeFrequency: "yearly",
  },
  {
    path: "/legal/recording",
    title: "Call recording and AI notice | ILP",
    description: "When ILP calls are recorded, who must agree, how AI drafts a summary that your lawyer checks, and how long recordings and transcripts are kept.",
    priority: 0.2,
    changeFrequency: "yearly",
  },
  {
    path: "/legal/cookies",
    title: "Cookie and storage notice | ILP",
    description: "The cookies and browser storage ILP uses, why each one is there, and how to choose whether ILP measures your visit.",
    priority: 0.2,
    changeFrequency: "yearly",
  },
  {
    path: "/legal/disclaimer",
    title: "Legal information disclaimer | ILP",
    description: "Information on the ILP site and in the free deadline check is general information, not legal advice. A licensed lawyer confirms what applies to you.",
    priority: 0.2,
    changeFrequency: "yearly",
  },
  {
    path: "/legal/subprocessors",
    title: "Service providers (sub-processors) | ILP",
    description: "The companies that process member data for ILP, what each one does, and the other services your browser may contact on the ILP site.",
    priority: 0.2,
    changeFrequency: "yearly",
  },
  {
    path: "/legal/accessibility",
    title: "Accessibility statement | ILP",
    description: "The accessibility standard ILP works to, known limits of the site and how to report a barrier.",
    priority: 0.2,
    changeFrequency: "yearly",
  },
  {
    path: "/legal/partner-terms",
    title: "Partner lawyer terms (draft) | ILP",
    description: "The draft terms for independent lawyers who take calls with ILP members: your independence, calls and the portal, paid work and fees, and ending the partnership.",
    priority: 0.2,
    changeFrequency: "yearly",
  },
];

/**
 * Never indexed: signed-in portals, internal pages, utility and redirect
 * routes. robots.txt disallows them, their layouts set noindex, and the
 * sitemap leaves them out.
 */
export const PRIVATE_PREFIXES = ["/dashboard", "/lawyer", "/status", "/csm", "/app", "/ui", "/api", "/alerts", "/join/welcome"] as const;

/** Public pages kept out of the index on purpose (thin or not ready), with the reason. */
export const NOINDEX_PUBLIC: Record<string, string> = {
  "/templates": "The download links are placeholders; index once real templates ship.",
};

export function routeFor(path: string): PublicRoute {
  const r = PUBLIC_ROUTES.find((x) => x.path === path);
  if (!r) throw new Error(`No SEO entry for ${path}`);
  return r;
}

export function absoluteUrl(path: string): string {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}
