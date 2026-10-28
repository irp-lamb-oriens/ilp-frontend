import type { Tutorial } from "../../components/tutorial/types";
import { MEMBERS as M, btn, card, chip, click, dateIn, grid, hidden, hover, input, list, mark, meta, mockShell, pill, row, say, scene, set, show, stack, stat, step, table, text, timeRange } from "../presets";

/**
 * "Your hours and your fees", for lawyers on the /attorneys landing: weekly
 * hours, notice and days off, legal areas, then the Finance page. Same layout
 * as lawyer.availability and lawyer.finance. The figures are example data.
 */

const hoursPage = mockShell(
  "lawyer",
  "Availability",
  grid("3-2", [
    stack(
      [
        card(
          "Weekly hours",
          [
            row([text("Tuesday", "strong"), timeRange("9:00 am", "12:00 pm")], "start", 3),
            row([text("Wednesday", "strong"), meta("Unavailable"), btn("Add hours", "ghost", "addwed", "sm"), hidden(timeRange("2:00 pm", "5:00 pm", undefined, "wed"))], "start", 3),
            row([text("Thursday", "strong"), timeRange("2:00 pm", "6:00 pm")], "start", 3),
          ],
          { id: "weekly" },
        ),
        card("Days off", [meta("No calls are offered on these dates."), list([{ id: "d1", title: dateIn(30), meta: "Holiday" }], "plain", "daysoff")], { id: "daysoffcard" }),
      ],
      3,
    ),
    stack(
      [
        card("Limits", [input("Minimum notice before a call", { value: "24 hours", select: true, id: "notice" }), input("Most calls in one day", { value: "4", id: "maxcalls" })], { id: "limits" }),
        card("Legal areas you take", [row([chip("Property", true, "a_prop"), chip("Company", true, "a_corp"), chip("Immigration", false, "a_imm")], "start", 1)], { id: "areas" }),
      ],
      3,
    ),
  ]),
  { title: "Your hours", actions: [hidden(pill("Unsaved changes", "warning", "dirty")), btn("Save hours", "primary", "save", "sm")] },
);

const financePage = mockShell(
  "lawyer",
  "Finance",
  stack([
    meta("Example figures. Your fees come from the quotes you write for paid work.", "note"),
    grid("1-1-1", [stat("Paid to you", "US$650", { hint: "1 matter", id: "paid" }), stat("Pending", "US$950", { hint: "1 matter", id: "pending" }), stat("Next payout", dateIn(9), { id: "next" })]),
    table(
      ["Matter", "Member", "Your fee", "Status"],
      [
        { id: "m1", cells: ["Residency renewal", M.asa, "US$650", pill("Paid to you", "success")] },
        { id: "m2", cells: ["Will and estate plan", M.chloe, "US$950", pill("Pending", "warning")] },
      ],
      "bymatter",
    ),
  ]),
  { title: "Finance" },
);

export const publicLawyerHours: Tutorial = {
  id: "public.lawyer-hours",
  version: 1,
  title: "Your hours and your fees",
  summary: "You decide when members can book you and which areas you take. Finance shows your own fees for paid work.",
  audience: ["public"],
  autoStart: "never",
  steps: [
    step(
      "hours",
      "Set your weekly hours",
      "Members can book you only inside the hours you set. Each opening becomes 20-minute times they can pick.",
      scene(hoursPage, [
        say(click("addwed", [show("wed"), set("addwed", { hidden: true }), show("dirty")]), "Add hours", "Adds Wednesday afternoon. Members now see open times on Wednesdays too.", ["availability", "slot"]),
        say(hover("daysoff"), "Days off", "Add a date when you are away, and no calls are offered that day.", ["blackoutDate"]),
      ]),
    ),
    step(
      "limits",
      "Choose notice and areas",
      "Set how much notice you need and the most calls in a day. Then pick the kinds of law you take.",
      scene(hoursPage, [
        say(click("notice", [set("notice", { value: "48 hours" }), show("dirty")]), "Minimum notice", "Members cannot book a call that starts sooner than this."),
        say(click("a_imm", [set("a_imm", { selected: true })]), "Immigration", "Members without an assigned lawyer are matched by these areas.", ["legalArea"]),
        say(click("save", [set("save", { label: "Saved" }), set("dirty", { hidden: true })]), "Save hours", "Keeps your changes. Members see the new times when they book."),
      ]),
    ),
    step(
      "fees",
      "See your fees",
      "Finance shows only your own fees for paid work. You see what has been paid to you and what is still pending.",
      scene(financePage, [
        say(hover("note", [mark("note")]), "Example figures", "These numbers are an example. Your fees depend on the work you quote and the member accepts.", ["quote"]),
        say(hover("m2", [mark("note", false), mark("m2")]), "Will and estate plan", "Pending means the member accepted the work and the fee has not been paid out to you yet.", ["payout"]),
        say(hover("next", [mark("m2", false), mark("next")]), "Next payout", "The date of the next payment from ILP to you."),
      ]),
    ),
  ],
};

export default publicLawyerHours;
