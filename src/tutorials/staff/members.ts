import type { Tutorial } from "../../components/tutorial/types";
import {
  MEMBERS as M,
  TEAM,
  btn,
  click,
  dateIn,
  grid,
  hide,
  hover,
  input,
  mark,
  mockShell,
  open,
  pill,
  row,
  say,
  scene,
  set,
  show,
  stack,
  step,
  table,
  type,
  wait,
} from "../presets";

const rows = [
  { id: "r1", cells: [M.imani, pill("Active", "success"), pill("Ready", "success"), "20 of 60", dateIn(12), TEAM.csmEmail, "1"] },
  { id: "r2", cells: [M.joseLuis, pill("Past due", "danger"), pill("Not ready", "warning"), "40 of 60", dateIn(-3), TEAM.csmEmail, "2"] },
  { id: "r3", cells: [M.genevieve, pill("Active", "success"), pill("Ready", "success"), "0 of 60", dateIn(21), TEAM.csm2Email, "0"] },
  { id: "r4", cells: [M.dmitri, pill("Pending payment", "warning"), pill("Not ready", "warning"), "0 of 60", "—", "Unassigned", "1"] },
  { id: "r5", cells: [M.winona, pill("Active", "success"), pill("Ready", "success"), "60 of 60", dateIn(5), TEAM.csm2Email, "0"] },
];

function page() {
  return mockShell(
    "staff",
    "Members",
    stack([
      grid("2-1-1-1-1", [
        input("Search", { placeholder: "Name or email", id: "search" }),
        input("Membership", { value: "All", select: true, id: "f_status" }),
        input("CSM", { value: "Everyone", select: true, id: "f_csm" }),
        input("Readiness", { value: "All", select: true, id: "f_ready" }),
        input("Sort", { value: "Joined", select: true, id: "f_sort" }),
      ]),
      table(["Member", "Membership", "Profile", "Minutes used", "Renews", "CSM", "Open tasks"], rows, "table"),
      row([btn("Previous", "secondary", "prev", "sm"), btn("Next", "secondary", "next", "sm")], "end"),
    ]),
    { title: "Members" },
  );
}

export const staffMembers: Tutorial = {
  id: "staff.members",
  version: 2,
  title: "Members",
  summary: "Find a member, narrow the list and open their page.",
  audience: ["staff"],
  route: "/dashboard/members",
  steps: [
    step(
      "search",
      "Find a member",
      "The Members page lists everyone who pays for a membership. Type part of a name or email and the list shrinks to the matches as you type.",
      scene(page(), [
        say(type("search", "Okafor", [hide("r2"), hide("r3"), hide("r4"), hide("r5")]), "Search", "Type part of a member's name or email. The list below keeps only the people who match, while you type."),
        say(hover("r1"), M.imani, "The one match. Click a row to open that member's page with all their details."),
      ]),
      { target: "staff-members-filters" },
    ),
    step(
      "filter",
      "Narrow the list with filters",
      "The boxes above the list are filters. Each one hides the members who do not match, so you see only the group you need.",
      scene(page(), [
        say(click("f_status", [set("f_status", { value: "Past due", focused: true })]), "Membership", "Pick a payment status. Past due means the monthly payment date has passed and the money has not arrived."),
        wait(300, [set("f_status", { focused: false }), hide("r1"), hide("r3"), hide("r4"), hide("r5")]),
        say(hover("f_csm"), "CSM", "Shows only the members one team member looks after. Pick your own email to see your members."),
        say(hover("f_ready"), "Readiness", "Shows members who have not filled in enough of their profile yet. They need a friendly nudge before a call."),
        say(hover("r2"), M.joseLuis, "The only member past due right now. Contact him kindly about the payment."),
      ]),
    ),
    step(
      "read",
      "Read a row at a glance",
      "Each row is one member. Read it left to right: payment status, profile, minutes used this month, renewal date, who looks after them, and open jobs.",
      scene(page(), [
        say(hover("r2", [mark("r2")]), "Past due and not ready", "Two signs in one row: the payment is late and the profile is missing facts. This member may need a call soon."),
        say(hover("r4", [mark("r2", false), mark("r4")]), "Pending payment, unassigned", "He signed up but his first payment has not arrived, and nobody on the team looks after him yet."),
        say(hover("r5", [mark("r4", false)]), "60 of 60 minutes used", "She has used all of this month's call time. She can book again after her membership renews."),
      ]),
    ),
    step(
      "open",
      "Open a member's page",
      "Click a member to open their own page: their facts on the left, their history in the middle and the next jobs on the right.",
      scene(page(), [
        say(hover("next"), "Previous and Next", "The list shows a few members at a time. These buttons show the next or the previous group."),
        say(click("r3", [mark("r3")]), M.genevieve, "Click a row to open this member's full page, with everything about them in one place."),
      ]),
    ),
  ],
};

export default staffMembers;
