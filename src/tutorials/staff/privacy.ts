import type { Tutorial } from "../../components/tutorial/types";
import { MEMBERS as M, btn, click, dateIn, dialog, drawer, hover, input, mark, meta, mockShell, open, pill, row, scene, set, shut, stack, step, table, text, toggle, type, wait } from "../presets";

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
          ),
          row([btn("Close", "secondary", "m_close", "sm"), btn("Run deletion", "danger", "run", "sm")], "end"),
        ]),
      ],
    },
  );
}

export const staffPrivacy: Tutorial = {
  id: "staff.privacy",
  version: 1,
  title: "Privacy requests",
  summary: "Answer member data requests on time.",
  audience: ["staff"],
  route: "/dashboard/privacy",
  steps: [
    step(
      "list",
      "Work the oldest deadline first",
      "Every request has a legal answer date. Overdue requests are marked; Show open only hides closed ones.",
      scene(page(), [hover("q3", [mark("q3")], 1100), hover("openonly", [mark("q3", false)], 700)]),
      { target: "staff-privacy-list" },
    ),
    step(
      "answer",
      "Answer the member",
      "Open a request, write the answer and select Complete or Refuse. The answer is emailed to the member and kept with the request.",
      scene(page(), [
        click("q2", [open("drawer")], M.russell),
        type("answer", "Your account and data are deleted. Legal records we must keep are anonymized."),
        hover("complete", [], 700),
      ]),
    ),
    step(
      "delete",
      "Run a deletion with the matrix",
      "For deletion requests, Show what will be deleted lists each collection and whether it is deleted, anonymized or hashed. Run deletion, then finish the steps listed by hand.",
      scene(page(), [
        wait(200, [open("drawer")]),
        click("plan", [shut("drawer"), open("matrix")], "Show what will be deleted"),
        hover("run", [], 900),
        click("run", [set("run", { label: "Deletion done", disabled: true })], "Run deletion"),
        wait(800),
      ]),
    ),
  ],
};

export default staffPrivacy;
