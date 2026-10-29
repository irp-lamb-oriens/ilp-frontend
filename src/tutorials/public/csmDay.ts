import type { Tutorial } from "../../components/tutorial/types";
import { CSM_NAV, MEMBERS as M, btn, click, dateIn, deflist, drawer, grid, h2, hide, hover, input, list, mark, mockShell, open, p, say, scene, show, shut, stack, stat, step, text, toast, toastOn, type, wait } from "../presets";

/**
 * "Your day in the CSM portal", for the customer success landing
 * (/customer-success). Reuses the layout of the CSM portal's Today and
 * member page (csm.today) with placeholder members, and explains each part
 * for someone who has never seen the portal.
 */

const counts = grid("2-1-1-1", [
  stat("Late tasks", "2", { size: "lg", hint: "Start with these", id: "c_late" }),
  stat("Due today", "3", { hint: "4 later this week", id: "c_today" }),
  stat("New members, 7 days", "2", { hint: "1 waiting for a first contact", id: "c_new" }),
  stat("At risk", "1", { hint: "Health score under 50", id: "c_risk" }),
]);

const queue = list(
  [
    { id: "q1", pill: p("Payment", "danger"), title: "Payment failed: contact member", meta: `${M.linda} · At risk · 40`, pills: [p("Late 1 day", "danger")] },
    { id: "q2", pill: p("Onboarding", "info"), title: "Welcome call and profile review", meta: `${M.imani} · Watch · 71`, pills: [p("Today 4:00 pm", "warning")] },
    { id: "q3", pill: p("Follow-up", "neutral"), title: "Send the lawyer's next steps", meta: `${M.priya} · Healthy · 92`, pills: [p(`Due ${dateIn(1)}`)] },
  ],
  "rows",
  "queue",
);

function todayPage() {
  return mockShell("staff", "Today", stack([counts, stack([h2("Your tasks"), text("Closed: Payment failed: contact member", "meta", "notice"), queue], 2)]), {
    nav: CSM_NAV,
    title: "Today",
    overlays: [
      drawer(
        "drawer",
        "Payment failed: contact member",
        [
          deflist(
            [
              { term: "Health", value: "At risk · 40", id: "d_health" },
              { term: "Why", value: "Payment failed (minus 35). Last contact 31 days ago (minus 15). No call used yet (minus 10)." },
              { term: "Calls left", value: "3 of 3" },
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
      stack([h2(M.imani), text("Timeline: joined 2 days ago. Profile 52% complete.", "body")], 2),
      stack(
        [
          h2("Your actions"),
          text("Watch · 71", "label", "m_health"),
          input("What happened", { multiline: true, placeholder: "Welcome call. We filled in her residency and booked her first call.", id: "m_summary" }),
          btn("Log it", "primary", "m_log", "sm"),
          btn("Send email", "secondary", "m_send", "sm"),
        ],
        2,
        "actions",
      ),
    ]),
    { nav: CSM_NAV, title: M.imani, overlays: [toast("m_toast", "Contact logged. It is on the timeline.")] },
  );
}

export const publicCsmDay: Tutorial = {
  id: "public.csm-day",
  version: 1,
  title: "Your day in the CSM portal",
  summary: "Today shows your tasks, late ones first; each member has a health score with its reasons, and every contact is logged with one line.",
  audience: ["public"],
  autoStart: "never",
  steps: [
    step(
      "counts",
      "Read your day",
      "When you sign in, Today counts your late tasks and the ones due today. It also shows new members and members who need extra care.",
      scene(todayPage(), [
        say(hover("c_late", [mark("c_late")]), "Late tasks", "Tasks past their due time. You do these first."),
        say(hover("c_new", [mark("c_late", false)]), "New members", "Members who joined in the last 7 days. Each one gets a first contact within one business day.", ["firstContact"]),
        say(hover("c_risk"), "At risk", "Members whose health score is under 50. The pill next to each name says why.", ["healthScore"]),
      ]),
    ),
    step(
      "queue",
      "Close a task with one line",
      "Tasks are sorted with the late ones on top. Open one, see why the member's score is low, and write what happened when the job is done.",
      scene(todayPage(), [
        say(click("q1", [open("drawer")]), "Payment failed", "This task is a day late. The panel shows the member's health and the reasons behind it.", ["healthScore"]),
        say(type("outcome", "Called Linda. Her card expired; she updates it today."), "Outcome", "Who you spoke to and what they agreed, in plain words."),
        say(click("close", [shut("drawer"), hide("q1"), show("notice"), toastOn("toast")]), "Close task", "The task leaves your list and the outcome goes on the member's timeline."),
      ]),
    ),
    step(
      "member",
      "Log every contact",
      "On a member's page, Your actions logs calls and messages, sends a playbook email and creates tasks. The lawyer and the team read your line next.",
      scene(memberPage(), [
        wait(300),
        say(hover("m_health"), "Health with reasons", "The same pill as on Today, with every reason and the points it takes off."),
        say(type("m_summary", "Welcome call. We filled in her residency and booked her first call."), "What happened", "One line after every call, email or message."),
        say(click("m_log", [toastOn("m_toast")]), "Log it", "The contact goes on the timeline and counts toward your first-contact figure.", ["playbook"]),
      ]),
    ),
  ],
};

export default publicCsmDay;
