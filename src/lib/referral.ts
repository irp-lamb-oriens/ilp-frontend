/**
 * REFERRALS: partner links (server/API/referrals).
 *
 * Capture: a visitor who lands with ?ref=<code> (or through /r/<code>) gets a
 * first-party cookie `ilp_ref` = "<code>|<ISO time>" for 90 days, set by
 * src/middleware.ts. Public forms (free check, claim, hero lead, join) send
 * it as `ref` / `refAt`; the server ties the person to the partner (first
 * partner wins) and pays the partner's commission on each collected payment.
 */

import { createApiClient, staffApi } from "./api";

export { REF_COOKIE, REF_DAYS, REF_CODE_RE, refCookieValue, parseRefCookie, readRef } from "./referralCookie";

// ─── Types (server/API/referrals/types.ts and reports.ts) ──────────────────

export type Brand = "ilp" | "irp" | "aiva" | "censo";
export const BRANDS: Brand[] = ["ilp", "irp", "aiva", "censo"];
export const BRAND_LABEL: Record<Brand, string> = { ilp: "ILP", irp: "IRP", aiva: "AIVA", censo: "El Censo" };

export type PartnerType = "expert" | "teacher" | "media" | "influencer" | "referrer" | "local";
export const PARTNER_TYPES: Array<{ value: PartnerType; label: string }> = [
  { value: "teacher", label: "Teacher or community" },
  { value: "expert", label: "Expert (lawyer, accountant, advisor)" },
  { value: "media", label: "Media" },
  { value: "influencer", label: "Influencer" },
  { value: "referrer", label: "Individual referrer" },
  { value: "local", label: "Local business (QR)" },
];
export const PARTNER_TYPE_LABEL = Object.fromEntries(PARTNER_TYPES.map((t) => [t.value, t.label])) as Record<PartnerType, string>;

export type PartnerStatus = "invited" | "active" | "paused" | "closed";
export type PayoutMethod = "wire" | "sinpe" | "wise" | "paypal" | "other";
export const PAYOUT_METHODS: Array<{ value: PayoutMethod; label: string }> = [
  { value: "wire", label: "Bank transfer" },
  { value: "sinpe", label: "SINPE Móvil" },
  { value: "wise", label: "Wise" },
  { value: "paypal", label: "PayPal" },
  { value: "other", label: "Other" },
];

export interface Totals {
  leads: number;
  customers: number;
  earnedCents: number;
  paidCents: number;
  pendingCents: number;
  reversedCents: number;
}

export interface PayoutSummary {
  method: PayoutMethod;
  holderName: string;
  bankName?: string;
  country?: string;
  currency?: string;
  mask: string;
  updatedAt: string;
}

export interface Partner {
  id: string;
  name: string;
  email: string;
  type: PartnerType;
  brands: Brand[];
  status: PartnerStatus;
  ruleIds: Partial<Record<Brand, string>>;
  language: "en" | "es";
  payout?: PayoutSummary;
  taxFormStatus: "missing" | "w9" | "w8ben" | "cr_invoice" | "other";
  notes?: string;
  startedAt: string;
  monthlyEmail: boolean;
  createdAt: string;
}

export interface PartnerRow extends Totals {
  id: string;
  name: string;
  email: string;
  type: PartnerType;
  brands: Brand[];
  status: PartnerStatus;
  hasPayout: boolean;
  approvedCents: number;
  links: number;
  clicks: number;
  startedAt: string;
}

export interface CommissionRule {
  id: string;
  name: string;
  brand: Brand;
  base: "payment" | "first_sale" | "active_member";
  percent?: number;
  amountCents?: number;
  include: "all" | "exclude_activation";
  durationMonths?: number;
  holdDays: number;
  archived?: boolean;
}

export interface RulePreset extends Omit<CommissionRule, "id"> {
  key: string;
  description: string;
}

export interface ReferralLink {
  id: string;
  partnerId: string;
  brand: Brand;
  code: string;
  destination: string;
  url: string;
  utm: { source: string; medium: string; campaign: string; content?: string };
  clicks: number;
  active: boolean;
  createdAt: string;
}

export interface Statement {
  partner: Pick<Partner, "id" | "name" | "email" | "type" | "brands" | "status" | "language" | "startedAt" | "monthlyEmail" | "taxFormStatus"> & { payout?: PayoutSummary };
  lifetime: Totals;
  years: Array<Totals & { year: number }>;
  year: number;
  months: Array<Totals & { month: string }>;
  byBrand: Array<Totals & { brand: Brand }>;
  payouts: Array<{ id: string; paidAt: string; totalCents: number; method: PayoutMethod; reference: string }>;
  recent: Array<{ id: string; brand: Brand; saleKind: string; amountCents: number; status: "pending" | "approved" | "paid" | "reversed"; earnedAt: string; paidAt?: string; note?: string }>;
  relationshipYears: number;
}

export interface YearReport {
  year: number;
  brand: Brand | null;
  totals: Totals;
  months: Array<Totals & { month: string }>;
  rows: Array<Totals & { partnerId: string; name: string; type: PartnerType; conversionPct: number }>;
  years: number[];
}

// ─── Formatting ────────────────────────────────────────────────────────────

export function money(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  const whole = Math.floor(abs / 100).toLocaleString("en-US");
  const frac = abs % 100;
  return `${sign}US$${whole}${frac ? "." + String(frac).padStart(2, "0") : ""}`;
}

