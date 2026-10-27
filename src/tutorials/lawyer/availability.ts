import type { Tutorial } from "../../components/tutorial/types";
import { btn, card, chip, click, dateIn, grid, hover, input, mark, meta, mockShell, pill, row, scene, scroll, set, show, stack, step, text, timeRange, toggle, type, wait, hidden, list } from "../presets";

const weekly = card(
  "Weekly hours",
  [
    row([text("Monday", "strong"), timeRange("9:00 am", "12:00 pm"), timeRange("2:00 pm", "5:00 pm")], "start", 3),
    row([text("Tuesday", "strong"), timeRange("9:00 am", "1:00 pm", undefined, "tue")], "start", 3),
    row([text("Wednesday", "strong"), meta("Unavailable"), btn("Add hours", "ghost", "addwed", "sm"), hidden(timeRange("9:00 am", "12:00 pm", undefined, "wed"))], "start", 3, "wedrow"),
    row([text("Thursday", "strong"), timeRange("2:00 pm", "6:00 pm")], "start", 3),
  ],
  { id: "weekly" },
);

const daysOff = card(
  "Days off",
  [
    meta("No calls are offered on these dates."),
    row([input("Add a day off", { placeholder: "Pick a date", id: "dayoff" }), btn("Add day off", "secondary", "adddayoff", "sm")], "start"),
    list([{ id: "d1", title: dateIn(30), meta: "Planned day off" }, { id: "d2", title: dateIn(31), meta: "Planned day off", hidden: true }], "plain", "daysoff"),
  ],
  { id: "daysoffcard" },
);

const limits = card(
  "Limits",
  [
    grid("1-1", [input("Minimum notice before a call", { value: "24 hours", select: true, id: "notice" }), input("Most calls in one day", { value: "4", id: "maxcalls" })]),
  ],
  { id: "limits" },
);

const specialties = card(
  "Specialties",
  [
    text("Legal areas you take", "label"),
    row([chip("Corporate", true, "a_corp"), chip("Property", true, "a_prop"), chip("Immigration", false, "a_imm"), chip("Tax", false, "a_tax"), chip("Family and estate", false, "a_fam")], "start", 1),
    meta("Members without an assigned lawyer are routed by these."),
  ],
  { id: "specialties" },
);

const gcal = card("Google Calendar", [toggle("Block times that are busy in this calendar", true, "busy"), input(undefined, { value: "you@yourfirm.cr" })], { id: "gcal" });

function page() {
  return mockShell(
    "lawyer",
    "Availability",
    stack([grid("3-2", [stack([weekly, daysOff], 3), stack([limits, specialties, gcal], 3)])]),
    { title: "Your hours", actions: [hidden(pill("Unsaved changes", "warning", "dirty")), btn("Save hours", "primary", "save", "sm")] },
  );
}

export const lawyerAvailability: Tutorial = {
  id: "lawyer.availability",
  version: 1,
  title: "Availability",
  summary: "The hours, days off and areas members can book.",
  audience: ["lawyer"],
  route: "/lawyer/availability",
  steps: [
    step(
      "weekly",
      "Set your weekly hours",
      "Add one or more time windows per day. Members see 20-minute slots inside these windows only.",
      scene(page(), [click("addwed", [show("wed"), set("addwed", { hidden: true }), show("dirty")], "Add hours"), click("tue", [set("tue", { to: "3:00 pm" })], "Tuesday hours"), wait(700)]),
      { target: "lawyer-availability-weekly" },
    ),
    step(
      "daysoff",
      "Block days off",
      "Add a date and no calls are offered that day. Planned days off are listed below.",
      scene(page(), [
        click("dayoff", [set("dayoff", { value: dateIn(31) })], "Add a day off"),
        click("adddayoff", [show("d2"), set("dayoff", { value: "" }), show("dirty")], "Add day off"),
        wait(800),
      ]),
    ),
    step(
      "limits",
      "Limit notice and daily calls",
      "Minimum notice stops last-minute bookings. Most calls in one day caps your load.",
      scene(page(), [click("notice", [set("notice", { value: "48 hours" }), show("dirty")], "Minimum notice"), type("maxcalls", "3"), wait(500)]),
    ),
    step(
      "areas",
      "Choose your areas and save",
      "Pick the legal areas you take; unassigned members are routed by them. Turn on Google Calendar so busy times are blocked. Then Save hours.",
      scene(page(), [
        click("a_imm", [set("a_imm", { selected: true }), show("dirty")], "Immigration"),
        hover("busy", [], 700),
        click("save", [set("save", { label: "Saved" }), set("dirty", { hidden: true })], "Save hours"),
        wait(900),
      ]),
    ),
  ],
};

export default lawyerAvailability;
