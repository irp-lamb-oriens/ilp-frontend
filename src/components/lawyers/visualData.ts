/**
 * Placeholder data for the pictures beside "Why lawyers join" on /attorneys
 * (LawyerVisuals.tsx). Fictional people from the tutorial presets; plain
 * data, so tests/lawyersLanding.test.mjs can read every string.
 */
import { MEMBERS as M, TEAM } from "../../tutorials/presets";

export const VISUAL_COUNTRIES = ["Colombia", "Costa Rica", "Mexico", "Panama", "Portugal", "Spain"];

export const MEMBER_QUESTIONS = [
  { who: M.genevieve, country: "Mexico", area: "Property", q: "Can I hold the condo in Tulum through a Mexican company?" },
  { who: M.russell, country: "Panama", area: "Residency", q: "My pensionado card expires in May. When do I start the renewal?" },
  { who: M.colleen, country: "Portugal", area: "Cars", q: "Can I keep driving on my Ohio licence after my first year?" },
];

/** An example week of unbilled work around calls, in minutes. */
export const HOURS_ROWS = [
  { task: "Reply to a referral email", minutes: 35 },
  { task: "Agree a time for a first call", minutes: 25 },
  { task: "Chase documents after the call", minutes: 50 },
  { task: "Send the quote again", minutes: 20 },
];

/** "35 min", "1 h 10 min", "2 h". */
export function minutesLabel(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export const MEMBER_CARD = {
  initials: "HT",
  name: M.hiroshi,
  meta: "Costa Rica · ILP member",
  calls: "2 of 3 calls left this month",
  questionLabel: "Question written before booking",
  question: "Can I sell the house before the S.A. books are fixed?",
  followLabel: `${TEAM.csm} · Customer success manager`,
  follow: "Sent Hiroshi the next steps from your call and asked for the S.A. minute books.",
  sent: "Follow-up sent",
};
