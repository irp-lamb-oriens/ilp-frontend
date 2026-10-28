/**
 * Example screens for "How ILP works" (HeroStory.tsx), one per step. They
 * are mock trees for the tutorial MockScene, filled with the same fictional
 * people and dates as the public tutorials (tutorials/presets.ts), so the
 * homepage and the tutorials tell one story: Linda checks her dates, joins,
 * books a call with Lic. Vargas and gets the next steps from Sofía.
 * Check titles are the real CHECK_RULES titles (server countryCatalog.ts).
 * Plain data, so tests/homepage.test.mjs can read the text.
 */
import type { MockNode } from "../tutorial/types";
import {
  FEE,
  LAWYERS as L,
  MEMBERS,
  TEAM,
  btn,
  card,
  chip,
  dateIn,
  dayIn,
  divider,
  grid,
  list,
  message,
  meta,
  mockPhone,
  mockShell,
  p,
  pill,
  progress,
  row,
  stack,
  text,
} from "../../tutorials/presets";

export interface HeroScreen {
  /** Short description for tests and code readers (the screen is aria-hidden). */
  name: string;
  /** Portal page the screen sits in (member shell), or none for a public page. */
  shell?: { active: string; title: string };
  /** The page content; `compact` is the one-column version for phones. */
  body: (compact: boolean) => MockNode;
}

/** Design sizes: the wide frame is 4:3 and fixed; the compact one is as tall as its content. */
export const HERO_SCREEN_SIZE = { wide: { w: 720, h: 540 }, compact: { w: 400 } } as const;

const FIRST = MEMBERS.linda.split(" ")[0];

/** Next usual municipal tax installment (Mar 31, Jun 30, Sep 30, Dec 31). */
function nextInstallment(now = new Date()): string {
  const y = now.getFullYear();
  const dates = [new Date(y, 2, 31), new Date(y, 5, 30), new Date(y, 8, 30), new Date(y, 11, 31), new Date(y + 1, 2, 31)];
  const next = dates.find((d) => d.getTime() >= now.getTime()) ?? dates[dates.length - 1];
  return next.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** The top of a public page (no portal shell). */
const publicBar = (where: string): MockNode[] => [row([text("ILP", "strong"), meta(where)], "between"), divider()];

const check: HeroScreen = {
  name: "Free deadline check: a question and the dates that may require review",
  body: () =>
    stack(
      [
        ...publicBar("Free deadline check"),
        progress("Check progress", 4 / 8, "Question 4 of 8"),
        card(undefined, [
          text("Do you own property in Costa Rica?", "h2"),
          meta("A house, condo or land, in your own name or through a company."),
          row([chip("Yes", true), chip("No")], "start", 2),
        ]),
        card("These dates may require review", [
          list(
            [
              { lead: nextInstallment(), title: "Municipal property tax may require review", meta: "Your house" },
              { lead: "Jan 31", title: "Annual corporation tax may require review", meta: "Your S.A." },
            ],
            "rows",
          ),
          meta("General dates based on your answers. They are not legal advice."),
        ]),
      ],
      4,
    ),
};

const join: HeroScreen = {
  name: "Join: the membership plan and the Join ILP button",
  body: () =>
    stack(
      [
        ...publicBar("Join ILP"),
        card(undefined, [
          text("ILP membership", "h2"),
          row([text(FEE, "big"), meta("a month, plus a US$100 one-time activation fee")], "start", 2),
          list(
            [
              { title: "Up to three 20-minute video calls a month (60 minutes) with a lawyer licensed in Costa Rica" },
              { title: "A customer success manager who follows up on the next steps after every call" },
              { title: "Legal work such as filings or drafting is quoted separately" },
            ],
            "plain",
          ),
          list(
            [
              { title: "Activation, one time", trailing: "US$100.00" },
              { title: "First month", trailing: FEE },
              { title: "Due today", trailing: "US$179.99" },
            ],
            "rows",
          ),
        ]),
        row([meta("Cancel online at any time."), btn("Join ILP", "primary")], "between", 3),
      ],
      4,
    ),
};

const home: HeroScreen = {
  name: "Member home: profile completion, the booked call and the next step",
  shell: { active: "Overview", title: `Hello, ${FIRST}.` },
  body: (compact) => {
    const next = card(
      "Your next step",
      [row([text("Book your first call", "strong"), pill("Booked", "success")], "between"), meta("Your lawyer will read your question beforehand.")],
      { tone: "accent" },
    );
    const profile = card("Your profile", [progress("Profile completion", 0.86, "86% complete"), row([pill("Ready for your lawyer", "success")], "start")]);
    const call = card("Your booked call", [
      text(`${dayIn(3)}, 10:30 am`, "strong"),
      meta(`20 minutes with ${L.andrea} · Costa Rica time`),
      btn("Join on Google Meet", "primary"),
      meta("The Join button works from 10 minutes before the call."),
    ]);
    if (compact) return stack([next, call, profile], 3);
    return stack([text(`Hello, ${FIRST}.`, "h1"), grid("1-1", [stack([next, profile], 3), call])]);
  },
};

const followUp: HeroScreen = {
  name: "Messages: the customer success manager sends the confirmed next steps",
  shell: { active: "Messages", title: "Messages" },
  body: () =>
    stack([
      message(
        "team",
        `${TEAM.csm} · ILP team`,
        `Hi ${FIRST}, here are the next steps ${L.andrea} confirmed after your call. I will check in before each date.`,
        dayIn(-1),
      ),
      card("Next steps from your call", [
        row([meta(`${dayIn(-2)} · ${L.andrea}`), pill("Confirmed by your lawyer", "success")], "between"),
        list(
          [
            { title: "Send the minute books of your S.A.", meta: `You · by ${dateIn(7)}`, pill: p("Done", "success") },
            { title: "Review the books and list what is missing", meta: `${L.andrea} · by ${dateIn(14)}`, pill: p("In progress", "info") },
            { title: "Quote for the S.A. clean-up", meta: `${TEAM.csm} · by ${dateIn(16)}`, pill: p("Your team will confirm", "neutral") },
          ],
          "rows",
        ),
      ]),
      message("me", "You", "Thank you. I sent the minute books this morning.", dayIn(0)),
    ]),
};

/** The mock tree to draw: the member shell around the body, or the public page as is. */
export function screenRoot(screen: HeroScreen, compact: boolean): MockNode {
  const body = screen.body(compact);
  if (!screen.shell) return body;
  return compact ? mockPhone(screen.shell.active, screen.shell.title, [body]) : mockShell("client", screen.shell.active, body, { search: null });
}

/** One screen per HERO.how step, same order. */
export const HERO_SCREENS: HeroScreen[] = [check, join, home, followUp];

/** Every text string in a mock tree (tests use it to check the placeholder copy). */
export function screenText(node: unknown): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(node);
  return out;
}
