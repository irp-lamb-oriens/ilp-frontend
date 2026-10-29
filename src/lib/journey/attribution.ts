/**
 * Where a visitor came from (JOURNEYS). Pure: reads a query string, the
 * referrer and the site's host. Outbound means ILP contacted the person first:
 * a link from an outreach email carries ?o=<outreach id>. Imported leads and
 * CSM calls are marked outbound by the server (it knows the lead). Everyone
 * else is inbound: a utm campaign, a search engine, another site, or direct.
 *
 * First touch wins for inbound visitors; an outreach link always wins, and
 * an outbound visitor stays outbound.
 */
import { type JourneyChannel, type JourneySource, type JourneyUtm, OUTBOUND_CHANNELS, OUTREACH_PARAM } from "@/lib/contracts";

export interface Attribution {
  source: JourneySource;
  channel: JourneyChannel;
  utm?: JourneyUtm;
  outreachId?: string;
}

const SEARCH_ENGINES = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|brave|startpage|qwant|yandex|baidu|kagi)\.[a-z.]+$/;
const OUTREACH_RE = /^[A-Za-z0-9_-]{6,64}$/;

/** A utm value or slug: lowercase, [a-z0-9._-] only, at most `max` characters; undefined when empty. */
export function cleanSlug(v: unknown, max = 80): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9._-]/g, "").slice(0, max);
  return s || undefined;
}

export function readUtm(params: URLSearchParams): JourneyUtm | undefined {
  const utm: JourneyUtm = {
    source: cleanSlug(params.get("utm_source")),
    medium: cleanSlug(params.get("utm_medium")),
    campaign: cleanSlug(params.get("utm_campaign")),
    content: cleanSlug(params.get("utm_content")),
  };
  for (const k of Object.keys(utm) as (keyof JourneyUtm)[]) if (!utm[k]) delete utm[k];
  return Object.keys(utm).length ? utm : undefined;
}

export function isOutboundChannel(c: JourneyChannel): boolean {
  return OUTBOUND_CHANNELS.includes(c);
}

export function resolveAttribution(
  input: { search: string; referrer: string; host: string },
  stored?: Attribution | null,
): Attribution {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(input.search);
  } catch {
    params = new URLSearchParams();
  }
  const utm = readUtm(params);
  const o = params.get(OUTREACH_PARAM);
  if (o && OUTREACH_RE.test(o)) return { source: "outbound", channel: "email_outreach", outreachId: o, ...(utm ? { utm } : {}) };
  // First touch: a stored attribution (outbound or inbound) is kept.
  if (stored) return stored;
  if (utm?.source || utm?.campaign) return { source: "inbound", channel: "campaign", utm };
  let refHost = "";
  try {
    refHost = input.referrer ? new URL(input.referrer).hostname.toLowerCase() : "";
  } catch {
    refHost = "";
  }
  const host = input.host.toLowerCase().replace(/^www\./, "");
  if (refHost && refHost.replace(/^www\./, "") !== host) {
    return { source: "inbound", channel: SEARCH_ENGINES.test(refHost) ? "organic" : "referral" };
  }
  return { source: "inbound", channel: "direct" };
}

/** Parse a stored attribution; null when it is not one. */
export function parseAttribution(raw: string | null): Attribution | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Attribution;
    if ((v.source === "inbound" || v.source === "outbound") && typeof v.channel === "string") return v;
  } catch {
    // corrupt
  }
  return null;
}
