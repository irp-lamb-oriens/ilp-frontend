import type { Tutorial } from "../../components/tutorial/types";
import { MEMBERS as M, TEAM, btn, click, dateIn, grid, hide, hover, input, mark, mockShell, pill, row, scene, set, stack, step, table, type, wait } from "../presets";

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
  version: 1,
  title: "Members",
  summary: "Find a member, filter the list, open a member page.",
  audience: ["staff"],
  route: "/dashboard/members",
  steps: [
    step(
      "search",
      "Find a member",
      "Type a name or email in Search. The list narrows as you type; the top bar search lands here too.",
      scene(page(), [type("search", "Okafor", [hide("r2"), hide("r3"), hide("r4"), hide("r5")]), wait(900)]),
      { target: "staff-members-filters" },
    ),
    step(
      "filter",
      "Filter by membership and readiness",
      "Use Membership to find Past due or Pending payment members, CSM to see your own book, and Readiness to find members who are not consultation-ready yet.",
      scene(page(), [
        click("f_status", [set("f_status", { value: "Past due", focused: true })], "Membership"),
        wait(300, [set("f_status", { focused: false }), hide("r1"), hide("r3"), hide("r4"), hide("r5")]),
        hover("r2"),
        wait(700),
      ]),
    ),
    step(
      "read",
      "Read a row at a glance",
      "Each row shows membership status, whether the profile is ready for a lawyer, minutes used of 60, the renewal date, the CSM and open tasks.",
      scene(page(), [hover("r2", [mark("r2")], 1000), hover("r4", [mark("r2", false), mark("r4")], 1000)]),
    ),
    step(
      "open",
      "Open the member page",
      "Select a member to open their page: profile, timeline and next actions in one place.",
      scene(page(), [hover("r1"), click("r3", [mark("r3")], M.genevieve), wait(800)]),
    ),
  ],
};

export default staffMembers;
