/**
 * Facts ILP must supply before the legal pages go live (P6). Every legal draft
 * uses these constants, so each blank is filled once. Do not replace them with
 * guesses: they are listed in docs/PRIVACY_AND_COMPLIANCE.md for the user and
 * counsel. (The invoice code says "International Legal Partner LLC, Miami
 * Florida"; that is not confirmed as the contracting entity, so it is not used.)
 */
export const P = {
  entity: "[ILP legal entity name]",
  entityType: "[entity type and place of registration]",
  registration: "[registration number / cédula jurídica]",
  address: "[registered address]",
  crEntity: "[Costa Rica entity or representative, if any]",
  privacyEmail: "[privacy contact email]",
  supportEmail: "[support email]",
  dpo: "[privacy officer name or role]",
  emailProvider: "[email delivery provider]",
  apiHost: "[API hosting provider and region]",
  siteHost: "[website hosting provider]",
  firestoreRegion: "[Google Cloud region]",
  governingLaw: "[governing law, to be decided by counsel]",
  disputes: "[dispute resolution forum and method, to be decided by counsel]",
  refundPolicy: "[refund policy, to be decided by ILP and counsel]",
  liabilityCap: "[liability cap, to be decided by counsel]",
  accountingYears: "[N years, per counsel and accountant]",
  auditYears: "[N years, per counsel]",
  minAge: "18",
} as const;
