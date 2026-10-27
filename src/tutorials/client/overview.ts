import type { Tutorial } from "../../components/tutorial/types";
import {
  LAWYERS as L,
  btn,
  card,
  click,
  dateIn,
  dayIn,
  grid,
  hidden,
  hover,
  list,
  mark,
  meta,
  mockShell,
  move,
  pill,
  progress,
  row,
  say,
  scene,
  scroll,
  set,
  show,
  stack,
  step,
  text,
  timeline,
  type,
} from "../presets";

const nextStep = card(
  "Your next step",
  [
    text("Send the minute books and share register of your S.A.", "strong"),
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
      { title: "We received your request", state: "done", id: "m_done" },
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
  version: 2,
  title: "Your ILP home",
  summary: "Your next step, your call minutes and the dates that may need attention.",
  audience: ["client"],
  route: "/status",
  steps: [
    step(
      "next",
      "Start with your next step",
      "This is your home page. The blue box at the top always tells you the one thing to do next, who does it, and by when.",
      scene(page(), [
        say(hover("nextstep", [mark("nextstep")]), "Your next step", "The one thing to do now: send two company documents within a week. Your lawyer confirmed this after your call."),
        say(hover("ns_who"), "Who", "Who does this step. Here it is you. Sometimes it is your lawyer or your ILP team."),
        say(hover("ns_when"), "By when", "The date to aim for. If it does not suit you, just write to your team."),
      ]),
      { target: "client-next-step" },
    ),
    step(
      "membership",
      "See your minutes and book a call",
      "Your membership includes up to 60 minutes of calls a month, in up to three 20-minute calls with your lawyer.",
      scene(page(), [
        say(hover("minutes", [mark("minutes")]), "Minutes left this month", "You have 40 of your 60 minutes left. They start again each month on your renewal date."),
        say(hover("message"), "Message your team", "Write to the people at ILP who look after you. They answer questions about your account and follow up for you."),
        say(click("book"), "Book a call", "Opens a page where you pick a day and time for a 20-minute video call with your lawyer."),
      ]),
      { target: "client-membership" },
    ),
    step(
      "calls",
      "Join your booked call",
      "Your booked call shows the day and the time in Costa Rica time. You can join it, move it or cancel it here.",
      scene(page(), [
        say(hover("calls"), "Your booked call", "The day, time and lawyer for your next call. The time shown is Costa Rica time."),
        say(hover("change"), "Change time", "Pick another day or time if this one no longer suits you."),
        say(click("join", [set("join", { label: "Opening…" })]), "Join call", "Opens the video call in your web browser at the time of the call. On a computer, there is nothing to install.", ["videoLink"]),
      ]),
    ),
    step(
      "dates",
      "Ask your lawyer about a date",
      "Some legal dates in Costa Rica come back every year. We list the ones that may apply to you, based on your profile.",
      scene(page(), [
        say(hover("o1", [mark("o1")]), "Corporate tax return (D-101)", "A yearly tax form for your company that may need a review. It is listed early, so there is plenty of time."),
        say(hover("o2", [mark("o1", false)]), "Vehicle permit (marchamo)", "The yearly permit every car in Costa Rica needs, paid by December 31."),
        say(click("ask", [set("ask", { hidden: true }), show("asked")]), "Ask my lawyer", "Adds this date to your next call, so your lawyer can tell you whether it applies to you."),
      ]),
      { target: "client-obligations" },
    ),
    step(
      "progress",
      "Follow your matter",
      "A matter is one legal job we help you with. The steps show where yours is now and what comes next.",
      scene(page(), [
        scroll("matter"),
        say(hover("m_done"), "We received your request", "Steps marked done are finished. There is nothing for you to do for them."),
        say(hover("here", [mark("here")]), "Where you are", "Your lawyer is reviewing your company's books. When that is done, the next step is marked here."),
      ]),
    ),
  ],
};

export default clientOverview;
