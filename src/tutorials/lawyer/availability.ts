import type { Tutorial } from "../../components/tutorial/types";
import {
  btn,
  card,
  chip,
  click,
  dateIn,
  grid,
  hidden,
  hover,
  input,
  list,
  meta,
  mockShell,
  pill,
  row,
  say,
  scene,
  set,
  show,
  stack,
  step,
  text,
  timeRange,
  toggle,
  type,
} from "../presets";

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
  version: 2,
  title: "Availability",
  summary: "The hours, days off and kinds of law members can book you for.",
  audience: ["lawyer"],
  route: "/lawyer/availability",
  steps: [
    step(
      "weekly",
      "Set your weekly hours",
      "Members can book you only inside the hours you set here. Add one or more time windows for each day; members see 20-minute times inside them.",
      scene(page(), [
        say(click("addwed", [show("wed"), set("addwed", { hidden: true }), show("dirty")]), "Add hours", "Opens a new time window on a day you had marked unavailable, here Wednesday morning."),
        say(click("tue", [set("tue", { to: "3:00 pm" })]), "Tuesday hours", "Click a time to change it. Tuesday now ends at 3:00 pm."),
        say(hover("dirty"), "Unsaved changes", "A reminder that your changes are not kept until you press Save hours."),
      ]),
      { target: "lawyer-availability-weekly" },
    ),
    step(
      "daysoff",
      "Block days off",
      "Add a date when you are away, and no calls are offered on that day.",
      scene(page(), [
        say(click("dayoff", [set("dayoff", { value: dateIn(31) })]), "Add a day off", "Pick a date when you are away, like a holiday.", ["blackoutDate"]),
        say(click("adddayoff", [show("d2"), set("dayoff", { value: "" }), show("dirty")]), "Add day off", "Adds the date to the list below. Members cannot book a call with you on it."),
      ]),
    ),
    step(
      "limits",
      "Limit notice and daily calls",
      "Two limits protect your time: how much warning you need before a call, and the most calls you take in one day.",
      scene(page(), [
        say(click("notice", [set("notice", { value: "48 hours" }), show("dirty")]), "Minimum notice before a call", "Members cannot book a call that starts sooner than this. 48 hours stops last-minute bookings."),
        say(type("maxcalls", "3"), "Most calls in one day", "Once you have this many calls on a day, no more are offered that day."),
      ]),
    ),
    step(
      "areas",
      "Choose your areas and save",
      "Pick the kinds of law you take. Members without a lawyer are matched to you by these. Then save.",
      scene(page(), [
        say(click("a_imm", [set("a_imm", { selected: true }), show("dirty")]), "Immigration", "Adds immigration to your areas, so members with residency questions can be sent to you.", ["legalArea"]),
        say(hover("busy"), "Google Calendar", "This switch keeps ILP in sync with your Google Calendar: times that are busy there are hidden from members.", ["toggle"]),
        say(click("save", [set("save", { label: "Saved" }), set("dirty", { hidden: true })]), "Save hours", "Keeps all your changes. Members see the new times when they book."),
      ]),
    ),
  ],
};

export default lawyerAvailability;
