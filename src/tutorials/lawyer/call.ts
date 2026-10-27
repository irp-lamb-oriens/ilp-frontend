import type { Tutorial } from "../../components/tutorial/types";
import {
  MEMBERS as M,
  btn,
  card,
  click,
  dateIn,
  deflist,
  grid,
  hidden,
  hover,
  input,
  list,
  mark,
  meta,
  mockShell,
  p,
  pill,
  progress,
  row,
  scene,
  scroll,
  set,
  show,
  stack,
  step,
  text,
  toast,
  toastOn,
  type,
  wait,
} from "../presets";

const brief = card(
  `Pre-call brief for ${M.hiroshi}`,
  [
    text("Their question", "label"),
    text("“Can I sell the house before the S.A. books are fixed?”", "body", "question"),
    deflist(
      [
        { term: "Household", value: "Married, 0 dependents" },
        { term: "Residency", value: `Pensionado · expires ${dateIn(74)}` },
        { term: "Property", value: "Nosara, Guanacaste" },
        { term: "Company", value: "S.A. (inactive)" },
      ],
      "facts",
    ),
    text("Due in the next 60 days", "label"),
    list([{ title: "Corporate tax return (D-101)", meta: `Due ${dateIn(6)}`, pill: p("Due soon", "warning") }], "plain", "due"),
    progress("Profile completeness", 0.82, "82%", "success"),
  ],
  { id: "brief" },
);

const panel = stack(
  [
    card(
      "Recording consent",
      [
        meta("Ask the member before recording. Nothing is recorded until they agree."),
        row([btn("Member agreed", "secondary", "agree", "sm"), btn("Member declined", "secondary", "decline", "sm"), hidden(pill("Recording allowed", "success", "consent_ok"))], "start"),
        row([btn("Start recording", "primary", "rec", "sm"), meta("Recording is blocked until consent is granted.")], "start", 2, "recrow"),
      ],
      { id: "consent" },
    ),
    card(
      "Transcript",
      [row([btn("Get transcript from Meet", "secondary", "meet", "sm"), btn("Paste transcript", "ghost", "paste", "sm"), btn("Upload recording", "ghost", "upload", "sm")], "start"), meta("No transcript yet.", "tstate")],
      { id: "transcript" },
    ),
    card(
      "Summary",
      [
        row([btn("Draft summary", "secondary", "draft", "sm"), hidden(pill("Suggested — confirm", "warning", "suggested"))], "start"),
        input(undefined, { multiline: true, placeholder: "What was discussed and what you concluded, in plain words for the member.", id: "summary" }),
        text("What needs to happen", "label"),
        list(
          [
            { id: "s1", title: "Send the S.A. minute books and share register", meta: `Member · ${dateIn(7)}`, pill: p("Member", "info") },
            { id: "s2", title: "Review the books and list what is missing", meta: `Lawyer · ${dateIn(14)}`, pill: p("Lawyer"), hidden: true },
          ],
          "plain",
          "steps",
        ),
        input(undefined, { placeholder: "Add a step", id: "newstep" }),
        row([meta("Minutes used 20"), btn("Confirm and hand off", "primary", "handoff")], "between"),
      ],
      { id: "summarycard" },
    ),
  ],
  3,
);

function page() {
  return mockShell("lawyer", "Today", stack([row([text("Today", "meta"), text("›", "meta"), text(`${M.hiroshi}, 9:30`, "meta")], "start", 1), grid("1-1", [brief, panel])]), {
    overlays: [toast("toast", "Summary confirmed and handed off")],
  });
}

const SUMMARY = "You can sell once the S.A. books are updated. Send the books; I will list what is missing.";

export const lawyerCall: Tutorial = {
  id: "lawyer.call",
  version: 1,
  title: "Call page",
  summary: "Brief, consent, transcript, summary and handoff for one call.",
  audience: ["lawyer"],
  route: "/lawyer/calls/[id]",
  steps: [
    step(
      "brief",
      "Read the brief before the call",
      "One screen: the member's question, household, residency, property, company and dates due in the next 60 days.",
      scene(page(), [hover("question", [mark("question")], 1100), hover("due", [mark("question", false), mark("due")], 1000)]),
      { target: "lawyer-call-brief" },
    ),
    step(
      "consent",
      "Check recording consent",
      "Ask first. Select Member agreed to unlock recording, or Member declined and write the summary yourself; no transcript is kept.",
      scene(page(), [
        hover("rec", [], 700),
        click("agree", [show("consent_ok"), set("agree", { variant: "primary" })], "Member agreed"),
        click("rec", [set("rec", { label: "Recording" })], "Start recording"),
        wait(700),
      ]),
      { target: "lawyer-call-consent" },
    ),
    step(
      "summary",
      "Confirm the suggested summary",
      "Get the transcript, then Draft summary. The AI draft is marked Suggested — confirm: edit anything that is not right.",
      scene(page(), [
        click("meet", [set("tstate", { text: "From the Google Meet transcript." })], "Get transcript from Meet"),
        click("draft", [show("suggested")], "Draft summary"),
        type("summary", SUMMARY),
        wait(500),
      ]),
    ),
    step(
      "steps",
      "Add the next steps",
      "List what needs to happen and who does it: the member, you, or the ILP team, each with a date.",
      scene(page(), [
        scroll("summarycard"),
        type("newstep", "Review the books and list what is missing", [show("s2"), set("newstep", { value: "" })]),
        wait(800),
      ]),
    ),
    step(
      "handoff",
      "Confirm and hand off",
      "Confirm and hand off needs a summary and at least one next step. The member sees the confirmed steps; the ILP team picks up the follow-up.",
      scene(page(), [
        wait(100, [set("summary", { value: SUMMARY }), show("s2"), show("suggested")]),
        scroll("summarycard"),
        click("handoff", [set("suggested", { label: "Summary confirmed", tone: "success" }), set("handoff", { label: "Handed off", disabled: true }), toastOn("toast")], "Confirm and hand off"),
        wait(1100),
      ]),
    ),
  ],
};

export default lawyerCall;
