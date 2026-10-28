import type { Tutorial } from "../../components/tutorial/types";
import {
  LAWYERS as L,
  btn,
  card,
  chip,
  click,
  dayIn,
  hidden,
  hide,
  hover,
  input,
  mark,
  meta,
  mockShell,
  open,
  row,
  say,
  scene,
  set,
  show,
  stack,
  step,
  text,
  toggle,
  type,
  wait,
} from "../presets";

const times = row(
  [chip("9:00 am", false, "t1"), chip("9:20 am", false, "t2"), chip("10:30 am", false, "t3"), chip("2:00 pm", false, "t4"), chip("2:20 pm", false, "t5")],
  "start",
  1,
  "times",
);

const form = stack(
  [
    card("What would you like to ask?", [
      input(undefined, { multiline: true, placeholder: "For example: Do I need to file anything for my S.A. before January?", id: "question" }),
      meta("Also added to this call from your list: Corporate tax return (D-101)", "also_added"),
    ]),
    card("Pick a time", [
      row([chip(dayIn(1), false, "d1"), chip(dayIn(2), false, "d2"), chip(dayIn(3), true, "d3"), chip(dayIn(6), false, "d4")], "start", 1),
      text("Time (your time zone)", "label", "tz"),
      times,
    ]),
    card("May the call be recorded?", [
      row([toggle("Yes, record it", false, "rec_yes", "checkbox"), toggle("No recording", false, "rec_no", "checkbox")], "start", 4),
      text("How recording and AI work", "meta", "how_ai"),
    ]),
    row([meta("This call uses 20 minutes and 1 call. Afterwards you will have 20 minutes and 1 call left this month."), btn("Book this call", "primary", "book")], "between", 3, "confirm"),
  ],
  3,
  "form",
);

const done = card(
  "Your call is booked",
  [text(`${dayIn(3)} · 10:30 am Costa Rica time`, "strong"), meta(`With ${L.andrea}. Your Google Meet link is coming by email.`), btn("Back to your overview", "secondary")],
  { tone: "accent", id: "done" },
);

function page() {
  return mockShell("client", "Overview", stack([form, hidden(done)]), { title: "Book a call" });
}

export const clientBook: Tutorial = {
  id: "client.book",
  version: 3,
  title: "Book a call",
  summary: "Write your question, pick a time and book your call.",
  audience: ["client"],
  route: "/status/book",
  steps: [
    step(
      "question",
      "Tell your lawyer what you want to ask",
      "One or two sentences is enough. Your lawyer reads your question, together with your profile, before the call.",
      scene(page(), [
        say(type("question", "Do I need to file anything for my S.A. before January?"), "Your question", "Write it in your own words. It helps your lawyer prepare, so your 20 minutes go further."),
        say(hover("also_added"), "Also added to this call", "A date you asked about earlier is added for you, so you do not forget to mention it."),
      ]),
      { target: "client-book-question" },
    ),
    step(
      "time",
      "Pick a day and a time",
      "Pick a day first, then one of the open times. Only times when your lawyer is free are shown.",
      scene(page(), [
        say(click("d3"), dayIn(3), "The days with open times. Pick the one that suits you."),
        say(hover("tz"), "Your time zone", "Times are shown in the time zone on your profile. Your lawyer sees the same call in their own time zone."),
        say(click("t3", [set("t3", { selected: true })]), "10:30 am", "Each button is a free 20-minute time. Pick one and it stays highlighted to show it is chosen."),
      ]),
      { target: "client-book-time" },
    ),
    step(
      "record",
      "Choose about recording",
      "You decide whether the call may be recorded. If you say yes, a written summary is drafted for your lawyer to check. You can change your mind before you join.",
      scene(page(), [
        say(hover("rec_no"), "No recording", "The call is not recorded and your lawyer takes notes instead. This choice is completely fine."),
        say(click("rec_yes", [set("rec_yes", { on: true })]), "Yes, record it", "Lets your lawyer record the call. A summary is drafted from it, and your lawyer checks it before you see it.", ["recordingConsent"]),
        say(hover("how_ai"), "How recording and AI work", "A short, plain explanation of what is recorded, who can see it and how the summary is made."),
      ]),
    ),
    step(
      "book",
      "Book the call",
      "Check how many minutes it uses, then book. You get an email with the link to the video call.",
      scene(page(), [
        wait(100, [set("t3", { selected: true }), set("rec_yes", { on: true }), set("question", { value: "Do I need to file anything for my S.A. before January?" })]),
        say(hover("confirm", [mark("confirm")]), "This call uses 20 minutes", "Each call uses 20 of your 60 monthly minutes and one of your three calls. Afterwards you have 20 minutes and 1 call left."),
        say(click("book", [hide("form"), show("done")]), "Book this call", "Books your call. A confirmation appears here, and an email with the video link follows.", ["videoLink"]),
      ]),
    ),
  ],
};

export default clientBook;
