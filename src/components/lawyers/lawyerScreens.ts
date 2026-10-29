/**
 * Example lawyer-portal screens for "How it works for you" on /attorneys
 * (LawyersStory.tsx), one per step. Mock trees for the tutorial MockScene,
 * with the same fictional people as the public lawyer tutorials
 * (tutorials/public/lawyer*.ts). Each screen has a short timeline: state
 * changes that apply as the step plays (a licence check turning verified,
 * hours being added, the brief being read, a summary being confirmed).
 * Plain data, so tests/lawyersLanding.test.mjs can read every string.
 * Placeholder email addresses use @example.com.
 */
import type { MockNode, StateChange } from "../tutorial/types";
import { applyChanges, EMPTY_OVERRIDES, type Overrides } from "../tutorial/sceneUtils";
import {
  MEMBERS as M,
  TEAM,
  btn,
  card,
  chip,
  dateIn,
  deflist,
  divider,
  grid,
  hidden,
  list,
  mark,
  message,
  meta,
  mockShell,
  p,
  pill,
  progress,
  row,
  set,
  show,
  stack,
  text,
  timeRange,
} from "../../tutorials/presets";

export interface LawyerScreen {
  /** Short description for tests and code readers (the screen is aria-hidden). */
  name: string;
  /** Lawyer portal page around the body (wide only); none for a public page. */
  shell?: { active: string; title: string };
  /** The page content; `compact` is the one-column version for phones. */
  body: (compact: boolean) => MockNode;
  /** State changes, each applied once the step's timeline (0..1) passes `at`. */
  timeline: { at: number; changes: StateChange[] }[];
}

export const APPLICANT = { name: "Lic. Daniela Chaves", email: "daniela.chaves@example.com", carne: "28417" };

const publicBar = (where: string): MockNode[] => [row([text("ILP", "strong"), meta(where)], "between"), divider()];

const apply: LawyerScreen = {
  name: "Application: licence checked with the Colegio, pending then verified, and the reply email",
  body: (compact) =>
    stack(
      [
        ...publicBar("Partner lawyer application"),
        card("Your licence", [
          deflist([
            { term: "Country", value: "Costa Rica" },
            { term: "Issued by", value: "Colegio de Abogados y Abogadas de Costa Rica" },
            { term: "Carné number", value: APPLICANT.carne },
            { term: "Name on the licence", value: "Daniela Chaves Mora" },
          ]),
          row([text("Licence check", "strong"), pill("Pending: checking with the Colegio", "neutral", "lic")], compact ? "start" : "between"),
        ]),
        hidden(
          card(
            undefined,
            [
              row([text(`To ${APPLICANT.email}`, "strong"), meta(dateIn(1))], compact ? "start" : "between"),
              text("We checked your carné with the Colegio de Abogados y Abogadas de Costa Rica. Your licence is verified, and you can now set your hours.", "body"),
              meta("ILP partner team"),
            ],
            { id: "mail", tone: "accent" },
          ),
        ),
      ],
      4,
    ),
  timeline: [
    { at: 0.3, changes: [set("lic", { label: "Verified", tone: "success" })] },
    { at: 0.55, changes: [show("mail")] },
  ],
};

const hours: LawyerScreen = {
  name: "Availability: weekly hours with a day added, and the legal areas you take",
  shell: { active: "Availability", title: "Your hours" },
  body: (compact) => {
    const weekly = card("Weekly hours", [
      row([text("Tuesday", "strong"), timeRange("9:00 am", "12:00 pm")], "start", 3),
      row([text("Wednesday", "strong"), meta("Unavailable", "wedoff"), hidden(timeRange("2:00 pm", "5:00 pm", undefined, "wed"))], "start", 3),
      row([text("Thursday", "strong"), timeRange("2:00 pm", "6:00 pm")], "start", 3),
      meta("Members book 20-minute calls inside these hours. Costa Rica time."),
    ]);
    const areas = card("Legal areas you take", [
      row([chip("Property", true, "a_prop"), chip("Company", false, "a_corp"), chip("Residency", false, "a_res"), chip("Vehicles", false, "a_car")], "start", 1),
      row([hidden(pill("Saved", "success", "saved"))], "start"),
    ]);
    return compact ? stack([weekly, areas], 3) : grid("3-2", [weekly, areas]);
  },
  timeline: [
    { at: 0.2, changes: [set("wedoff", { hidden: true }), show("wed")] },
    { at: 0.4, changes: [set("a_corp", { selected: true })] },
    { at: 0.6, changes: [set("a_res", { selected: true })] },
    { at: 0.8, changes: [show("saved")] },
  ],
};

