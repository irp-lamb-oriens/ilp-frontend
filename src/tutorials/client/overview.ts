import type { Tutorial } from "../../components/tutorial/types";
import { LAWYERS as L, btn, card, click, dateIn, dayIn, grid, hidden, hover, list, mark, meta, mockShell, pill, progress, row, scene, scroll, set, show, stack, step, text, timeline, wait }  from "../presets";

const nextStep = card(
  "Your next step",
  [
    text("Send the minute books and share register of your S.A.", "strong"),
    grid("1-1", [stack([text("Who", "label"), text("You", "body")], 1), stack([text("By when", "label"), text(dateIn(7), "body")], 1)]),
    meta("Confirmed by your lawyer after your call."),
  ],
  { tone: "accent", id: "nextstep" },
);

const membership = card(
  "Your membership",
  [
    pill("Active", "success"),
    progress("Minutes left this month", 40 / 60, "40 of 60 minutes left", "accent", "minutes"),
    meta(`2 of 3 calls left · renews ${dateIn(18)}`),
    row([btn("Book a call", "primary", "book"), btn("Message your team", "secondary", "message")], "start"),
  ],
  { id: "membership" },
);

const calls = card(
  "Your booked call",
  [
    text(`${dayIn(3)} · 10:30 am Costa Rica time`, "strong"),
    meta(`${L.andrea} · 20 minutes`),
    row([btn("Join call", "primary", "join", "sm"), btn("Change time", "secondary", "change", "sm"), btn("Cancel call", "ghost", "cancelcall", "sm")], "start"),
  ],
  { id: "calls" },
);

const obligations = card(
  "Dates that may need attention",
  [
    meta("Coming up"),
    list(
      [
        { id: "o1", title: "Corporate tax return (D-101) may require review", meta: `Around ${dateIn(6)} · S.A.` },
        { id: "o2", title: "Vehicle circulation permit (marchamo)", meta: "Every year by December 31" },
      ],
      "rows",
    ),
    row([btn("Ask my lawyer", "secondary", "ask", "sm"), hidden(pill("On your list for the next call", "info", "asked"))], "start"),
  ],
  { id: "obligations" },
);

const matter = card(
  "S.A. clean-up before sale",
  [
    meta(`Corporate · Lawyer: ${L.andrea}`),
    timeline([
      { title: "We received your request", state: "done" },
      { title: "Your lawyer reviews the company books", meta: "Where you are", state: "current", id: "here" },
      { title: "Corrections are filed", state: "upcoming" },
      { title: "Ready to sell", state: "upcoming" },
    ]),
  ],
  { id: "matter" },
);

function page() {
  return mockShell("client", "Overview", stack([text("Hello, Linda.", "h1"), grid("3-2", [stack([nextStep, obligations, matter], 3), stack([membership, calls], 3)])]));
}

export const clientOverview: Tutorial = {
  id: "client.overview",
  version: 1,
  title: "Your ILP home",
  summary: "Your next step, your membership and your dates.",
  audience: ["client"],
  route: "/status",
  steps: [
    step(
      "next",
      "Start with your next step",
      "The blue card tells you what to do next, who does it and by when. Your lawyer confirms it after each call.",
      scene(page(), [hover("nextstep", [mark("nextstep")], 1600), wait(400)]),
      { target: "client-next-step" },
    ),
    step(
      "membership",
      "See your minutes and book a call",
      "Your membership includes 60 minutes a month, in up to three 20-minute calls. Select Book a call when you have a question.",
      scene(page(), [hover("minutes", [mark("minutes")], 1200), click("book", [], "Book a call"), wait(500)]),
      { target: "client-membership" },
    ),
    step(
      "calls",
      "Join your booked call",
      "Your booked calls show the day and time in Costa Rica time. Join call opens the video call; you can also change the time or cancel.",
      scene(page(), [hover("calls", [], 900), click("join", [set("join", { label: "Opening…" })], "Join call"), wait(600)]),
    ),
    step(
      "dates",
      "Ask your lawyer about a date",
      "Dates that may need attention come from your profile. If one is unclear, select Ask my lawyer and it is added to your next call.",
      scene(page(), [hover("o1", [mark("o1")], 1000), click("ask", [set("ask", { hidden: true }), show("asked")], "Ask my lawyer"), wait(900)]),
      { target: "client-obligations" },
    ),
    step(
      "progress",
      "Follow your matter",
      "The timeline shows where your matter is now and what comes after.",
      scene(page(), [scroll("matter"), hover("here", [mark("here")], 1300)]),
    ),
  ],
};

export default clientOverview;
