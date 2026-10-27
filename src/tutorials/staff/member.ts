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
  open,
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
  timeline,
  toast,
  toastOn,
  type,
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
  ], "facts"),
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
      "handoff_legal",
    ),
    text("Commercial notes (staff only, never shown to the member or lawyer)", "label"),
    text("Wants a fixed price for the clean-up before listing the house.", "body", "handoff_notes"),
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
        ], "mem_used"),
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
      grid("1-2", [stack([profile, card("Lawyer", [text(L.andrea, "strong"), meta("Corporate, Property")], { id: "lawyer_card" })]), stack([h3("Timeline"), filters, events, handoff], 3)]),
      actions,
    ]),
    { overlays: [toast("toast", "Call booked. Both sides get an email.")] },
  );
  return root;
}

export const staffMember: Tutorial = {
  id: "staff.member",
  version: 2,
  title: "Member page",
  summary: "One member: their facts, their history and what to do next.",
  audience: ["staff"],
  route: "/dashboard/members/[id]",
  steps: [
    step(
      "header",
      "Check status and readiness first",
      "The top of the page tells you if this member is paid up and ready for a call. Their living profile, the facts about their legal life, is on the left.",
      scene(page(), [
        say(hover("completeness", [mark("completeness")]), "Profile", "How much we know about this member's legal situation. At 70% or more they are ready for a call; he is at 82%."),
        say(hover("facts", [mark("completeness", false)]), "Profile facts", "Residency, property, company and car, as the member told us. The lawyer reads these before every call."),
        say(hover("lawyer_card"), "Lawyer", "The partner lawyer who handles this member's legal questions, and the kinds of law they cover."),
      ]),
      { target: "staff-member-head" },
    ),
    step(
      "timeline",
      "Filter the timeline",
      "The timeline lists everything that happened with this member, newest first: calls, notes, jobs and prices. The small buttons above it filter it.",
      scene(page(), [
        say(hover("e1"), "Call completed", "Every call, note, job and price is one line here, with its date. Everyone on the team sees the same history."),
        say(
          click("f_quotes", [set("f_quotes", { selected: true }), set("f_all", { selected: false }), hide("e1"), hide("e2"), hide("e3"), hide("e5")]),
          "Quotes",
          "Shows only price offers for extra legal work. The other lines are hidden, not deleted.",
        ),
        say(click("f_all", [set("f_all", { selected: true }), set("f_quotes", { selected: false }), show("e1"), show("e2"), show("e3"), show("e5")]), "Everything", "Shows the whole history again."),
      ]),
      { target: "staff-member-timeline" },
    ),
    step(
      "handoff",
      "Turn a handoff into follow-up",
      "After each call the lawyer confirms the next steps. You see them here, next to private sales notes, and turn paid work into a job with an owner.",
      scene(page(), [
        say(hover("handoff_legal"), "Legal next steps", "Written and approved by the lawyer. You cannot change them, and the member sees them too."),
        say(hover("handoff_notes"), "Commercial notes", "Private notes about money and sales, for the ILP team only. The member and the lawyer never see them."),
        say(click("proposal", [hide("proposal"), show("proposal_done")]), "Create proposal task", "Makes a job to send the member a price for this extra work, with an owner and a due date, so it is not forgotten."),
      ]),
    ),
    step(
      "book",
      "Book a call for the member",
      "You can book a call for a member, for example when they phone or write to you. Pick a time, add their question and book.",
      scene(page(), [
        scroll("bookcard"),
        say(click("b_time", [set("b_time", { value: `${dateIn(3)}, 10:30 am` })]), "Date and time", "Pick a free time with the lawyer. Times show in your own local time, so check it if the member lives elsewhere."),
        say(type("b_q", "Can I sell the house before the S.A. books are fixed?"), "What they want to ask", "The member's question in their own words. The lawyer reads it before the call."),
        say(click("book", [toastOn("toast")]), "Book 20 minutes", "Books the call and emails both the member and the lawyer. The 20 minutes come off this month's membership."),
      ]),
    ),
    step(
      "payment",
      "Record a payment",
      "Some members pay by bank transfer or by SINPE, Costa Rica's instant bank payment. When the money arrives, record it here.",
      scene(page(), [
        scroll("membership"),
        say(hover("mem_used"), "Minutes and calls used", "How much of this month's membership the member has used: minutes out of 60, and calls out of 3."),
        say(type("ref", "SINPE 8812-4471"), "Payment reference", "The number on the member's bank receipt. It lets anyone match this payment to the bank statement later."),
        say(click("paid", [set("paid", { label: "Renewal payment recorded", disabled: true })]), "Mark renewal paid", "Records that this month is paid, so the membership stays active. The new month starts on the renewal date."),
      ]),
    ),
  ],
};

export default staffMember;
