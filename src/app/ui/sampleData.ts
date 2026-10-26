import type { TimelineItem } from "@/components/ui";

/** Fixed reference time so the gallery renders the same on every visit. */
export const NOW = new Date("2026-10-26T15:00:00Z");

const daysAgo = (d: number, h = 0) => new Date(NOW.getTime() - (d * 24 + h) * 3_600_000).toISOString();
const daysAhead = (d: number) => new Date(NOW.getTime() + d * 24 * 3_600_000).toISOString();

export interface MemberRow {
  id: string;
  name: string;
  matter: string;
  area: string;
  stageEnteredAt: string;
  profile: number; // 0..1
  minutesLeft: number;
  status: "active" | "past_due" | "pending";
  nextDue: string;
}

export const MEMBERS: MemberRow[] = [
  {
    id: "m1",
    name: "Karen Whitfield",
    matter: "S.A. annual corporation tax",
    area: "Corporate",
    stageEnteredAt: daysAgo(3),
    profile: 0.86,
    minutesLeft: 40,
    status: "active",
    nextDue: daysAhead(4),
  },
  {
    id: "m2",
    name: "Douglas Prentice",
    matter: "Temporary residency renewal",
    area: "Immigration",
    stageEnteredAt: daysAgo(9),
    profile: 0.62,
    minutesLeft: 60,
    status: "active",
    nextDue: daysAhead(11),
  },
  {
    id: "m3",
    name: "Linda Okafor",
    matter: "Tamarindo condo title review",
    area: "Property",
    stageEnteredAt: daysAgo(17),
    profile: 0.43,
    minutesLeft: 20,
    status: "past_due",
    nextDue: daysAhead(2),
  },
  {
    id: "m4",
    name: "Robert Haskins",
    matter: "Vehicle marchamo and transfer",
    area: "Vehicle",
    stageEnteredAt: daysAgo(1),
    profile: 0.29,
    minutesLeft: 60,
    status: "pending",
    nextDue: daysAhead(19),
  },
  {
    id: "m5",
    name: "Susan Marchetti",
    matter: "Will under Costa Rican law",
    area: "Family",
    stageEnteredAt: daysAgo(6),
    profile: 0.71,
    minutesLeft: 0,
    status: "active",
    nextDue: daysAhead(7),
  },
];

export const ACTIVITY: TimelineItem[] = [
  {
    id: "a1",
    title: "Lawyer confirmed call summary",
    at: daysAgo(0, 3),
    actor: "Lic. Andrea Vargas Mora",
    body: "Two next steps sent to the member: file the D-195 corporation tax return; bring the 2025 S.A. book of minutes.",
    tone: "success",
  },
  {
    id: "a2",
    title: "Consultation completed · 20 min",
    at: daysAgo(0, 5),
    actor: "Lic. Andrea Vargas Mora",
    tone: "info",
  },
  {
    id: "a3",
    title: "Suggested summary drafted",
    at: daysAgo(0, 5),
    actor: "ILP assistant (AI)",
    body: "Suggested, waiting for the lawyer to confirm.",
  },
  {
    id: "a4",
    title: "Onboarding call",
    at: daysAgo(2),
    actor: "Mariela Solís (CSM)",
    body: "Profile reviewed; property and company sections filled in.",
  },
  {
    id: "a5",
    title: "Membership activated",
    at: daysAgo(3),
    actor: "System",
    tone: "success",
  },
];

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/Costa_Rica" }).format(
    Date.parse(iso),
  );
}
