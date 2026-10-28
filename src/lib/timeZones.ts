/**
 * Time zone names for people (COUNTRIES): the six countries' zones by their
 * plain label, others by city. Pure, shared by member, lawyer and staff views.
 */
import { COUNTRIES, COUNTRY_CODES } from "./contracts";

/** "Costa Rica time", "Canary Islands time", "Central Mexico (most of the country) time", "New York time". */
export function zoneLabelOf(tz: string): string {
  for (const c of COUNTRY_CODES) {
    const z = COUNTRIES[c].timeZones.find((x) => x.id === tz);
    if (z) return COUNTRIES[c].timeZones.length === 1 ? `${COUNTRIES[c].name} time` : `${z.label} time`;
  }
  const city = tz.split("/").pop() ?? tz;
  return `${city.replace(/_/g, " ")} time`;
}

/** Every zone of the six countries, for a time zone picker ("Spain: Canary Islands"). */
export const COUNTRY_ZONE_OPTIONS = COUNTRY_CODES.flatMap((c) =>
  COUNTRIES[c].timeZones.map((z) => ({
    value: z.id,
    label: COUNTRIES[c].timeZones.length === 1 ? COUNTRIES[c].name : `${COUNTRIES[c].name}: ${z.label}`,
  })),
);

/** A time in a zone, like "9:00 AM". */
export function timeIn(iso: string, tz: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz });
}