export function ruleSummary(r: Pick<CommissionRule, "base" | "percent" | "amountCents" | "include" | "durationMonths" | "holdDays">): string {
  const amount = r.amountCents !== undefined ? money(r.amountCents) : `${r.percent}%`;
  const on = r.base === "active_member" ? "per paid month" : r.base === "first_sale" ? "of the first sale" : "of every payment";
  const parts = [`${amount} ${on}`];
  if (r.include === "exclude_activation") parts.push("activation fee not counted");
  parts.push(r.durationMonths ? `for ${r.durationMonths} months` : "no end date");
  parts.push(`${r.holdDays}-day hold`);
  return parts.join(", ");
}

export const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const monthShort = (key: string) => MONTHS_SHORT[Number(key.slice(5, 7)) - 1] ?? key;

// ─── API clients ───────────────────────────────────────────────────────────

const S = "/api/dashboard/referrals";

export const refStaff = {
  overview: (year?: number, brand?: Brand | "") =>
    staffApi.get<{ report: YearReport; partners: PartnerRow[]; payouts: { readyCount: number; readyCents: number; heldCount: number } }>(`${S}/overview`, { query: { year, brand: brand || undefined } }),
  partner: (id: string, year?: number) =>
    staffApi.get<{ partner: Partner; statement: Statement; links: ReferralLink[]; rules: CommissionRule[] }>(`${S}/partners/${encodeURIComponent(id)}`, { query: { year } }),
  createPartner: (body: Record<string, unknown>) => staffApi.post<{ partner: Partner; link: ReferralLink | null }>(`${S}/partners`, body),
  updatePartner: (id: string, body: Record<string, unknown>) => staffApi.patch<{ partner: Partner }>(`${S}/partners/${encodeURIComponent(id)}`, body),
  invite: (id: string) => staffApi.post<{ sent: boolean }>(`${S}/partners/${encodeURIComponent(id)}/invite`),
  revealPayout: (id: string) => staffApi.get<{ details: Record<string, string> }>(`${S}/partners/${encodeURIComponent(id)}/payout-details`),
  setPayout: (id: string, body: Record<string, unknown>) => staffApi.post<{ partner: Partner }>(`${S}/partners/${encodeURIComponent(id)}/payout-details`, body),
  adjust: (id: string, body: Record<string, unknown>) => staffApi.post(`${S}/partners/${encodeURIComponent(id)}/adjust`, body),
  rules: () => staffApi.get<{ rules: CommissionRule[]; presets: RulePreset[]; hosts: Record<Brand, string[]> }>(`${S}/rules`),
  createRule: (body: Record<string, unknown>) => staffApi.post<{ rule: CommissionRule }>(`${S}/rules`, body),
  archiveRule: (id: string, archived: boolean) => staffApi.post(`${S}/rules/${encodeURIComponent(id)}/archive`, { archived }),
  createLink: (body: Record<string, unknown>) => staffApi.post<{ link: ReferralLink }>(`${S}/links`, body),
  setLinkActive: (id: string, active: boolean) => staffApi.patch(`${S}/links/${encodeURIComponent(id)}`, { active }),
  assign: (body: Record<string, unknown>) => staffApi.post(`${S}/assign`, body),
  sale: (body: Record<string, unknown>) => staffApi.post<{ reason: string; commission: { amountCents: number } | null }>(`${S}/sales`, body),
  refund: (body: Record<string, unknown>) => staffApi.post<{ lines: unknown[] }>(`${S}/refunds`, body),
  payouts: () =>
    staffApi.get<{
      ready: Array<{ partner: Partner; totalCents: number; lines: number }>;
      held: Array<{ partner: Partner; totalCents: number; lines: number; why: string }>;
      history: Array<{ id: string; partnerId: string; partnerName: string; totalCents: number; method: PayoutMethod; reference: string; paidAt: string; lines: number; source: string }>;
      minPayoutCents: number;
    }>(`${S}/payouts`),
  recordPayout: (body: Record<string, unknown>) => staffApi.post(`${S}/payouts`, body),
  importRows: (rows: unknown[]) => staffApi.post<{ lines: number; payouts: number; skipped: Array<{ row: number; why: string }> }>(`${S}/import`, { rows }),
};

export const partnerApi = createApiClient("partner");

export const refPartner = {
  me: (year?: number) => partnerApi.get<{ statement: Statement }>("/api/partner/me", { query: { year } }),
  links: () => partnerApi.get<{ links: Array<{ id: string; brand: Brand; code: string; url: string; shortUrl: string; destination: string; campaign: string; clicks: number; createdAt: string }> }>("/api/partner/me/links"),
  update: (body: { language?: "en" | "es"; monthlyEmail?: boolean }) => partnerApi.patch("/api/partner/me", body),
  setPayout: (body: Record<string, unknown>) => partnerApi.post("/api/partner/me/payout-details", body),
};

/**
 * Rows from a pasted CSV of past payments: partnerEmail,brand,date,amount,reference,client
 * (header optional; amount in dollars). Bad lines come back in `errors`.
 */
export function parseHistoryCsv(text: string): { rows: Array<Record<string, string | number>>; errors: string[] } {
  const rows: Array<Record<string, string | number>> = [];
  const errors: string[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  lines.forEach((line, i) => {
    const cells = line.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ""));
    if (i === 0 && /email/i.test(cells[0] ?? "")) return;
    const [partnerEmail, brand, date, amount, reference = "", client = ""] = cells;
    const dollars = Number(String(amount ?? "").replace(/[$,\s]|US/gi, ""));
    if (!partnerEmail || !brand || !date || !Number.isFinite(dollars)) {
      errors.push(`Line ${i + 1}: needs email, brand, date and amount`);
      return;
    }
    rows.push({ partnerEmail, brand: brand.toLowerCase(), date, amount: dollars, reference, clientLabel: client });
  });
  return { rows, errors };
}
