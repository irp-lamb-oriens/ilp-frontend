import type { Tutorial } from "../../components/tutorial/types";
import { MEMBERS as M, btn, click, dateIn, dayIn, h3, hover, list, mark, meta, mockShell, p, row, scene, stack, step, text, grid, wait, set, weekdayIn } from "../presets";

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
          meta(`${weekdayIn(0)}, ${dateIn(0)} · 1 summary needs your confirmation`),
          text("Your hours and availability", "meta", "hours"),
          calls,
          row([btn("Join call", "primary", "join", "sm"), meta("Join opens 10 minutes before the call")], "start"),
        ],
        3,
      ),
      stack([h3("Next 3 days"), upcoming], 2),
    ]),
  );
}

export const lawyerToday: Tutorial = {
  id: "lawyer.today",
  version: 1,
  title: "Today",
  summary: "Your calls today and what each one needs.",
  audience: ["lawyer"],
  route: "/lawyer",
  steps: [
    step(
      "list",
      "See today's calls",
      "Calls are in time order; the next one is tagged Next. Each shows the matter, profile completeness and the member's question.",
      scene(page(), [hover("c1", [mark("c1")], 1200), hover("c2", [mark("c1", false)], 800)]),
      { target: "lawyer-today-calls" },
    ),
    step(
      "status",
      "Read consent and summary status",
      "Consent pending means ask before recording. Suggested — confirm means a summary waits for you after the call.",
      scene(page(), [hover("c2", [mark("c2")], 1100), hover("c3", [mark("c2", false), mark("c3")], 1100)]),
    ),
    step(
      "brief",
      "Open the pre-call brief",
      "Select a call to open its page: the brief on one screen, then consent, transcript and summary.",
      scene(page(), [click("c1", [mark("c1")], M.hiroshi), wait(800)]),
    ),
    step(
      "join",
      "Join on time",
      "Join call opens the Google Meet link shortly before the start. If the link is not ready, the ILP team sends it by email.",
      scene(page(), [hover("join", [], 900), click("join", [set("join", { label: "Joining…" })], "Join call"), wait(700)]),
    ),
  ],
};

export default lawyerToday;
