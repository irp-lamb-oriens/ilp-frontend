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
import { MEMBERS as M, TEAM, btn, card, chip, dateIn, hidden, mark, meta, pill, progress, row, set, show, stack, text, timeRange } from "../../tutorials/presets";

/**
 * Every screen is drawn as one page at its natural size (visualFit.ts) and
 * scaled to the same box, so the content is cut to fit that size at full
 * type size: no portal shell (its nav column took a third of the width),
 * pills at the medium size and no definition lists (their 11px labels).
 * The smallest text on a screen is 12px (labels, pills, chips).
 */
export interface LawyerScreen {
  /** Short description for tests and code readers (the screen is aria-hidden). */
  name: string;
  /** The page content; `compact` is the one-column version for phones. */
  body: (compact: boolean) => MockNode;
  /** State changes, each applied once the step's timeline (0..1) passes `at`. */
  timeline: { at: number; changes: StateChange[] }[];
}

export const APPLICANT = { name: "Lic. Daniela Chaves", email: "daniela.chaves@example.com", carne: "28417" };

/** The top line of a screen: where in ILP it is, and an optional item on the right. */
const bar = (where: string, right?: MockNode): MockNode => row([row([text("ILP", "strong"), meta(where)], "start", 2), ...(right ? [right] : [])], "between");

/** A pill at the readable size (the small one is 11px). */
const tag = (label: string, tone: Parameters<typeof pill>[1] = "neutral", id?: string) => pill(label, tone, id, "md");

const apply: LawyerScreen = {
  name: "Application: licence checked with the Colegio, pending then verified, and the reply email",
  body: (compact) =>
    stack(
      [
        bar("Partner lawyer application · Costa Rica"),
        card("Your licence", [
          meta("Colegio de Abogados y Abogadas de Costa Rica"),
          row([text("Carné number", "label"), text(APPLICANT.carne, "strong")], "start", 2),
          row([text("Licence check", "strong"), tag("Pending: checking with the Colegio", "neutral", "lic")], compact ? "start" : "between"),
        ]),
        hidden(
          card(
            undefined,
            [
              row([text(`To ${APPLICANT.email}`, "strong"), meta(dateIn(1))], compact ? "start" : "between"),
              text("We checked your carné with the Colegio. Your licence is verified, and you can now set your hours.", "body"),
            ],
            { id: "mail", tone: "accent" },
          ),
        ),
      ],
      3,
    ),
  timeline: [
    { at: 0.3, changes: [set("lic", { label: "Verified", tone: "success" })] },
    { at: 0.55, changes: [show("mail")] },
  ],
};

const hours: LawyerScreen = {
  name: "Availability: weekly hours with a day added, and the legal areas you take",
  body: () =>
    stack(
      [
        bar("Lawyer portal · Your hours", hidden(tag("Saved", "success", "saved"))),
        card("Weekly hours", [
          stack(
            [
              row([text("Tuesday", "strong"), timeRange("9:00 am", "12:00 pm")], "between", 3),
              row([text("Wednesday", "strong"), meta("Unavailable", "wedoff"), hidden(timeRange("2:00 pm", "5:00 pm", undefined, "wed"))], "between", 3),
              row([text("Thursday", "strong"), timeRange("2:00 pm", "6:00 pm")], "between", 3),
            ],
            2,
          ),
        ]),
        card("Legal areas you take", [
          row([chip("Property", true, "a_prop"), chip("Company", false, "a_corp"), chip("Residency", false, "a_res"), chip("Vehicles", false, "a_car")], "start", 1),
        ]),
      ],
      3,
    ),
  timeline: [
    { at: 0.2, changes: [set("wedoff", { hidden: true }), show("wed")] },
    { at: 0.4, changes: [set("a_corp", { selected: true })] },
    { at: 0.6, changes: [set("a_res", { selected: true })] },
    { at: 0.8, changes: [show("saved")] },
  ],
};

const fact = (term: string, value: string) => row([meta(term), text(value, "strong")], "start", 2);

const brief: LawyerScreen = {
  name: "Pre-call brief: the member's question, profile facts and a date, for a 20-minute call",
  body: () =>
    stack(
      [
        bar(`Pre-call brief for ${M.hiroshi}`),
        card(undefined, [
          row([tag("Today, 9:30 am · 20 min"), tag("Recording allowed", "success")], "start", 2),
          stack([text("Their question", "label"), text("Can I sell the house before the S.A. books are fixed?", "body", "question")], 1),
          stack(
            [
              fact("Residency", `Pensionado, renews ${dateIn(74)}`),
              fact("Property", "House in Nosara, held by an S.A."),
              fact("Company", "S.A., not trading"),
            ],
            1,
            "facts",
          ),
          row([text("Corporate tax return (D-101)", "body"), meta(`Due ${dateIn(6)}`), tag("May require review", "warning")], "between", 2, "due"),
          progress("Profile completeness", 0.82, "82%", "success"),
        ]),
      ],
      3,
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
  body: (compact) =>
    stack(
      [
        row([text("Summary for the member", "strong"), row([tag("Suggested: check it", "warning", "sugg"), btn("Confirm", "primary", "confirm", "sm")], "end", 2)], compact ? "start" : "between"),
        card(undefined, [
          text(SUMMARY, "body"),
          stack(
            [
              text("Next steps", "label"),
              text(`${M.hiroshi}: send the S.A. minute books by ${dateIn(7)}`, "body"),
              text(`You: review the books and list what is missing by ${dateIn(14)}`, "body"),
            ],
            1,
          ),
        ]),
        hidden(
          card(
            undefined,
            [
              text(`${TEAM.csm} · ILP customer success`, "strong"),
              row([text("S.A. clean-up before sale", "body"), tag("Quote in progress", "info")], compact ? "start" : "between"),
            ],
            { id: "follow", tone: "accent" },
          ),
        ),
      ],
      3,
    ),
  timeline: [
    { at: 0.3, changes: [set("sugg", { label: "Confirmed by you", tone: "success" }), set("confirm", { label: "Confirmed", variant: "secondary" })] },
    { at: 0.55, changes: [show("follow")] },
  ],
};

/** One screen per LAWYERS_HOW step, same order. */
export const LAWYER_SCREENS: LawyerScreen[] = [apply, hours, brief, after];

/** The mock tree to draw (the same page in both layouts; `compact` lets rows wrap from the start). */
export function lawyerScreenRoot(screen: LawyerScreen, compact: boolean): MockNode {
  return screen.body(compact);
}

/** How many timeline states have applied at timeline point t (0..1). */
export const screenStateAt = (screen: LawyerScreen, t: number) => screen.timeline.filter((s) => t >= s.at).length;

/** The overrides after the first `n` timeline states. */
export function screenOverrides(screen: LawyerScreen, n: number): Overrides {
  return screen.timeline.slice(0, n).reduce((o, s) => applyChanges(o, s.changes), EMPTY_OVERRIDES);
}
