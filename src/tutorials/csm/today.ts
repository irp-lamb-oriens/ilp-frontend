import type { Tutorial } from "../../components/tutorial/types";
import {
  CSM_NAV,
  MEMBERS as M,
  btn,
  click,
  dateIn,
  deflist,
  drawer,
  grid,
  h2,
  hide,
  hover,
  input,
  list,
  mark,
  mockShell,
  open,
  p,
  say,
  scene,
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

/**
 * COMMS-P3: the CSM portal in one tutorial (Today, the health score, My book
 * and the member actions). Every CSM page intro opens it.
 */

const counts = grid("2-1-1-1", [
  stat("Late tasks", "2", { size: "lg", hint: "Start with these", id: "c_late" }),
  stat("Due today", "3", { hint: "4 later this week or after", id: "c_today" }),
  stat("New members, 7 days", "2", { hint: "1 still waiting for a first contact", id: "c_new" }),
  stat("At risk", "1", { hint: "Health score under 50", id: "c_risk" }),
]);

const queue = list(
  [
    { id: "q1", pill: p("Payment", "danger"), title: "Payment failed: contact member", meta: `${M.linda} · At risk · 38`, pills: [p("Overdue 1 day", "danger")] },
    { id: "q2", pill: p("Onboarding", "info"), title: "Welcome call and profile review", meta: `${M.imani} · Watch · 64`, pills: [p("Today 4:00 PM", "warning")] },
    { id: "q3", pill: p("Follow-up", "neutral"), title: "Send next steps and confirm with member", meta: `${M.priya} · Healthy · 92`, pills: [p(`Due ${dateIn(2)}`)] },
  ],
  "rows",
  "queue",
);

const rail = stack(
  [
    h2("New members"),
    list([{ id: "n1", title: M.imani, meta: "Joined yesterday", pill: p("First contact by today", "warning") }], "plain"),
    h2("At risk"),
    list([{ id: "r1", title: M.linda, meta: "Payment failed, and 2 more", pill: p("At risk · 38", "danger") }], "plain"),
  ],
  2,
  "rail",
);

function page() {
  return mockShell("staff", "Today", stack([counts, grid("2-1", [stack([h2("Your tasks"), text("Closed: Payment failed: contact member", "meta", "notice"), queue], 2), rail])]), {
    nav: CSM_NAV,
    title: "Today",
    overlays: [
      drawer(
        "drawer",
        "Payment failed: contact member",
        [
          deflist(
            [
              { term: "Health", value: "At risk · 38", id: "d_health" },
              { term: "Why", value: "Payment failed (minus 35). Last contact 31 days ago (minus 15)." },
              { term: "Calls left", value: "2 of 3" },
            ],
            "d_facts",
          ),
          input("Outcome", { multiline: true, placeholder: "Called Linda. Her card expired; she updates it today.", id: "outcome" }),
          btn("Close task", "primary", "close"),
        ],
        `Payment · ${M.linda}`,
      ),
      toast("toast", "Closed: Payment failed: contact member"),
    ],
  });
}

function memberPage() {
  return mockShell(
    "staff",
    "My book",
    grid("2-1", [
      stack([h2(M.linda), text("Timeline: payment failed yesterday. Last call 31 days ago.", "body")], 2),
      stack(
        [
          h2("Your actions"),
          text("At risk · 38", "label", "m_health"),
          input("What happened", { multiline: true, placeholder: "Called Linda. Card expired; she updates it today.", id: "m_summary" }),
          btn("Log it", "primary", "m_log", "sm"),
          btn("Send email", "secondary", "m_send", "sm"),
        ],
        2,
        "actions",
      ),
    ]),
    { nav: CSM_NAV, title: M.linda, overlays: [toast("m_toast", "Contact logged. It is on the timeline.")] },
  );
}

export const csmToday: Tutorial = {
  id: "csm.today",
  version: 1,
  title: "Your CSM portal",
  summary: "Your day, the health score, your book and what to log after each contact.",
  audience: ["staff"],
  route: "/csm",
  steps: [
    step(
      "counts",
      "Read your day",
      "The figures on top count your late tasks and the ones due today. They also show new members and members at risk.",
      scene(page(), [
        say(hover("c_late", [mark("c_late")]), "Late tasks", "Tasks past their due time. Do these first."),
        say(hover("c_new"), "New members", "Members who joined in the last 7 days. Each one needs a first contact within one business day.", ["firstContact"]),
        say(hover("c_risk"), "At risk", "Members whose health score is under 50. The pill next to each name says why.", ["healthScore"]),
      ]),
      { target: "csm-counts" },
    ),
    step(
      "queue",
      "Work your tasks, late ones first",
      "Your tasks are sorted with the late ones on top. Click one to see the member and the reasons behind their health score.",
      scene(page(), [
        say(hover("q2"), "A task", "Each row is one job: what to do, for which member, their health and when it is due."),
        say(click("q1", [open("drawer")]), "Payment failed", "This one is a day late. The panel shows the member's health and why it is low."),
        say(hover("d_health"), "Health", "A score from 0 to 100. A failed payment takes 35 points off, a month without contact 15.", ["healthScore"]),
      ]),
      { target: "csm-queue" },
    ),
    step(
      "close",
      "Close it with one line",
      "When the job is done, write what happened and close the task. Your line goes on the member's timeline for the whole team.",
      scene(page(), [
        wait(300, [open("drawer")]),
        say(type("outcome", "Called Linda. Her card expired; she updates it today."), "Outcome", "Who you spoke to and what they agreed, in plain words."),
        say(click("close", [shut("drawer"), hide("q1"), show("notice"), toastOn("toast")]), "Close task", "The task leaves your list and the outcome is saved."),
      ]),
    ),
    step(
      "member",
      "Log every contact on the member page",
      "On a member's page, Your actions logs calls and messages, sends a playbook email and creates tasks. Logging resets the days since contact.",
      scene(memberPage(), [
        say(hover("m_health"), "Health with reasons", "The same pill, with every reason listed and the points it takes off."),
        say(type("m_summary", "Called Linda. Card expired; she updates it today."), "What happened", "One line after every call, email or message."),
        say(click("m_log", [toastOn("m_toast")]), "Log it", "The contact goes on the timeline and counts toward your first-contact and follow-up figures.", ["playbook"]),
      ]),
      { target: "csm-member-actions" },
    ),
  ],
};

export default csmToday;
