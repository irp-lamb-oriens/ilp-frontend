/**
 * ROUTING data layer: lawyer profiles, specialties, coverage, member routing,
 * the staff bell and the sales hours. Lawyers call /api/provider/profile;
 * staff call /api/dashboard/routing/* and /api/dashboard/notifications.
 * Ratings and routing decisions only ever come back on staff routes.
 */

import { staffApi } from "@/lib/api";
import { providerApi } from "@/lib/provider";
import {
  AREA_GROUPS,
  type AreaGroupId,
  type CountryCode,
  type LanguageLevel,
  type LawyerClientType,
  type LawyerEmailLanguage,
  type LawyerReview,
  type LawyerRoutingProfile,
  type RatingStatus,
  type RoutingDecision,
  type RoutingGap,
  type Specialty,
  type StaffNotification,
} from "@/lib/contracts";

export type ProfileForm = LawyerRoutingProfile & { emailLanguage: LawyerEmailLanguage };

export interface OwnProfile {
  profile: ProfileForm;
  name: string | null;
  specialties: Specialty[];
  canTakeCalls: boolean;
}

export interface StaffLawyerProfile {
  id: string;
  name: string | null;
  email: string | null;
  bookable: boolean;
  verifiedCountries: CountryCode[];
  profile: ProfileForm;
  specialties: Specialty[];
  rating: { ratingScore: number; reviewCount: number; ratingStatus: RatingStatus; label: string };
  reviews: LawyerReview[];
}

export interface SpecialtyRow extends Specialty {
  lawyers: number;
}

export interface Coverage {
  countries: CountryCode[];
  specialties: Specialty[];
  cells: Record<string, Record<string, { exact: number; areaOnly: number }>>;
  gaps: RoutingGap[];
  placeholderGaps: number;
}

export interface MemberRouting {
  assigned: { id: string; name: string; bookable: boolean } | null;
  decision: RoutingDecision | null;
  decisionMatterId: string | null;
  gap: RoutingGap | null;
  salesCalls: Array<{ id: string; scheduledAt: string; status: string; meetUrl: string | null; salesEmail: string | null }>;
  salesEmails: string[];
}

export type BellItem = StaffNotification & { read: boolean };

/** Where a profile editor reads and saves: the lawyer's own, or staff editing any lawyer. */
export interface ProfileAdapter {
  audience: "lawyer" | "staff";
  load(): Promise<{ profile: ProfileForm; specialties: Specialty[] }>;
  save(input: Partial<ProfileForm>): Promise<{ profile: ProfileForm }>;
}

export const ownProfileAdapter: ProfileAdapter = {
  audience: "lawyer",
  load: () => providerApi.get<OwnProfile>("/api/provider/profile"),
  save: (input) => providerApi.put<{ profile: ProfileForm }>("/api/provider/profile", input),
};

export const staffProfileAdapter = (providerId: string): ProfileAdapter => ({
  audience: "staff",
  load: () => staffApi.get<StaffLawyerProfile>(`/api/dashboard/routing/lawyers/${encodeURIComponent(providerId)}/profile`),
  save: (input) => staffApi.put<{ profile: ProfileForm }>(`/api/dashboard/routing/lawyers/${encodeURIComponent(providerId)}/profile`, input),
});

export const routingApi = {
  lawyerProfile: (id: string) => staffApi.get<StaffLawyerProfile>(`/api/dashboard/routing/lawyers/${encodeURIComponent(id)}/profile`),
  specialties: () => staffApi.get<{ items: SpecialtyRow[] }>("/api/dashboard/routing/specialties"),
  createSpecialty: (input: { label: string; group: AreaGroupId; countries: CountryCode[]; description?: string }) =>
    staffApi.post<{ specialty: Specialty }>("/api/dashboard/routing/specialties", input),
  updateSpecialty: (id: string, input: Partial<Pick<Specialty, "label" | "group" | "countries" | "description" | "active">>) =>
    staffApi.patch<{ specialty: Specialty }>(`/api/dashboard/routing/specialties/${encodeURIComponent(id)}`, input),
  mergeSpecialty: (id: string, into: string) =>
    staffApi.post<{ providers: number; matters: number }>(`/api/dashboard/routing/specialties/${encodeURIComponent(id)}/merge`, { into }),
  coverage: () => staffApi.get<Coverage>("/api/dashboard/routing/coverage"),
  sweep: () => staffApi.post<{ resolved: number; open: number }>("/api/dashboard/routing/sweep", {}),
  member: (clientId: string) => staffApi.get<MemberRouting>(`/api/dashboard/routing/members/${encodeURIComponent(clientId)}`),
  reroute: (clientId: string) => staffApi.post<{ providerId: string | null; decision: RoutingDecision; gap: RoutingGap | null }>(`/api/dashboard/routing/members/${encodeURIComponent(clientId)}/reroute`, {}),
  override: (clientId: string, providerId: string, note: string) =>
    staffApi.post<{ providerId: string; moved: string[]; cancelled: string[] }>(`/api/dashboard/routing/members/${encodeURIComponent(clientId)}/override`, { providerId, note }),
  notifications: () => staffApi.get<{ items: BellItem[]; unread: number }>("/api/dashboard/notifications"),
  markRead: (ids: string[] = []) => staffApi.post<{ marked: number }>("/api/dashboard/notifications/read", { ids }),
};

export const AREA_LABEL_OF: Record<string, string> = Object.fromEntries(AREA_GROUPS.map((g) => [g.id, g.label]));

export const LANGUAGE_LABEL: Record<string, string> = { en: "English", es: "Spanish", pt: "Portuguese", fr: "French", de: "German", it: "Italian" };
export const LEVEL_LABEL: Record<LanguageLevel, string> = { native: "Native", fluent: "Fluent", working: "Working" };
export const CLIENT_TYPE_LABEL: Record<LawyerClientType, string> = {
  individuals: "Individuals",
  families: "Families",
  companies: "Companies",
  foreign_investors: "Foreign investors",
};
export const EMAIL_LANGUAGE_LABEL: Record<LawyerEmailLanguage, string> = { es: "Spanish", pt: "Portuguese", en: "English" };

/** Staff label for a hidden rating. */
export function ratingText(score: number, count: number): string {
  if (!count) return "No reviews yet";
  return `${score} (${count} review${count === 1 ? "" : "s"})`;
}

/** Specialties grouped by area, in AREA_GROUPS order. */
export function groupSpecialties(list: readonly Specialty[]): Array<{ group: AreaGroupId; label: string; items: Specialty[] }> {
  return AREA_GROUPS.map((g) => ({ group: g.id, label: g.label, items: list.filter((s) => s.group === g.id) })).filter((g) => g.items.length > 0);
}
