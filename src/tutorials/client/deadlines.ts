import type { Tutorial } from "../../components/tutorial/types";
import {
  btn,
  card,
  click,
  dateIn,
  drawer,
  hidden,
  hover,
  input,
  list,
  mark,
  meta,
  mockShell,
  open,
  p,
  row,
  say,
  scene,
  set,
  show,
  shut,
  stack,
  step,
  text,
  toast,
  toastOn,
  toggle,
  type,
} from "../presets";

/**
 * DEADLINES: /status/deadlines. Example member in Costa Rica with a car and a
 * house. Facts match the page: groups Coming up, Later, Needs a date and
 * Done; reminders 30 and 7 days before; "Add more deadlines" uses the same
 * Include and Skip cards as the free check.
 */

const comingUp = card(
  "Coming up",
  [
    list(
      [
        { id: "marchamo", lead: dateIn(64), title: "Vehicle circulation permit (marchamo)", meta: "Vehicle · From the free check", pill: p("May require review") },
        { id: "tax", lead: dateIn(80), title: "Municipal property tax", meta: "Property · From the free check", pill: p("Your date", "info") },
      ],
      "rows",
      "soon",
    ),
    row([btn("Change date", "secondary", "change", "sm"), btn("Mark done", "secondary", "done", "sm"), btn("Remove", "ghost", "remove", "sm")], "start"),
    toggle("Remind me by email", true, "remind"),
  ],
  { id: "soonCard" },
);

const needsDate = card(
  "Needs a date",
  [
    text("Vehicle inspection (RTV)", "strong"),
    meta("Set a date", "rtvdate"),
    row([btn("Set a date", "primary", "set", "sm")], "start"),
    hidden(stack([input("Your date", { id: "date", placeholder: "mm/dd/yyyy" }), row([btn("Save date", "primary", "save", "sm")], "start")], 2, "editor")),
  ],
  { id: "needs" },
);

const pickerDrawer = drawer(
  "picker",
  "Add more deadlines",
  [
    meta("Legal dates and duties in Costa Rica that are not on your list yet."),
    card("Employment tax for a household employee", [meta("Matches your answers"), row([btn("Include", "primary", "inc", "sm"), btn("Skip", "secondary", "skip", "sm")], "start")], { id: "pcard" }),
    row([meta("1 selected", "pcount"), btn("Add 1 deadline", "primary", "add", "sm")], "between"),
  ],
  "Each one may require review.",
);

function page() {
  return mockShell(
    "client",
    "Deadlines",
    stack([row([btn("Add more deadlines", "primary", "addmore")], "start"), comingUp, needsDate], 4),
    {
      title: "Your deadlines",
      overlays: [pickerDrawer, toast("added", "Added 1 deadline."), toast("removed", "Removed: Municipal property tax. Undo")],
    },
  );
}

export const clientDeadlines: Tutorial = {
  id: "client.deadlines",
  version: 1,
  title: "Your deadlines",
  summary: "Set a date for each deadline, get reminders, and add or remove deadlines.",
  audience: ["client"],
  route: "/status/deadlines",
  steps: [
    step(
      "dates",
      "Set a date for each deadline",
      "Each deadline shows its date. When we could not work one out, it waits under Needs a date until you set it.",
      scene(page(), [
        say(hover("soon", [mark("soon")]), "Coming up", "Deadlines in the next 90 days, soonest first. Each one may require review by a lawyer."),
        say(click("set", [mark("soon", false), show("editor")]), "Set a date", "Opens a date box for this deadline. If we suggest a date, one press uses it."),
        say(type("date", "03/15/2027"), "Your date", "Type the date that fits your case, for example from your plate number or a letter you got."),
        say(click("save", [set("rtvdate", { text: "March 15, 2027" })]), "Save date", "Saves your date. We email you 30 and 7 days before it."),
      ]),
      { target: "client-deadlines-list" },
    ),
    step(
      "add",
      "Add more deadlines",
      "Add more deadlines shows the same cards as the free check. Include the ones that apply to you and skip the rest.",
      scene(page(), [
        say(click("addmore", [open("picker")]), "Add more deadlines", "Opens a panel with the dates in your country that are not on your list yet."),
        say(click("inc", [mark("pcard")]), "Include", "Puts this card on your list. Skip leaves it out. You can change your mind before you save."),
        say(click("add", [shut("picker"), toastOn("added")]), "Add 1 deadline", "Saves the cards you included. They appear on your list straight away."),
      ]),
      { target: "client-deadlines-add" },
    ),
    step(
      "keep",
      "Mark done, turn off reminders or remove",
      "Keep the list true to your life. Nothing is lost: a removed deadline can come back from Add more deadlines.",
      scene(page(), [
        say(hover("done"), "Mark done", "Moves the deadline to Done once it is handled, so it stops sending reminders."),
        say(click("remind", [set("remind", { on: false })]), "Remind me by email", "Turns the 30-day and 7-day emails off for this one deadline."),
        say(click("remove", [toastOn("removed")]), "Remove", "Takes a deadline that does not apply to you off the list. Press Undo in the note to bring it back."),
      ]),
    ),
  ],
};

export default clientDeadlines;
