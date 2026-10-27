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
  mark,
  mockShell,
  open,
  p,
  progress,
  row,
  say,
  scene,
  set,
  show,
  shut,
  stack,
  stat,
  step,
  text,
  toast,
  toastOn,
  type,
  wait,
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
            progress("Profile complete (not ready yet)", 0.65, "65%", "warning", "d_profile"),
            deflist(
              [
                { term: "Minutes left", value: "40 of 60" },
                { term: "Calls left", value: "2 of 3" },
                { term: "Next call", value: dateIn(4) },
                { term: "Open tasks", value: "2" },
              ],
              "d_minutes",
            ),
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
  version: 2,
  title: "Today",
  summary: "Today's key numbers, your to-do list and what may slip.",
  audience: ["staff"],
  route: "/dashboard",
  steps: [
    step(
      "kpis",
      "Read the key figures",
      "The row on top shows how the business is doing today. Each box is one number the team checks every morning.",
      scene(page(), [
        say(hover("k_mrr"), "Monthly recurring revenue", "All the money members pay us each month, added up. It goes up when someone joins and down when someone leaves.", ["mrr"]),
        say(hover("k_ret"), "Month-3 retention", "Out of the people who joined three months ago, how many are still members. We aim for 80% or more."),
        say(hover("k_ready"), "Consultation-ready", "How many members have filled in enough of their profile for a lawyer to help them well on a call."),
        say(hover("k_overdue", [mark("k_overdue")]), "Overdue open tasks", "Jobs the team should already have finished. The small line under the number shows how many are yours."),
      ]),
      { target: "staff-kpis" },
    ),
    step(
      "open-task",
      "Open a task from My queue",
      "My queue is your to-do list. The most urgent job is on top. Click one to see the member's details without leaving the page.",
      scene(page(), [
        say(hover("t2"), "A task", "Each row is one job for you: what to do, for which member, and when it is due."),
        say(click("t1", [open("drawer")]), "Ask for the DIMEX copy", "This job is two days late, so it sits on top. Clicking it opens a side panel with this member's details."),
        say(hover("d_profile"), "Profile complete", "How many of the member's legal facts we have. Below 70%, a lawyer cannot advise well yet, so ask for what is missing."),
        say(hover("d_minutes"), "Minutes and calls left", "What is left of this month's membership: up to 60 minutes, in up to three calls."),
      ]),
      { target: "staff-queue" },
    ),
    step(
      "close-task",
      "Close it with an outcome",
      "When the job is done, write one line about what happened and close it. The line goes on the member's history, so anyone on the team can read it later.",
      scene(page(), [
        wait(300, [open("drawer")]),
        say(type("outcome", "Called José-Luis. He uploads the DIMEX copy by Friday."), "Outcome", "Write what happened in plain words: who you spoke to and what they promised. The team reads this later."),
        say(click("close", [shut("drawer"), hide("t1"), show("notice"), toastOn("toast")]), "Close task", "Marks this job as finished. It leaves your queue, your line goes on the member's timeline, and a short note confirms it worked."),
      ]),
    ),
    step(
      "attention",
      "Act on Needs attention",
      "The column on the right lists things that may slip if nobody acts: cases waiting too long, legal dates coming up, and price offers nobody has answered.",
      scene(page(), [
        say(hover("a1"), "Overdue matters", "Legal jobs that have stayed in one step longer than they should. Sixteen days is too long, so find out what is blocking it."),
        say(hover("a3"), "Obligations due in 14 days", "A legal date coming up for a member, here a yearly company tax return. Remind them in good time."),
        say(click("a4", [mark("a4")]), M.chloe, "She got a price for extra legal work seven days ago and has not answered. Click to open her page and follow up.", ["quote"]),
      ]),
      { target: "staff-attention" },
    ),
    step(
      "team",
      "See the whole team's queue",
      "Mine shows only your jobs. Everyone shows the whole team's jobs with each owner's email, so you can help when a colleague is away.",
      scene(page(), [
        say(hover("mine"), "Mine", "Shows only the jobs given to you. This is the normal view when you start your day."),
        say(
          click("everyone", [
            set("everyone", { variant: "secondary" }),
            set("mine", { variant: "ghost" }),
            set("qtitle", { text: "Team queue" }),
            set("t1", { meta: `${M.joseLuis} · ${TEAM.csmEmail}` }),
            set("t2", { meta: `${M.imani} · ${TEAM.csm2Email}` }),
          ]),
          "Everyone",
          "Shows every job on the team. Each row now names its owner, so you can cover for a colleague who is away.",
        ),
      ]),
    ),
  ],
};

export default staffToday;
