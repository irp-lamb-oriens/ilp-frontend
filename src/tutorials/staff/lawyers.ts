import type { Tutorial } from "../../components/tutorial/types";
import { LAWYERS as L, MEMBERS as M, btn, click, h3, hide, hover, input, list, mark, meta, mockShell, p, pill, row, scene, set, show, stack, step, table, tabs, timeRange, wait } from "../presets";

const capacity = table(
  ["Lawyer", "Areas", "Open matters", "Calls next 7 days"],
  [
    { id: "l1", cells: [L.andrea, "Corporate, Property", row([meta("7"), pill("2 aging", "warning")], "start"), "9"] },
    { id: "l2", cells: [L.mauricio, "Property, Tax", row([meta("11"), pill("4 aging", "danger")], "start"), "12"] },
    { id: "l3", cells: [L.daniela, "Immigration, Family", "4", "5"] },
  ],
  "capacity",
);

const hours = stack(
  [
    input("Lawyer", { value: L.daniela, select: true }),
    row([meta("Monday"), timeRange("9:00 am", "12:00 pm"), timeRange("2:00 pm", "5:00 pm")], "start"),
    row([meta("Tuesday"), timeRange("9:00 am", "1:00 pm")], "start"),
    row([meta("Wednesday"), timeRange("9:00 am", "12:00 pm", undefined, "wed")], "start"),
    row([btn("Save hours", "primary", "save_hours", "sm")], "start"),
  ],
  3,
  "hours",
);

const assignment = stack(
  [
    row([h3("Unassigned clients"), btn("Auto-assign by score", "secondary", "auto", "sm")], "between"),
    list(
      [
        { id: "u1", avatar: "auto", title: M.dmitri, meta: "Immigration · joined 4 days ago", pill: p("4 days") },
        { id: "u2", avatar: "auto", title: M.priya, meta: "Property · joined 2 days ago", pill: p("2 days") },
      ],
      "rows",
    ),
    row([input("Assign to…", { value: L.daniela, select: true, id: "assign_to" }), btn("Assign", "primary", "assign", "sm")], "start"),
  ],
  3,
  "assignment",
);

function page() {
  return mockShell(
    "staff",
    "Lawyers",
    stack([
      meta("Who has room for the next member, and who is carrying aging matters."),
      tabs(["Capacity", "Hours", "Assignment", "Directory"], "Capacity", "views", ["tab_cap", "tab_hours", "tab_assign", "tab_dir"]),
      capacity,
      { ...hours, hidden: true },
      { ...assignment, hidden: true },
    ]),
    { title: "Lawyers" },
  );
}

export const staffLawyers: Tutorial = {
  id: "staff.lawyers",
  version: 1,
  title: "Lawyers",
  summary: "Capacity, hours and assignment of partner lawyers.",
  audience: ["staff"],
  route: "/dashboard/lawyers",
  steps: [
    step(
      "capacity",
      "Check who has room",
      "Capacity lists each lawyer's open matters, how many are aging and their calls in the next 7 days. Give new members to the lawyer with room in the right area.",
      scene(page(), [hover("l2", [mark("l2")], 1100), hover("l3", [mark("l2", false), mark("l3")], 1000)]),
      { target: "staff-lawyers-tabs" },
    ),
    step(
      "hours",
      "Set a lawyer's hours",
      "On Hours, pick the lawyer and edit their weekly windows. Members only see times inside these hours.",
      scene(page(), [
        click("tab_hours", [set("views", { active: "Hours" }), hide("capacity"), show("hours")], "Hours"),
        click("wed", [set("wed", { to: "4:00 pm" })], "Wednesday hours"),
        click("save_hours", [set("save_hours", { label: "Saved" })], "Save hours"),
        wait(800),
      ]),
    ),
    step(
      "assign",
      "Assign unassigned members",
      "Assignment lists members without a lawyer, oldest first. Pick a lawyer and select Assign, or let Auto-assign by score match by area and load.",
      scene(page(), [
        click("tab_assign", [set("views", { active: "Assignment" }), hide("capacity"), show("assignment")], "Assignment"),
        hover("u1", [mark("u1")], 700),
        click("assign", [hide("u1")], "Assign"),
        wait(800),
      ]),
    ),
  ],
};

export default staffLawyers;
