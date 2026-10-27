import type { Tutorial } from "../../components/tutorial/types";
import { LAWYERS as L, btn, card, chip, click, dayIn, hidden, hover, input, mark, meta, mockShell, row, scene, set, show, stack, step, text, toggle, type, wait, hide }  from "../presets";

const times = row(
  [chip("9:00 am", false, "t1"), chip("9:20 am", false, "t2"), chip("10:30 am", false, "t3"), chip("2:00 pm", false, "t4"), chip("2:20 pm", false, "t5")],
  "start",
  1,
  "times",
);

const form = stack(
  [
    card("When", [
      row([chip(dayIn(1), false, "d1"), chip(dayIn(2), false, "d2"), chip(dayIn(3), true, "d3"), chip(dayIn(6), false, "d4")], "start", 1),
      text("Time (Costa Rica time)", "label"),
      times,
    ]),
    card("Your question", [
      input(undefined, { multiline: true, placeholder: "For example: Do I need to file anything for my S.A. before January?", id: "question" }),
      meta("Also added to this call from your list: Corporate tax return (D-101)"),
    ]),
    card("May your lawyer record this call?", [
      row([toggle("Yes, record it", false, "rec_yes", "checkbox"), toggle("No recording", false, "rec_no", "checkbox")], "start", 4),
      text("How recording and AI work", "meta"),
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
  version: 1,
  title: "Book a call",
  summary: "Pick a time, write your question, book.",
  audience: ["client"],
  route: "/status/book",
  steps: [
    step(
      "time",
      "Pick a day and a time",
      "Times are shown in Costa Rica time. Pick a day, then one of the open times.",
      scene(page(), [click("d3", [], dayIn(3)), click("t3", [set("t3", { selected: true })], "10:30 am"), wait(700)]),
      { target: "client-book-time" },
    ),
    step(
      "question",
      "Tell your lawyer what you want to ask",
      "One or two sentences is enough. Your lawyer reads it, with your profile, before the call.",
      scene(page(), [type("question", "Do I need to file anything for my S.A. before January?"), wait(600)]),
    ),
    step(
      "record",
      "Choose about recording",
      "Say whether the call may be recorded. If you say yes, a summary is drafted for your lawyer to check. You can change this before you join.",
      scene(page(), [hover("rec_no", [], 700), click("rec_yes", [set("rec_yes", { on: true })], "Yes, record it"), wait(700)]),
    ),
    step(
      "book",
      "Book the call",
      "Check how many minutes it uses, then select Book this call. You get an email with the video link.",
      scene(page(), [
        wait(100, [set("t3", { selected: true }), set("rec_yes", { on: true }), set("question", { value: "Do I need to file anything for my S.A. before January?" })]),
        hover("confirm", [mark("confirm")], 900),
        click("book", [hide("form"), show("done")], "Book this call"),
        wait(1200),
      ]),
    ),
  ],
};

export default clientBook;
