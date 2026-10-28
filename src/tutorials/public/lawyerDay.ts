import type { Tutorial } from "../../components/tutorial/types";
import { MEMBERS as M, btn, card, click, dateIn, deflist, grid, h3, hover, list, mark, meta, mockShell, p, pill, progress, row, say, scene, set, stack, step, text, weekdayIn } from "../presets";

/**
 * "Your day in the portal", for lawyers on the /attorneys landing. Reuses the
 * layout of the lawyer portal's Today and call page (lawyer.today,
 * lawyer.call) with placeholder members, and explains each part for someone
 * who has never seen the portal.
 */

const calls = list(
  [
    {
      id: "c1",
      lead: "9:30",
      leadMeta: "20 min",
      title: `${M.hiroshi} · Next`,
      meta: "S.A. clean-up before sale · Profile 82%",
      quote: "Can I sell the house before the S.A. books are fixed?",
      pills: [p("Recording allowed", "success"), p("Brief", "info")],
    },
    {
      id: "c2",
      lead: "11:00",
      leadMeta: "20 min",
      title: M.asa,
      meta: "Residency renewal · Profile 64%",
      quote: "My DIMEX expires in March. What do I start now?",
      pills: [p("Recording not answered yet", "neutral")],
    },
  ],
  "rows",
  "calls",
);

const todayPage = mockShell(
  "lawyer",
  "Today",
  grid("3-1", [
    stack(
      [
        text("2 calls today", "h1"),
        meta(`${weekdayIn(0)}, ${dateIn(0)}`, "date"),
        calls,
        row([btn("Join call", "primary", "join", "sm"), meta("Join opens 10 minutes before the call", "join_note")], "start"),
      ],
      3,
    ),
    stack([h3("Next 3 days"), list([{ id: "u1", title: M.joseLuis, meta: `${dateIn(1)} · 10:00 · Company` }, { id: "u2", title: M.winona, meta: `${dateIn(2)} · 2:30 · Vehicle` }], "plain", "upcoming")], 2),
  ]),
);

const briefPage = mockShell(
  "lawyer",
  "Today",
  card(
    `Pre-call brief for ${M.hiroshi}`,
    [
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
      text("Dates in the next 60 days", "label"),
      list([{ title: "Corporate tax return (D-101)", meta: `Due ${dateIn(6)}`, pill: p("Soon", "warning") }], "plain", "due"),
      progress("Profile completeness", 0.82, "82%", "success", "complete"),
      row([pill("One screen", "info")], "start"),
    ],
    { id: "brief" },
  ),
  { title: "Call with Hiroshi Tanaka" },
);

export const publicLawyerDay: Tutorial = {
  id: "public.lawyer-day",
  version: 1,
  title: "Your day in the portal",
  summary: "Today shows your calls with ILP members, and each call opens on a one-screen brief.",
  audience: ["public"],
  autoStart: "never",
  steps: [
    step(
      "today",
      "See today's calls",
      "When you sign in, Today lists your video calls with ILP members in time order. Each call lasts up to 20 minutes.",
      scene(todayPage, [
        say(hover("c1", [mark("c1")]), M.hiroshi, "Your next call. You see the topic, how complete the member's profile is, and the question they wrote when they booked."),
        say(hover("c2", [mark("c1", false), mark("c2")]), M.asa, "Each call says whether the member agreed to recording. You ask at the start if they have not answered yet.", ["recordingConsent"]),
        say(hover("u1", [mark("c2", false)]), "Next 3 days", "Calls booked for the coming days, so you can plan your week."),
      ]),
    ),
    step(
      "brief",
      "Read the one-screen brief",
      "Open a call and it starts with a brief. It holds the member's question and the facts from their legal profile, on one screen.",
      scene(briefPage, [
        say(hover("question", [mark("question")]), "Their question", "What the member wants to ask, in their own words. You can prepare before the call starts.", ["brief"]),
        say(hover("facts", [mark("question", false), mark("facts")]), "Profile facts", "Residency, property, company and family, from the member's profile. You do not spend the call on intake questions."),
        say(hover("due", [mark("facts", false), mark("due")]), "Dates in the next 60 days", "Legal dates coming up for this member, such as a company tax return. Mention them if they matter."),
      ]),
    ),
    step(
      "join",
      "Join on time",
      "Calls run on Google Meet in the browser. The join button opens the video link shortly before the start time.",
      scene(todayPage, [
        say(hover("join_note"), "Join opens 10 minutes before", "You can arrive a little early. If a link is not ready, the ILP team emails it to you.", ["videoLink"]),
        say(click("join", [set("join", { label: "Joining" })]), "Join call", "Opens the call in your browser. Nothing else to install on a computer."),
      ]),
    ),
  ],
};

export default publicLawyerDay;
