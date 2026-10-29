/**
 * Example CSM portal screens for "How your day works" on /customer-success
 * (CsmStory.tsx), one per step: Today, My book, a playbook email and My
 * KPIs. Mock trees for the tutorial MockScene with the labels of the real
 * portal (components/csm) and the playbook wording of the server
 * (API/csm/playbooks.ts), filled in for fictional members. Each screen has
 * a short timeline: state changes that apply as the step plays (a late task
 * closed, a member's reasons opened, an email sent and logged, a figure
 * below its target flagged). Plain data, so tests/csmLanding.test.mjs can
 * read every string. Placeholder email addresses use @example.com.
 */
import type { MockNode, StateChange } from "../tutorial/types";
import { applyChanges, EMPTY_OVERRIDES, type Overrides } from "../tutorial/sceneUtils";
import { MEMBERS as M, TEAM, btn, card, dateIn, grid, hidden, mark, meta, pill, row, set, show, stack, text } from "../../tutorials/presets";

/**
 * Every screen is drawn as one page at its natural size (csmFit.ts) and
 * scaled to the same box as the lawyer screens, so the content is cut to fit
 * at full type size: no portal shell, pills at the medium size, no list
 * pills, stat-tile hints or definition lists (their 11px text). The
 * smallest text on a screen is 12px.
 */
export interface CsmScreen {
  /** Short description for tests and code readers (the screen is aria-hidden). */
  name: string;
  /** The page content; `compact` lets rows wrap from the start (phones). */
  body: (compact: boolean) => MockNode;
  /** State changes, each applied once the step's timeline (0..1) passes `at`. */
  timeline: { at: number; changes: StateChange[] }[];
}

export const NEW_MEMBER = { first: "Imani", email: "imani.okafor@example.com" };

/** The top line of a screen: where in the portal it is, and an optional item on the right. */
const bar = (where: string, right?: MockNode): MockNode => row([row([text("ILP", "strong"), meta(where)], "start", 2), ...(right ? [right] : [])], "between");

/** A pill at the readable size (the small one is 11px). */
const tag = (label: string, tone: Parameters<typeof pill>[1] = "neutral", id?: string) => pill(label, tone, id, "md");

/** One task: the job and its due pill, then the member and their health. */
const task = (id: string, title: string, who: string, due: MockNode, compact: boolean): MockNode =>
  stack([row([text(title, "strong"), due], compact ? "start" : "between", 2), meta(who)], 1, id);

/** A figure: label, value, and the line under it. */
const figure = (id: string, label: string, value: string, under: string, extra?: MockNode): MockNode =>
  card(undefined, [stack([text(label, "label"), row([text(value, "h2"), ...(extra ? [extra] : [])], "start", 2), meta(under)], 1)], { id });

const today: CsmScreen = {
  name: "Today: late tasks and tasks due today on top, a late payment task closed with its outcome",
  body: (compact) =>
    stack(
      [
        bar("CSM portal · Today", meta(dateIn(0))),
        grid("1-1-1", [
          { type: "statTile", label: "Late tasks", value: "2", id: "c_late" },
          { type: "statTile", label: "Due today", value: "3" },
          { type: "statTile", label: "At risk", value: "1" },
        ]),
        card("Your tasks", [
          stack(
            [
              hidden(text("Closed: Payment failed: contact member. Called Linda; her card expired and she updates it today.", "body", "closed")),
              task("q1", "Payment failed: contact member", `${M.linda} · At risk · 40`, tag("Late 1 day", "danger"), compact),
              task("q2", "Welcome call and profile review", `${M.imani} · Watch · 71`, tag("Today 4:00 pm", "warning"), compact),
              task("q3", "Send the lawyer's next steps", `${M.priya} · Healthy · 92`, tag(`Due ${dateIn(1)}`), compact),
            ],
            2,
          ),
        ]),
      ],
      3,
    ),
  timeline: [
    { at: 0.2, changes: [mark("q1")] },
    { at: 0.5, changes: [mark("q1", false), set("q1", { hidden: true }), show("closed"), set("c_late", { value: "1" })] },
    { at: 0.75, changes: [mark("q2")] },
  ],
};

/** One member in the book: name and health pill, then a line under it. */
const member = (name: string, health: MockNode, line: string, compact: boolean): MockNode =>
  stack([row([text(name, "strong"), health], compact ? "start" : "between", 2), meta(line)], 1);

const reason = (t: string, points: number) => row([text(t, "body"), text(`minus ${points}`, "label")], "between", 2);

