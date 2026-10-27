import type { Tutorial } from "../../components/tutorial/types";
import {
  MEMBERS as M,
  btn,
  click,
  dateIn,
  dayIn,
  grid,
  h3,
  hover,
  list,
  mark,
  meta,
  mockShell,
  open,
  p,
  row,
  say,
  scene,
  set,
  stack,
  step,
  text,
  type,
  weekdayIn,
} from "../presets";

const calls = list(
  [
    {
      id: "c1",
      lead: "9:30",
      leadMeta: "20 min",
      title: `${M.hiroshi} · Next`,
      meta: "S.A. clean-up before sale · Profile 82%",
      quote: "Can I sell the house before the S.A. books are fixed?",
      pills: [p("Recording allowed", "success"), p("Brief →", "info")],
    },
    {
      id: "c2",
      lead: "11:00",
      leadMeta: "20 min",
      title: M.asa,
      meta: "Residency renewal · Profile 64%, incomplete",
      quote: "My DIMEX expires in March. What do I start now?",
      pills: [p("Consent pending", "warning")],
    },
    { id: "c3", lead: "8:00", leadMeta: "20 min", title: M.priya, meta: "Property purchase review · Profile 90%", pills: [p("Suggested — confirm", "warning")] },
  ],
  "rows",
  "calls",
);

const upcoming = list(
  [
    { id: "u1", title: M.joseLuis, meta: `${dayIn(1)} · 10:00 · Corporate` },
    { id: "u2", title: M.winona, meta: `${dayIn(2)} · 2:30 · Vehicle` },
  ],
  "plain",
  "upcoming",
);

function page() {
  return mockShell(
    "lawyer",
    "Today",
    grid("3-1", [
      stack(
        [
          text("3 calls today", "h1"),
          meta(`${weekdayIn(0)}, ${dateIn(0)} · 1 summary needs your confirmation`, "todo_note"),
          text("Your hours and availability", "meta", "hours"),
          calls,
          row([btn("Join call", "primary", "join", "sm"), meta("Join opens 10 minutes before the call", "join_note")], "start"),
        ],
        3,
      ),
      stack([h3("Next 3 days"), upcoming], 2),
    ]),
  );
}

export const lawyerToday: Tutorial = {
  id: "lawyer.today",
  version: 2,
  title: "Today",
  summary: "Your calls today and what each one needs from you.",
  audience: ["lawyer"],
  route: "/lawyer",
  steps: [
    step(
      "list",
      "See today's calls",
      "Today lists your video calls with ILP members, in time order. Each call lasts up to 20 minutes and shows the member's question in advance.",
      scene(page(), [
        say(hover("c1", [mark("c1")]), M.hiroshi, "Your next call. You see the topic, how complete his profile is, and the question he wants to ask."),
        say(hover("u1", [mark("c1", false)]), "Next 3 days", "Calls booked for the coming days, so you can plan ahead."),
        say(hover("hours"), "Your hours and availability", "Members can only book inside the hours you set. You change them on the Availability page."),
      ]),
      { target: "lawyer-today-calls" },
    ),
    step(
      "status",
      "Read the labels on each call",
      "The labels on each call tell you what to do before or after it: ask about recording, or check a summary that waits for you.",
      scene(page(), [
        say(hover("c2", [mark("c2")]), "Consent pending", "The member has not said yet whether the call may be recorded. Ask at the start, before you record.", ["recordingConsent"]),
        say(hover("c3", [mark("c2", false), mark("c3")]), "Suggested — confirm", "A computer drafted a summary of this call. It counts only after you check and confirm it.", ["aiSummary"]),
      ]),
    ),
    step(
      "brief",
      "Open the pre-call brief",
      "Click a call to open its page. It starts with a one-screen brief: the member's question and the key facts from their profile.",
      scene(page(), [
        say(hover("todo_note"), "1 summary needs your confirmation", "A past call still needs your check. Until then, the member and the ILP team cannot rely on its summary."),
        say(click("c1", [mark("c1")]), M.hiroshi, "Opens the call page: the brief first, then the recording, transcript and summary tools.", ["brief"]),
      ]),
    ),
    step(
      "join",
      "Join on time",
      "Calls happen on Google Meet. Join call opens the video link shortly before the start time.",
      scene(page(), [
        say(hover("join_note"), "Join opens 10 minutes before the call", "The button works from 10 minutes before the start, so you can arrive a little early."),
        say(click("join", [set("join", { label: "Joining…" })]), "Join call", "Opens the video call in your browser. If the link is not ready, the ILP team emails it to you.", ["videoLink"]),
      ]),
    ),
  ],
};

export default lawyerToday;
