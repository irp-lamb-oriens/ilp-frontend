import type { Tutorial } from "../../components/tutorial/types";
import {
  LAWYERS as L,
  MEMBERS as M,
  btn,
  click,
  h3,
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
  row,
  say,
  scene,
  set,
  show,
  stack,
  step,
  table,
  tabs,
  timeRange,
  type,
} from "../presets";

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
    row([h3("Members without a lawyer"), btn("Auto-assign by score", "secondary", "auto", "sm")], "between"),
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
  version: 3,
  title: "Lawyers",
  summary: "How busy each partner lawyer is, their hours, and who gets new members.",
  audience: ["staff"],
  route: "/dashboard/lawyers",
  steps: [
    step(
      "capacity",
      "Check who has room",
      "Partner lawyers are the Costa Rican lawyers who take members' calls. Capacity shows how busy each one is, so new members go to someone with room.",
      scene(page(), [
        say(hover("l2", [mark("l2")]), L.mauricio, "Eleven open matters and four waiting too long. He is very busy, so give new members to someone else this week."),
        say(hover("l3", [mark("l2", false), mark("l3")]), L.daniela, "Only four open matters and five calls this week. She has room for new members in immigration and family law."),
        say(hover("tab_dir", [mark("l3", false)]), "Directory", "Contact details for every partner lawyer, for when you need to reach one directly."),
      ]),
    ),
    step(
      "hours",
      "Set a lawyer's hours",
      "Each lawyer has weekly hours when members can book calls with them. You can change them here, for example when a lawyer asks you by email.",
      scene(page(), [
        say(click("tab_hours", [set("views", { active: "Hours" }), hide("capacity"), show("hours")]), "Hours", "Shows one lawyer's weekly hours. Members can only book calls inside these times.", ["availability"]),
        say(click("wed", [set("wed", { to: "4:00 pm" })]), "Wednesday hours", "Click a time to change it. Here Wednesday now ends at 4:00 pm instead of noon."),
        say(click("save_hours", [set("save_hours", { label: "Saved" })]), "Save hours", "Keeps the change. Members see the new free times when they book."),
      ]),
    ),
    step(
      "assign",
      "Give new members a lawyer",
      "Every member needs a lawyer. Assignment lists members who do not have one yet, oldest first, so nobody waits too long.",
      scene(page(), [
        say(click("tab_assign", [set("views", { active: "Assignment" }), hide("capacity"), show("assignment")]), "Assignment", "Lists members who joined but have no lawyer yet. The number shows how many days they have waited."),
        say(hover("u1", [mark("u1")]), M.dmitri, "He has waited four days and needs help with immigration. Pick a lawyer who covers that."),
        say(click("assign", [hide("u1")]), "Assign", "Gives the member to the lawyer picked in the box. He leaves this list and appears in that lawyer's list."),
        say(hover("auto"), "Auto-assign by score", "Lets the system choose for you, matching each member's kind of case to a lawyer with room."),
      ]),
    ),
  ],
};

export default staffLawyers;
