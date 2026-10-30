/**
 * Structured data builders (schema.org JSON-LD). Rendered in the server HTML
 * by components/seo/JsonLd.tsx and checked by tests/seo.test.mjs.
 *
 * Rules (SEO workstream): ILP is described as a membership service, never as
 * a law firm or as the provider of legal advice. No Review, Rating or
 * AggregateRating anywhere (the example situations on the site are
 * illustrations, not reviews). sameAs is omitted until ILP has real public
 * profiles. No SearchAction: the site has no search.
 */
import { COUNTRY_NAMES, ORG_DESCRIPTION, SITE_NAME, SITE_SHORT, SITE_URL, absoluteUrl } from "./site";

export type JsonLdObject = Record<string, unknown>;

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;
const SERVICE_ID = `${SITE_URL}/#membership`;

export const CONTACT_EMAIL = "team@internationallegalpartner.com";

const countries = () => COUNTRY_NAMES.map((name) => ({ "@type": "Country", name }));

export function organizationLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    alternateName: SITE_SHORT,
    url: `${SITE_URL}/`,
    logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png`, width: 408, height: 408 },
    description: ORG_DESCRIPTION,
    email: CONTACT_EMAIL,
    areaServed: countries(),
  };
}

export function websiteLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    name: SITE_NAME,
    alternateName: SITE_SHORT,
    url: `${SITE_URL}/`,
    inLanguage: "en",
    publisher: { "@id": ORG_ID },
  };
}

/**
 * The membership as a Service with its Offer: US$79.99 a month (plus a
 * US$100 activation fee, stated in the description and as a second price
 * component). Calls are with independent partner lawyers.
 */
export function membershipLd(country?: string): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": country ? `${SERVICE_ID}-${country.toLowerCase().replace(/\s+/g, "-")}` : SERVICE_ID,
    name: country ? `ILP legal membership in ${country}` : "ILP legal membership",
    serviceType: "Legal membership service",
    description:
      "A monthly membership that organizes your legal life abroad: up to three 20-minute video calls a month with an independent lawyer licensed in your country, a living legal profile, reminders before legal dates and follow-up from a customer success manager. ILP is not a law firm; legal advice comes from the partner lawyer. Separate legal work is quoted in writing and paid separately.",
    provider: { "@id": ORG_ID },
    audience: { "@type": "Audience", audienceType: "People from the United States and Canada who live in or own property abroad" },
    areaServed: country ? [{ "@type": "Country", name: country }] : countries(),
    url: absoluteUrl("/pricing"),
    offers: {
      "@type": "Offer",
      url: absoluteUrl("/join"),
      price: "79.99",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      priceSpecification: [
        {
          "@type": "UnitPriceSpecification",
          price: "79.99",
          priceCurrency: "USD",
          unitCode: "MON",
          referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
          name: "Monthly membership",
        },
        {
          "@type": "UnitPriceSpecification",
          price: "100.00",
          priceCurrency: "USD",
          name: "One-time activation fee",
        },
      ],
    },
  };
}

export interface Qa {
  q: string;
  a: string;
}

/** FAQPage from Q&A that are visible on the same page (same source array). */
export function faqLd(items: readonly Qa[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

/** BreadcrumbList from Home to the page. `trail` is [name, path] pairs after Home. */
export function breadcrumbLd(trail: ReadonlyArray<readonly [string, string]>): JsonLdObject {
  const items = [["Home", "/"] as const, ...trail];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: absoluteUrl(path),
    })),
  };
}

/** Serialize for a script tag: escapes "<" so text can never close the tag. */
export function serializeLd(data: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