const book: CsmScreen = {
  name: "My book: members sorted by health score, lowest first, with the reasons that take points off",
  body: (compact) =>
    stack(
      [
        bar("CSM portal · My book", meta("Lowest score first")),
        card(
          undefined,
          [
            stack(
              [
                member(M.linda, tag("At risk · 40", "danger"), "Costa Rica · Profile 88% · 0 of 3 calls used", compact),
                text("Payment failed, and 2 more", "body", "m1first"),
                hidden(stack([reason("Payment failed", 35), reason("Last contact 31 days ago", 15), reason("No call used, 24 days into the period", 10)], 1, "m1why")),
              ],
              1,
            ),
          ],
          { id: "m1" },
        ),
        card(undefined, [
          stack([member(M.imani, tag("Watch · 71", "warning"), "Profile 52% complete, not consultation-ready, and 2 more", compact)], 1, "m2"),
          stack([member(M.priya, tag("Healthy · 92", "success"), "Last contact 16 days ago", compact)], 1, "m3"),
        ]),
      ],
      3,
    ),
  timeline: [
    { at: 0.2, changes: [mark("m1")] },
    { at: 0.45, changes: [set("m1first", { hidden: true }), show("m1why")] },
    { at: 0.75, changes: [mark("m1", false), mark("m2")] },
  ],
};

const playbook: CsmScreen = {
  name: "Playbook email: the welcome email for a new member, sent from the member page and logged on the timeline",
  body: (compact) =>
    stack(
      [
        bar(`CSM portal · ${M.imani}`, tag("Watch · 71", "warning")),
        card("Welcome call: send the email", [
          stack(
            [
              row([meta("To"), text(NEW_MEMBER.email, "strong")], "start", 2),
              row([meta("Subject"), text(`Welcome to ILP, ${NEW_MEMBER.first}`, "strong")], "start", 2),
            ],
            1,
          ),
          text(`I am ${TEAM.csm}, your contact at ILP. I look after your membership and make sure each call with your lawyer is useful.`, "body", "p1"),
          row([meta("Button in the email: Finish your profile"), btn("Send email", "primary", "send", "sm")], compact ? "start" : "between", 2),
        ]),
        hidden(card(undefined, [text(`On the timeline: email sent by ${TEAM.csm}`, "body")], { id: "logged", tone: "accent" })),
      ],
      3,
    ),
  timeline: [
    { at: 0.25, changes: [mark("p1")] },
    { at: 0.55, changes: [mark("p1", false), set("send", { label: "Sent", variant: "secondary" }), show("logged")] },
  ],
};

const kpis: CsmScreen = {
  name: "My KPIs: first contact, handoff follow-ups, readiness and retention for this book, with targets",
  body: () =>
    stack(
      [
        bar("CSM portal · My KPIs", meta("24 members, 1 at risk")),
        grid("1-1", [
          figure("k1", "Time to first contact", "6.5 h", "Target 24 h or less"),
          figure("k2", "First contact in one business day", "94%", "Target 100%"),
          figure("k3", "Handoff follow-ups on time", "100%", "Target 100%"),
          figure("k4", "Consultation-ready after 7 days", "78%", "Target 80%", hidden(tag("Below target", "warning", "k4tag"))),
        ]),
        card(undefined, [row([text("Book retention after 90 days", "label"), text("86%", "strong"), meta("Target 80%")], "start", 3)], { id: "k5" }),
      ],
      3,
    ),
  timeline: [
    { at: 0.2, changes: [mark("k1")] },
    { at: 0.45, changes: [mark("k1", false), mark("k4"), show("k4tag")] },
    { at: 0.75, changes: [mark("k4", false), mark("k5")] },
  ],
};

/** One screen per CSM_HOW step, same order. */
export const CSM_SCREENS: CsmScreen[] = [today, book, playbook, kpis];

/** The mock tree to draw. */
export function csmScreenRoot(screen: CsmScreen, compact: boolean): MockNode {
  return screen.body(compact);
}

/** How many timeline states have applied at timeline point t (0..1). */
export const screenStateAt = (screen: CsmScreen, t: number) => screen.timeline.filter((s) => t >= s.at).length;

/** The overrides after the first `n` timeline states. */
export function screenOverrides(screen: CsmScreen, n: number): Overrides {
  return screen.timeline.slice(0, n).reduce((o, s) => applyChanges(o, s.changes), EMPTY_OVERRIDES);
}
