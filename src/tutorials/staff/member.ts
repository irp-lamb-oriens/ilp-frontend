import type { Tutorial } from "../../components/tutorial/types";
import {
  LAWYERS as L,
  MEMBERS as M,
  btn,
  card,
  chip,
  click,
  dateIn,
  deflist,
  grid,
  h2,
  h3,
  hidden,
  hide,
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
  timeline,
  toast,
  toastOn,
  type,
  wait,
} from "../presets";

const profile = card("Living profile", [
  progress("Profile", 0.82, "Complete · consultation-ready", "success", "completeness"),
  deflist([
    { term: "Nationality", value: "Japan, US" },
    { term: "Residency", value: "Pensionado" },
    { term: "Residency expires", value: dateIn(74) },
    { term: "Property location", value: "Nosara, Guanacaste" },
    { term: "Company type", value: "S.A." },
    { term: "Owns a vehicle", value: "Yes" },
  ]),
]);

const filters = row(
  [
    chip("Everything", true, "f_all"),
    chip("Calls", false, "f_calls"),
    chip("Handoffs", false, "f_handoffs"),
    chip("Tasks", false, "f_tasks"),
    chip("Quotes", false, "f_quotes"),
    chip("Notes", false, "f_notes"),
    chip("Audit", false, "f_audit"),
  ],
  "start",
  1,
);

const events = timeline(
  [
    { id: "e1", title: "Call completed with Lic. Andrea Vargas", meta: `${dateIn(-2)} · 20 min`, state: "done" },
    { id: "e2", title: "Handoff confirmed: S.A. books to update", meta: dateIn(-2), state: "done" },
    { id: "e3", title: "Task closed: welcome call", meta: dateIn(-9), state: "done" },
    { id: "e4", title: "Quote sent: S.A. clean-up before sale", meta: dateIn(-1), state: "current" },
    { id: "e5", title: "Note: prefers WhatsApp after 3 pm", meta: dateIn(-12), state: "done" },
  ],
  "timeline",
);

const handoff = card(
  "Handoff review",
  [
    text("Legal next steps (lawyer-approved, read-only, visible to the member)", "label"),
    list(
      [
        { title: "Send the S.A. minute books and share register", meta: `Member · due ${dateIn(7)}`, pill: p("Member", "info") },
        { title: "Review the books and list what is missing", meta: `Lawyer · due ${dateIn(14)}`, pill: p("Lawyer") },
      ],
      "plain",
    ),
    text("Commercial notes (staff only, never shown to the member or lawyer)", "label"),
    text("Wants a fixed price for the clean-up before listing the house.", "body"),
    row([btn("Create proposal task", "secondary", "proposal", "sm"), hidden(pill("Proposal task open", "success", "proposal_done"))], "start"),
  ],
  { id: "handoff" },
);

const actions = stack(
  [
    card("Open tasks", [list([{ id: "task", title: "Send the S.A. clean-up proposal", pill: p("Proposal", "success"), pills: [p(`Due ${dateIn(2)}`)] }], "plain")]),
    card(
      "Book a call",
      [
        input("Lawyer", { value: L.andrea, select: true, id: "b_lawyer" }),
        input("Date and time (your local time)", { placeholder: "Pick a time", id: "b_time" }),
        input("What they want to ask", { placeholder: "Can I sell the house before the S.A. books are fixed?", id: "b_q", multiline: true }),
        btn("Book 20 minutes", "primary", "book"),
      ],
      { id: "bookcard" },
    ),
    card(
      "Membership",
      [
        row([pill("Active", "success"), meta(`Renews ${dateIn(18)}`)], "start"),
        deflist([
          { term: "Minutes used this period", value: "20 of 60" },
          { term: "Calls used", value: "1 of 3" },
        ]),
        input("Payment reference", { placeholder: "SINPE 8812-4471 or bank transfer id", id: "ref" }),
        btn("Mark renewal paid", "secondary", "paid", "sm"),
      ],
      { id: "membership" },
    ),
  ],
  3,
);

function page() {
  const root = mockShell(
    "staff",
    "Members",
    stack([
      row([text("All members", "meta"), text("›", "meta"), text(M.hiroshi, "meta")], "start", 1),
      row([h2(M.hiroshi), pill("Active", "success"), pill("Complete · consultation-ready", "success")], "start"),
      grid("1-2", [stack([profile, card("Lawyer", [text(L.andrea, "strong"), meta("Corporate, Property")])]), stack([h3("Timeline"), filters, events, handoff], 3)]),
      actions,
    ]),
    { overlays: [toast("toast", "Call booked. Both sides get an email.")] },
  );
  return root;
}

export const staffMember: Tutorial = {
  id: "staff.member",
  version: 1,
  title: "Member page",
  summary: "Profile, timeline and next actions for one member.",
  audience: ["staff"],
  route: "/dashboard/members/[id]",
  steps: [
    step(
      "header",
      "Check status and readiness first",
      "The header shows membership status and whether the profile is complete enough for a consultation (70% needed). The living profile sits on the left.",
      scene(page(), [hover("completeness", [mark("completeness")], 1200), wait(600)]),
      { target: "staff-member-head" },
    ),
    step(
      "timeline",
      "Filter the timeline",
      "Everything the member, lawyer and team did is on one timeline. Use the chips to show only calls, handoffs, tasks, quotes, notes or audit events.",
      scene(page(), [
        click("f_quotes", [set("f_quotes", { selected: true }), set("f_all", { selected: false }), hide("e1"), hide("e2"), hide("e3"), hide("e5")], "Quotes"),
        wait(900),
        click("f_all", [set("f_all", { selected: true }), set("f_quotes", { selected: false }), show("e1"), show("e2"), show("e3"), show("e5")], "Everything"),
      ]),
      { target: "staff-member-timeline" },
    ),
    step(
      "handoff",
      "Turn a handoff into follow-up",
      "Legal next steps come from the lawyer and are read-only. Commercial notes are yours: select Create proposal task so the paid work gets an owner and a due date.",
      scene(
        page(),
        [hover("handoff", [], 700), click("proposal", [hide("proposal"), show("proposal_done")], "Create proposal task"), wait(900)],
      ),
    ),
    step(
      "book",
      "Book a call for the member",
      "Pick the lawyer and a time, write the member's question, then select Book 20 minutes. The minutes come off the membership.",
      scene(page(), [
        scroll("bookcard"),
        click("b_time", [set("b_time", { value: `${dateIn(3)}, 10:30 am` })], "Date and time"),
        type("b_q", "Can I sell the house before the S.A. books are fixed?"),
        click("book", [toastOn("toast")], "Book 20 minutes"),
        wait(1000),
      ]),
      { target: "staff-member-actions" },
    ),
    step(
      "payment",
      "Record a payment",
      "When a member pays by bank transfer or SINPE, enter the reference and select Mark renewal paid. The new period starts on the renewal date.",
      scene(page(), [scroll("membership"), type("ref", "SINPE 8812-4471"), click("paid", [set("paid", { label: "Renewal payment recorded", disabled: true })], "Mark renewal paid"), wait(900)]),
    ),
  ],
};

export default staffMember;
