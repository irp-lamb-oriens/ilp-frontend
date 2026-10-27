import type { Tutorial } from "../../components/tutorial/types";
import {
  MEMBERS as M,
  btn,
  click,
  dateIn,
  dialog,
  drawer,
  hover,
  input,
  mark,
  meta,
  mockShell,
  open,
  pill,
  row,
  say,
  scene,
  set,
  shut,
  stack,
  step,
  table,
  text,
  toggle,
  type,
  wait,
} from "../presets";

const requests = table(
  ["Member", "Request", "Status", "Answer by"],
  [
    { id: "q1", cells: [M.colleen, "Access", pill("Received", "info"), dateIn(12)] },
    { id: "q2", cells: [M.russell, "Deletion", pill("In review", "warning"), dateIn(3)] },
    { id: "q3", cells: [M.kai, "Correction", pill("Overdue · " + dateIn(-1), "danger"), dateIn(-1)] },
  ],
  "requests",
);

function page() {
  return mockShell(
    "staff",
    "Privacy",
    stack([
      meta("Access, correction, objection and deletion requests from members, with their legal answer dates."),
      row([toggle("Show open only", true, "openonly", "checkbox")], "start"),
      requests,
    ]),
    {
      title: "Privacy requests",
      overlays: [
        drawer(
          "drawer",
          `Deletion · ${M.russell}`,
          [
            text("Reference PR-2026-0412", "meta"),
            text("Member wrote: “Please delete my account and data. I moved back to Canada.”", "body"),
            input("Answer to the member (emailed when you complete or refuse)", { multiline: true, id: "answer" }),
            row([btn("Mark in review", "secondary", "review", "sm"), btn("Show what will be deleted", "secondary", "plan", "sm")], "start"),
            row([btn("Complete", "primary", "complete", "sm"), btn("Refuse", "danger", "refuse", "sm")], "start"),
          ],
          "In review",
        ),
        dialog("matrix", "Deletion matrix", [
          table(
            ["Collection", "Action", "Records"],
            [
              { cells: ["clients", "Delete", "1"] },
              { cells: ["consultations", "Anonymize", "3"] },
              { cells: ["audit_events", "Hash email", "27"] },
            ],
            "matrix_table",
          ),
          row([btn("Close", "secondary", "m_close", "sm"), btn("Run deletion", "danger", "run", "sm")], "end"),
        ]),
      ],
    },
  );
}

export const staffPrivacy: Tutorial = {
  id: "staff.privacy",
  version: 2,
  title: "Privacy requests",
  summary: "Answer members' requests about their personal data on time.",
  audience: ["staff"],
  route: "/dashboard/privacy",
  steps: [
    step(
      "list",
      "Work the oldest deadline first",
      "Members can ask to see, correct or delete the personal information we keep about them. The law gives us a date to answer by, shown on each request.",
      scene(page(), [
        say(hover("q3", [mark("q3")]), M.kai, "He asked us to correct his data, and the answer date has passed. Answer this one first.", ["privacyRequest"]),
        say(hover("q1", [mark("q3", false)]), "Access", "This member wants a copy of everything we keep about her. Answer by the date shown."),
        say(hover("openonly"), "Show open only", "A tick box. When it is ticked, finished requests are hidden, so you see only what still needs work."),
      ]),
    ),
    step(
      "answer",
      "Answer the member",
      "Open a request, write your answer in plain words, then complete it. The member gets your answer by email, and it is kept with the request.",
      scene(page(), [
        say(click("q2", [open("drawer")]), M.russell, "Opens his deletion request in a side panel, with his own words and the reference number."),
        say(type("answer", "Your account and data are deleted. Legal records we must keep are anonymized."), "Answer to the member", "What you tell the member. It is emailed when you complete or refuse the request."),
        say(hover("complete"), "Complete or Refuse", "Complete means the request is done. Refuse only when the law allows it, and say why in your answer."),
      ]),
    ),
    step(
      "delete",
      "Run a deletion",
      "For a deletion, the system first shows exactly what it will delete and what it must keep. Then you run it, and finish any steps it lists by hand.",
      scene(page(), [
        wait(200, [open("drawer")]),
        say(click("plan", [shut("drawer"), open("matrix")]), "Show what will be deleted", "Opens a list of every kind of record about this member and what will happen to each one."),
        say(hover("matrix_table"), "Delete, anonymize or hash", "Some records are deleted. Others the law makes us keep, so the names are removed or scrambled instead.", ["anonymize", "hash"]),
        say(click("run", [set("run", { label: "Deletion done", disabled: true })]), "Run deletion", "Carries out the plan. It cannot be undone, so read the list first."),
      ]),
    ),
  ],
};

export default staffPrivacy;
