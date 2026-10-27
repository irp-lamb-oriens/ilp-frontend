import type { Tutorial } from "../../components/tutorial/types";
import {
  FEE,
  MEMBERS as M,
  TEAM,
  btn,
  click,
  dateIn,
  deflist,
  drawer,
  grid,
  h2,
  h3,
  hide,
  hover,
  input,
  list,
  meta,
  mockShell,
  p,
  progress,
  row,
  scene,
  set,
  shut,
  open,
  show,
  stack,
  stat,
  step,
  text,
  toast,
  toastOn,
  type,
  wait,
  mark,
} from "../presets";

const kpis = grid("2-1-1-1-1", [
  stat("Monthly recurring revenue", "US$3,679.54", { size: "lg", delta: "+US$79.99 since yesterday", trend: "up", hint: `46 active members × ${FEE}`, id: "k_mrr" }),
  stat("Month-3 retention", "83.3%", { hint: "25 of 30 · target 80%", id: "k_ret" }),
  stat("Consultation-ready", "71.7%", { hint: "33 of 46 active members", id: "k_ready" }),
  stat("Handoffs confirmed in 24 h", "92.3%", { hint: "12 of 13 · target 100%", id: "k_handoff" }),
  stat("Overdue open tasks", "3", { hint: "1 yours", id: "k_overdue" }),
]);

const queue = list(
  [
    { id: "t1", pill: p("Missing document", "warning"), title: "Ask for the DIMEX copy", meta: M.joseLuis, pills: [p("Overdue 2 days", "danger")] },
    { id: "t2", pill: p("Onboarding", "info"), title: "Welcome call and profile check", meta: M.imani, pills: [p("Due today", "warning")] },
    { id: "t3", pill: p("Proposal", "success"), title: "Send the S.A. clean-up proposal", meta: M.hiroshi, pills: [p(`Due ${dateIn(2)}`)] },
    { id: "t4", pill: p("Follow-up", "neutral"), title: "Confirm next steps after the call", meta: M.priya, pills: [p(`Due ${dateIn(3)}`)] },
  ],
  "rows",
  "queue",
);

const rail = stack(
  [
    h2("Needs attention"),
    h3("Overdue matters 2"),
    list(
      [
        { id: "a1", title: M.omar, meta: "Property transfer, Tamarindo", pill: p("Overdue · 16 days in stage", "danger") },
        { id: "a2", title: M.asa, meta: "Residency renewal", pill: p("Warn · 9 days in stage", "warning") },
      ],
      "plain",
    ),
    h3("Obligations due in 14 days 1"),
    list([{ id: "a3", title: M.kai, meta: "Corporate tax return (D-101)", pill: p(`Due ${dateIn(6)}`, "warning") }], "plain"),
    h3("Quotes unanswered 5+ days 1"),
    list([{ id: "a4", title: M.chloe, meta: "Will and estate plan", pill: p("7 days", "warning") }], "plain"),
  ],
  2,
  "rail",
);

function page(opts: { title?: string } = {}) {
  return mockShell(
    "staff",
    "Today",
    stack([
      kpis,
      grid("2-1", [
        stack(
          [
            row([h2(opts.title ?? "My queue", "qtitle"), row([btn("Mine", "secondary", "mine", "sm"), btn("Everyone", "ghost", "everyone", "sm")], "end", 1)], "between"),
            { type: "text", text: "Closed: Ask for the DIMEX copy", variant: "meta", id: "notice", hidden: true },
            queue,
          ],
          2,
        ),
        rail,
      ]),
    ]),
    {
      title: "Today",
      overlays: [
        drawer(
          "drawer",
          "Ask for the DIMEX copy",
          [
            row([text("Missing document", "label"), text("Overdue 2 days", "label")], "start"),
            progress("Profile complete (not ready yet)", 0.65, "65%", "warning"),
            deflist([
              { term: "Minutes left", value: "40 of 60" },
              { term: "Calls left", value: "2 of 3" },
              { term: "Next call", value: dateIn(4) },
              { term: "Open tasks", value: "2" },
            ]),
            input("Outcome", { multiline: true, placeholder: "Called Mark, profile reviewed, he will upload his DIMEX by Friday.", id: "outcome" }),
            btn("Close task", "primary", "close"),
          ],
          `Missing document · ${M.joseLuis}`,
        ),
        toast("toast", "Closed: Ask for the DIMEX copy"),
      ],
    },
  );
}

export const staffToday: Tutorial = {
  id: "staff.today",
  version: 1,
  title: "Today",
  summary: "Key figures, your task queue and what needs attention.",
  audience: ["staff"],
  route: "/dashboard",
  steps: [
    step(
      "kpis",
      "Read the key figures",
      "The strip on top shows membership revenue (MRR), retention, how many members are consultation-ready and how fast handoffs are confirmed. Overdue open tasks counts the whole team; the hint shows yours.",
      scene(page(), [hover("k_mrr", [], 900), hover("k_ready", [], 700), hover("k_overdue", [mark("k_overdue")], 900)]),
      { target: "staff-kpis" },
    ),
    step(
      "open-task",
      "Open a task from My queue",
      "Your tasks are sorted by due date, overdue first. Select one to see the member at a glance without leaving Today.",
      scene(page(), [hover("t2"), click("t1", [open("drawer")], "Ask for the DIMEX copy"), wait(900)]),
      { target: "staff-queue" },
    ),
    step(
      "close-task",
      "Close it with an outcome",
      "Write what happened in Outcome, then select Close task. The outcome goes on the member's timeline and the task leaves your queue.",
      scene(page(), [
        wait(300, [open("drawer")]),
        type("outcome", "Called José-Luis. He uploads the DIMEX copy by Friday."),
        click("close", [shut("drawer"), hide("t1"), show("notice"), toastOn("toast")], "Close task"),
        wait(1200),
      ]),
    ),
    step(
      "attention",
      "Act on Needs attention",
      "The right rail lists overdue matters, obligations due within 14 days and quotes with no answer after 5 days. Select a member to open their page and take the next step.",
      scene(page(), [hover("a1"), hover("a3"), click("a4", [mark("a4")], M.chloe), wait(800)]),
      { target: "staff-attention" },
    ),
    step(
      "team",
      "See the team queue",
      "Switch from Mine to Everyone to cover for a colleague. Each task then shows who owns it.",
      scene(page(), [
        click("everyone", [
          set("everyone", { variant: "secondary" }),
          set("mine", { variant: "ghost" }),
          set("qtitle", { text: "Team queue" }),
          set("t1", { meta: `${M.joseLuis} · ${TEAM.csmEmail}` }),
          set("t2", { meta: `${M.imani} · ${TEAM.csm2Email}` }),
        ], "Everyone"),
        wait(1200),
      ]),
    ),
  ],
};

export default staffToday;
