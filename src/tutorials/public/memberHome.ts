import type { Tutorial } from "../../components/tutorial/types";
import { LAWYERS as L, btn, card, click, dateIn, dayIn, grid, hidden, hover, list, mark, meta, mockShell, pill, progress, row, say, scene, set, show, stack, step, text } from "../presets";

/**
 * "What your member home looks like", for visitors on the homepage. A
 * member's Overview with placeholder data: the next step card, the
 * membership minutes, a booked call and the dates that may need attention.
 * Facts match the live portal (/status) and docs/PLAN.md.
 */

const nextStep = card(
  "Your next step",
  [
    text("Send the minute books of your S.A. to your lawyer", "strong"),
    grid("1-1", [stack([text("Who", "label"), text("You", "body")], 1, "ns_who"), stack([text("By when", "label"), text(dateIn(7), "body")], 1, "ns_when")]),
    meta("Confirmed by your lawyer after your call."),
  ],
  { tone: "accent", id: "nextstep" },
);

const membership = card(
  "Your membership",
  [
    pill("Active", "success"),
    progress("Minutes left this month", 40 / 60, "40 of 60 minutes left", "accent", "minutes"),
    meta(`2 of 3 calls left · renews ${dateIn(18)}`, "calls_left"),
    row([btn("Book a call", "primary", "book"), btn("Message your team", "secondary", "message")], "start"),
  ],
  { id: "membership" },
);

const booked = card("Your booked call", [text(`${dayIn(3)} · 10:30 am Costa Rica time`, "strong"), meta(`${L.andrea} · 20 minutes`)], { id: "booked" });

const dates = card(
  "Dates that may need attention",
  [
    list(
      [
        { id: "o1", title: "Corporate tax return (D-101) may require review", meta: `Around ${dateIn(40)} · S.A.` },
        { id: "o2", title: "Vehicle circulation permit (marchamo)", meta: "Every year by December 31" },
      ],
      "rows",
    ),
    row([btn("Ask my lawyer", "secondary", "ask", "sm"), hidden(pill("On your list for the next call", "info", "asked"))], "start"),
  ],
  { id: "dates" },
);

function page() {
  return mockShell("client", "Overview", stack([text("Hello, Linda.", "h1"), grid("3-2", [stack([nextStep, dates], 3), stack([membership, booked], 3)])]));
}

export const publicMemberHome: Tutorial = {
  id: "public.member-home",
  version: 1,
  title: "What your member home looks like",
  summary: "The page you see when you sign in: your next step, your call minutes and the dates that may apply to you.",
  audience: ["public"],
  autoStart: "never",
  steps: [
    step(
      "next",
      "Your next step comes first",
      "When you sign in, the top of the page shows one thing to do next. It says who does it and by when.",
      scene(page(), [
        say(hover("nextstep", [mark("nextstep")]), "Your next step", "The one thing to do now. Here it is to send two company documents. Your lawyer confirmed it after your last call."),
        say(hover("ns_who", [mark("nextstep", false)]), "Who", "Who does this step. Sometimes it is you, sometimes your lawyer or your ILP team."),
        say(hover("ns_when"), "By when", "The date to aim for. If it does not suit you, write to your team and they will help."),
      ]),
    ),
    step(
      "minutes",
      "See your minutes and book a call",
      "Each month includes up to 60 minutes of calls. That is up to three 20-minute video calls with your lawyer.",
      scene(page(), [
        say(hover("minutes", [mark("minutes")]), "Minutes left this month", "This member has used one call, so 40 of the 60 minutes are left. The minutes start again on the renewal date."),
        say(hover("calls_left", [mark("minutes", false)]), "2 of 3 calls left", "How many calls you have left this month, and the date your membership renews."),
        say(click("book"), "Book a call", "Opens a page where you pick a day and a time. The call is a 20-minute video call with your lawyer."),
      ]),
    ),
    step(
      "dates",
      "Ask about a date",
      "The dates that may apply to you are listed on the same page. Each one can be added to your next call.",
      scene(page(), [
        say(hover("o1", [mark("o1")]), "Corporate tax return (D-101)", "A yearly tax form for a Costa Rican company. It is listed early, so there is time to ask about it."),
        say(hover("o2", [mark("o1", false)]), "Vehicle permit (marchamo)", "The yearly permit every car in Costa Rica needs, paid by December 31."),
        say(click("ask", [set("ask", { hidden: true }), show("asked")]), "Ask my lawyer", "Adds this date to your next call, so your lawyer can tell you whether it applies to you."),
      ]),
    ),
  ],
};

export default publicMemberHome;
