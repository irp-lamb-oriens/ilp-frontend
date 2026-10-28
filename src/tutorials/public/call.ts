import type { Tutorial } from "../../components/tutorial/types";
import { LAWYERS as L, TEAM, btn, card, chip, click, dateIn, dayIn, hidden, hover, input, list, mark, message, meta, mockShell, pill, row, say, scene, set, show, stack, step, text, toggle, type } from "../presets";

/**
 * "How a call with your lawyer works", for visitors on the homepage. Four
 * moments with placeholder data: booking, the call, the summary and next
 * steps the member receives, and the follow-up from the customer success
 * manager. Facts match the portal tutorials (client.book, client.messages,
 * lawyer.call): 20-minute video calls, recording only with consent, the
 * lawyer confirms the summary before the member sees it.
 */

const QUESTION = "Do I need to file anything for my S.A. before January?";

const bookPage = mockShell(
  "client",
  "Overview",
  stack([
    card("When", [
      row([chip(dayIn(1), false, "d1"), chip(dayIn(3), false, "d3"), chip(dayIn(6), false, "d6")], "start", 1),
      text("Time (Costa Rica time)", "label"),
      row([chip("9:00 am", false, "t1"), chip("10:30 am", false, "t2"), chip("2:20 pm", false, "t3")], "start", 1),
    ]),
    card("Your question", [input(undefined, { multiline: true, placeholder: "Write it in your own words", id: "question" })]),
    card("May your lawyer record this call?", [row([toggle("Yes, record it", false, "rec_yes", "checkbox"), toggle("No recording", false, "rec_no", "checkbox")], "start", 4)]),
    row([meta("This call uses 20 of your 60 minutes."), btn("Book this call", "primary", "book")], "between", 3),
    hidden(card("Your call is booked", [text(`${dayIn(3)} · 10:30 am Costa Rica time`, "strong"), meta("The video link is coming by email.")], { tone: "accent", id: "booked" })),
  ]),
  { title: "Book a call" },
);

const callPage = mockShell(
  "client",
  "Overview",
  stack([
    card(
      "Your call today",
      [
        row([text(`${L.andrea}`, "strong"), pill("20 minutes", "info")], "between"),
        meta("Video call in your web browser. Nothing to install on a computer."),
        btn("Join call", "primary", "join"),
      ],
      { id: "callcard" },
    ),
    card(
      "What your lawyer reads before the call",
      [
        list(
          [
            { id: "b1", title: "Your question", meta: QUESTION },
            { id: "b2", title: "Your profile", meta: "Pensionado residency, a house in Atenas held by an S.A., one car" },
            { id: "b3", title: "Dates coming up", meta: `Corporate tax return (D-101) around ${dateIn(40)}` },
          ],
          "rows",
        ),
      ],
      { id: "brief" },
    ),
  ]),
  { title: "Your call" },
);

const summaryPage = mockShell(
  "client",
  "Overview",
  stack([
    card(
      "Summary of your call",
      [
        row([meta(`${dayIn(-1)} · ${L.andrea}`), pill("Confirmed by your lawyer", "success", "confirmed")], "between"),
        text("Your S.A. owns your house, so it has a yearly tax return even if it earns nothing. The minute books should be brought up to date before you sell.", "body", "summary"),
      ],
      { id: "summarycard" },
    ),
    card(
      "Next steps",
      [
        list(
          [
            { id: "s1", title: "Send the minute books and share register", meta: `You · by ${dateIn(7)}` },
            { id: "s2", title: "Review the books and list what is missing", meta: `${L.andrea} · by ${dateIn(14)}` },
          ],
          "rows",
        ),
      ],
      { id: "steps" },
    ),
    meta("Minutes used 20 · 40 minutes left this month", "used"),
  ]),
  { title: "After your call" },
);

const followPage = mockShell(
  "client",
  "Messages",
  stack([
    message("team", `${TEAM.csm} · ILP team`, "Hi Linda, thanks for sending the minute books. Lic. Vargas is reviewing them. I will send you the proposal for the clean-up as soon as it is ready.", dayIn(0), "m1"),
    card(
      "Proposal for extra legal work",
      [row([text("S.A. clean-up before sale", "strong"), pill("Waiting for you", "warning")], "between"), meta("US$1,200 · quoted by your lawyer"), row([btn("Accept", "primary", "accept", "sm"), btn("Ask a question first", "secondary", "askq", "sm")], "start")],
      { id: "proposal" },
    ),
  ]),
  { title: "Messages" },
);

export const publicCall: Tutorial = {
  id: "public.call",
  version: 1,
  title: "How a call with your lawyer works",
  summary: "Book a time, talk with your lawyer, get a written summary and next steps, and let your ILP team follow up.",
  audience: ["public"],
  autoStart: "never",
  steps: [
    step(
      "book",
      "Book a time and write your question",
      "Pick a day and a time, write your question and choose whether the call may be recorded.",
      scene(bookPage, [
        say(click("d3"), dayIn(3), "Pick a day, then one of the open times. Only times when your lawyer is free are shown."),
        say(click("t2", [set("t2", { selected: true })]), "10:30 am", "Times are in Costa Rica time. Each call lasts 20 minutes."),
        say(type("question", QUESTION), "Your question", "One or two sentences in your own words. Your lawyer reads it before the call."),
        say(click("rec_yes", [set("rec_yes", { on: true })]), "Yes, record it", "You decide. If you say yes, a written summary is drafted from the recording. Saying no is fine too.", ["recordingConsent"]),
        say(click("book", [show("booked")]), "Book this call", "Books the call. An email with the video link follows."),
      ]),
    ),
    step(
      "call",
      "Talk with your lawyer",
      "Your lawyer is licensed in Costa Rica. Before the call, they read your question and your profile, so the 20 minutes go to your answer.",
      scene(callPage, [
        say(hover("b1", [mark("b1")]), "Your question", "What you wrote when you booked. Your lawyer has it in front of them."),
        say(hover("b2", [mark("b1", false), mark("b2")]), "Your profile", "Your residency, property, company and car, from your legal profile. You do not have to explain it all again."),
        say(click("join", [mark("b2", false), set("join", { label: "Opening…" })]), "Join call", "Opens the video call in your web browser at the time of the call."),
      ]),
    ),
    step(
      "summary",
      "Get a summary and next steps",
      "After the call you get a short written summary and a list of next steps. Your lawyer checks both before you see them.",
      scene(summaryPage, [
        say(hover("confirmed", [mark("summarycard")]), "Confirmed by your lawyer", "Your lawyer read and approved this summary. Nothing reaches you until they do."),
        say(hover("s1", [mark("summarycard", false), mark("s1")]), "Send the minute books", "A step for you, with a date. It also shows as the next step on your home page."),
        say(hover("used", [mark("s1", false)]), "Minutes used 20", "The call used 20 of your 60 minutes this month."),
      ]),
    ),
    step(
      "followup",
      "Your ILP team follows up",
      "Your customer success manager makes sure the next steps happen. If more legal work is needed, you get a written quote first.",
      scene(followPage, [
        say(hover("m1", [mark("m1")]), TEAM.csm, "Your customer success manager at ILP. She checks in on each next step, so nothing is left waiting.", ["csm"]),
        say(hover("proposal", [mark("m1", false), mark("proposal")]), "Proposal for extra legal work", "Work like filings or drafting is not part of the monthly fee. It has a written price, and nothing starts until you accept.", ["quote"]),
        say(hover("askq"), "Ask a question first", "Not sure yet? Ask your team or your lawyer before you decide."),
      ]),
    ),
  ],
};

export default publicCall;
