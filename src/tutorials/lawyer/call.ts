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
  say,
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
      "Summary for the member",
      [
        row([btn("Draft summary", "secondary", "draft", "sm"), hidden(pill("Suggested: check it", "warning", "suggested"))], "start"),
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
        row([meta("Minutes used 20", "minutes_used"), btn("Confirm and hand off", "primary", "handoff")], "between"),
      ],
      { id: "summarycard" },
    ),
  ],
  3,
);

function page() {
  return mockShell("lawyer", "Today", stack([row([text("Back to Today", "meta"), text(`${M.hiroshi}, 9:30`, "meta")], "start", 1), grid("1-1", [brief, panel])]), {
    overlays: [toast("toast", "Summary confirmed and handed off")],
  });
}

const SUMMARY = "You can sell once the S.A. books are updated. Send the books; I will list what is missing.";

export const lawyerCall: Tutorial = {
  id: "lawyer.call",
  version: 3,
  title: "Call page",
  summary: "Brief, recording consent, transcript, summary and handoff for one call.",
  audience: ["lawyer"],
  route: "/lawyer/calls/[id]",
  steps: [
    step(
      "brief",
      "Read the brief before the call",
      "The brief puts what you need on one screen: the member's question, family, residency, property, company and legal dates due soon.",
      scene(page(), [
        say(hover("question", [mark("question")]), "Their question", "What the member wants to ask, in their own words, written when they booked."),
        say(hover("facts", [mark("question", false)]), "Profile facts", "Family, residency, property and company, from the member's living profile. Ask about anything that looks out of date."),
        say(hover("due", [mark("due")]), "Due in the next 60 days", "Legal dates coming up for this member. Here the company's yearly tax return is due in six days."),
      ]),
      { target: "lawyer-call-brief" },
    ),
    step(
      "consent",
      "Check recording consent",
      "ILP records a call only when the member agrees. Ask at the start of the call and note their answer here.",
      scene(page(), [
        say(hover("rec"), "Start recording", "Locked until the member says yes. This protects the member and you."),
        say(click("agree", [show("consent_ok"), set("agree", { variant: "primary" })]), "Member agreed", "Press this when the member says yes. Start recording then works. If they say no, press Member declined and take your own notes.", ["recordingConsent"]),
        say(click("rec", [set("rec", { label: "Recording" })]), "Start recording", "Starts recording the call. The recording is used to make a written transcript."),
      ]),
    ),
    step(
      "summary",
      "Check the suggested summary",
      "After the call, get the transcript, then let the system draft a summary. Check every line and fix anything that is not right.",
      scene(page(), [
        say(click("meet", [set("tstate", { text: "From the Google Meet transcript." })]), "Get transcript from Meet", "Fetches the written text of the call from Google Meet. You can also paste it, or upload the recording."),
        say(click("draft", [show("suggested")]), "Draft summary", "A computer program drafts a summary from the transcript. It is marked Suggested until you confirm it."),
        say(type("summary", SUMMARY), "Summary", "Write it for the member, in plain words. They read it after you confirm."),
      ]),
    ),
    step(
      "steps",
      "Add the next steps",
      "List what needs to happen next and who does it: the member, you, or the ILP team, each with a date.",
      scene(page(), [
        scroll("summarycard"),
        say(hover("s1"), "Send the S.A. minute books", "A step for the member, with a date. The member sees it on their home page as their next step."),
        say(type("newstep", "Review the books and list what is missing", [show("s2"), set("newstep", { value: "" })]), "Add a step", "Type a step and press Enter. Say who does it, so nothing falls between you, the member and the ILP team."),
      ]),
    ),
    step(
      "handoff",
      "Confirm and hand off",
      "Confirm and hand off sends the confirmed summary and steps to the member and the ILP team. Their customer success manager then handles the follow-up.",
      scene(page(), [
        wait(100, [set("summary", { value: SUMMARY }), show("s2"), show("suggested")]),
        scroll("summarycard"),
        say(hover("minutes_used"), "Minutes used 20", "How long the call took. It comes off the member's 60 minutes for the month."),
        say(
          click("handoff", [set("suggested", { label: "Summary confirmed", tone: "success" }), set("handoff", { label: "Handed off", disabled: true }), toastOn("toast")]),
          "Confirm and hand off",
          "Locks in your summary and steps. The member sees them, and their CSM follows up on the rest, like prices and reminders.",
          ["handoff"],
        ),
      ]),
    ),
  ],
};

export default lawyerCall;