const brief: LawyerScreen = {
  name: "Pre-call brief: the member's question, profile facts and dates, for a 20-minute call",
  shell: { active: "Today", title: `Call with ${M.hiroshi}` },
  body: () =>
    card(
      `Pre-call brief for ${M.hiroshi}`,
      [
        row([pill("Costa Rica", "info"), pill("Today, 9:30 am · 20 min", "neutral"), pill("Recording allowed", "success")], "start"),
        text("Their question", "label"),
        text("Can I sell the house before the S.A. books are fixed?", "body", "question"),
        deflist(
          [
            { term: "Household", value: "Married, no children at home" },
            { term: "Residency", value: `Pensionado, renews ${dateIn(74)}` },
            { term: "Property", value: "House in Nosara, Guanacaste, held by an S.A." },
            { term: "Company", value: "S.A., not trading" },
          ],
          "facts",
        ),
        list([{ title: "Corporate tax return (D-101)", meta: `Due ${dateIn(6)}`, pill: p("May require review", "warning") }], "plain", "due"),
        progress("Profile completeness", 0.82, "82%", "success"),
      ],
      { id: "brief" },
    ),
  timeline: [
    { at: 0.15, changes: [mark("question")] },
    { at: 0.45, changes: [mark("question", false), mark("facts")] },
    { at: 0.75, changes: [mark("facts", false), mark("due")] },
  ],
};

const SUMMARY = "You can sell once the S.A. books are updated. Send the books and I will list what is missing.";

const after: LawyerScreen = {
  name: "After the call: the suggested summary and next steps confirmed, then ILP's follow-up and a quote",
  shell: { active: "Today", title: `Call with ${M.hiroshi}` },
  body: (compact) => {
    const summary = card("Summary for the member", [
      row([pill("Suggested: check it", "warning", "sugg")], "start"),
      text(SUMMARY, "body"),
      text("Next steps", "label"),
      list(
        [
          { title: "Send the S.A. minute books", meta: `${M.hiroshi} · by ${dateIn(7)}`, pill: p("Member", "info") },
          { title: "Review the books and list what is missing", meta: `You · by ${dateIn(14)}`, pill: p("Lawyer") },
        ],
        "plain",
      ),
      row([meta("Minutes used 20"), btn("Confirm", "primary", "confirm", "sm")], "between"),
    ]);
    const follow = hidden(
      card(
        "ILP follow-up",
        [
          message("team", `${TEAM.csm} · ILP customer success`, "I sent Hiroshi the next steps and asked for the minute books. I will prepare the quote once you list the work.", dateIn(0)),
          row([text("S.A. clean-up before sale", "strong"), pill("Quote in progress", "info")], "between"),
          meta("You set the scope and your fee. The member accepts before work starts."),
        ],
        { id: "follow" },
      ),
    );
    return compact ? stack([summary, follow], 3) : grid("1-1", [summary, follow]);
  },
  timeline: [
    { at: 0.3, changes: [set("sugg", { label: "Confirmed by you", tone: "success" }), set("confirm", { label: "Confirmed", variant: "secondary" })] },
    { at: 0.55, changes: [show("follow")] },
  ],
};

/** One screen per LAWYERS_HOW step, same order. */
export const LAWYER_SCREENS: LawyerScreen[] = [apply, hours, brief, after];

/** The mock tree to draw: the lawyer shell around the body (wide), or the body as a page. */
export function lawyerScreenRoot(screen: LawyerScreen, compact: boolean): MockNode {
  const body = screen.body(compact);
  if (!screen.shell || compact) return body;
  return mockShell("lawyer", screen.shell.active, body, { title: screen.shell.title, search: null });
}

/** How many timeline states have applied at timeline point t (0..1). */
export const screenStateAt = (screen: LawyerScreen, t: number) => screen.timeline.filter((s) => t >= s.at).length;

/** The overrides after the first `n` timeline states. */
export function screenOverrides(screen: LawyerScreen, n: number): Overrides {
  return screen.timeline.slice(0, n).reduce((o, s) => applyChanges(o, s.changes), EMPTY_OVERRIDES);
}
