import type { Tutorial } from "../../components/tutorial/types";
import { btn, card, click, dateIn, grid, hidden, hide, hover, input, list, mark, meta, progress, row, say, scene, set, show, stack, step, text, toast, toastOn, toggle, type } from "../presets";

/**
 * The free deadline check, for visitors who have not signed up. No portal
 * shell: the check is a public page (/check). Facts match the live check:
 * free, no account, Costa Rica, about 2 minutes, dates worded as "may
 * require review".
 */

const question = stack(
  [
    meta("Free, no account needed"),
    progress("Check progress", 45, "Question 4 of 8"),
    stack(
      [
        text("Do you own property in Costa Rica?", "h2"),
        meta("A house, condo or land, in your own name or through a company."),
        stack([btn("Yes", "secondary", "own_yes"), btn("No", "secondary", "own_no")], 2),
      ],
      3,
      "q1",
    ),
    hidden(
      stack(
        [
          text("Do you have a Costa Rican company?", "h2"),
          meta("Many people hold a house or a car through an S.A. or an S.R.L."),
          stack(
            [btn("Yes, a sociedad anónima (S.A.)", "secondary", "corp_sa"), btn("Yes, a limitada (S.R.L.)", "secondary", "corp_srl"), btn("No", "secondary", "corp_no")],
            2,
          ),
        ],
        3,
        "q2",
      ),
    ),
  ],
  4,
);

const results = stack(
  [
    text("These dates may require review", "h2"),
    meta("General dates based on your answers. They are not legal advice."),
    card(
      undefined,
      [
        list(
          [
            { id: "f1", lead: dateIn(49), title: "DIMEX renewal may require review", meta: "Residency" },
            { id: "f2", lead: dateIn(80), title: "Corporate tax return (D-101) may require review", meta: "Your S.A." },
            { id: "f3", lead: "Dec 31", title: "Vehicle circulation permit (marchamo) may require review", meta: "Your car" },
          ],
          "rows",
          "findings",
        ),
      ],
      { id: "list" },
    ),
    row([meta("A lawyer can confirm which ones apply. ILP members get that on a call."), btn("Join ILP", "primary", "join", "sm")], "between", 3, "cta"),
  ],
  4,
);

// DEADLINES: choose what applies, then save the deadlines to a free account.
const choose = stack(
  [
    text("Include the ones that apply to you", "h2"),
    meta("Items with a date start included. Items with no fixed date start skipped."),
    grid("1-1", [
      card(dateIn(64), [text("Marchamo (vehicle permit)", "strong"), meta("May require review"), row([btn("Include", "primary", "inc1", "sm"), btn("Skip", "secondary", "skip1", "sm")], "start")], { id: "c1" }),
      card("No fixed date", [text("Keep company books up to date", "strong"), meta("May require review"), row([btn("Include", "secondary", "inc2", "sm"), btn("Skip", "primary", "skip2", "sm")], "start")], { id: "c2" }),
    ]),
    row([meta("1 item selected", "count"), btn("Set the deadlines for each", "primary", "setall", "sm")], "between", 3, "bar"),
    hidden(
      stack(
        [
          input("Email", { id: "cemail", placeholder: "you@example.com" }),
          toggle("I agree to the Terms and the Privacy Policy", false, "agree", "checkbox"),
          row([btn("Save my deadlines", "primary", "save", "sm")], "start"),
        ],
        3,
        "claimform",
      ),
    ),
    toast("codesent", "Your deadlines are saved. Check your email for a sign-in code."),
  ],
  4,
);

const keep = stack(
  [
    text("Keep these dates", "h2"),
    meta("We will email you this list. No account and no spam."),
    input("Email", { id: "email", placeholder: "you@example.com" }),
    row([btn("Email me the list", "secondary", "send")], "start"),
    toast("sent", "Saved. We sent the list to your email."),
  ],
  4,
);

export const publicCheck: Tutorial = {
  id: "public.check",
  version: 2,
  title: "The free deadline check",
  summary: "Pick your country, answer a few questions, choose the dates that apply to you and save them.",
  audience: ["public"],
  autoStart: "never",
  steps: [
    step(
      "answer",
      "Answer a few questions",
      "Each question has a short answer to tap. It takes about two minutes and you do not need an account.",
      scene(question, [
        say(hover("q1"), "One question at a time", "After you pick your country, each screen asks one thing about your life there. This example is Costa Rica. The bar on top shows how far along you are."),
        say(click("own_yes", [hide("q1"), show("q2")]), "Yes", "Tap the answer that fits. The next question appears straight away."),
        say(click("corp_sa", [mark("corp_sa")]), "Yes, a sociedad anónima (S.A.)", "Many people hold a house or a car through a company. The check asks so it can list the company's yearly dates too."),
      ], "wide"),
    ),
    step(
      "results",
      "See the dates that may apply",
      "Your answers turn into a dated list. Each date is general and may require review by a lawyer.",
      scene(results, [
        say(hover("f1", [mark("f1")]), "DIMEX renewal", "The date your residency card may need renewing, worked out from the expiry date you gave.", ["dimex"]),
        say(hover("f2", [mark("f1", false), mark("f2")]), "Corporate tax return (D-101)", "A yearly tax form for your company. It is listed early, so there is plenty of time.", ["d101"]),
        say(hover("join", [mark("f2", false)]), "Join ILP", "Members talk these dates through with a lawyer licensed in their country, on a 20-minute video call."),
      ], "wide"),
    ),
    step(
      "choose",
      "Choose what applies and save your deadlines",
      "Include the cards that apply to you and skip the rest. Then save them to a free ILP account and set a date for each one.",
      scene(choose, [
        say(click("inc2", [set("inc2", { variant: "primary" }), set("skip2", { variant: "secondary" }), set("count", { text: "2 items selected" })]), "Include", "Puts this card on your list. Skip leaves it out. You can change your mind before you save."),
        say(click("setall", [show("claimform")]), "Set the deadlines for each", "Opens a short form. Your list goes to a free ILP account, where you set the dates."),
        say(type("cemail", "linda.pendleton@example.com"), "Email", "We send a sign-in code here. Your deadlines wait in your account."),
        say(click("agree", [set("agree", { on: true })]), "I agree", "You accept the Terms and the Privacy Policy. News emails are a separate choice, off unless you tick it."),
        say(click("save", [toastOn("codesent")]), "Save my deadlines", "Saves your list and emails the code. Type the code to open your deadlines."),
      ], "wide"),
    ),
    step(
      "keep",
      "Keep the list",
      "Type your email to get the list in your inbox. Nothing else is sent unless you ask.",
      scene(keep, [
        say(type("email", "linda.pendleton@example.com"), "Email", "Your email address. We use it only to send you this list."),
        say(click("send", [toastOn("sent")]), "Email me the list", "Sends the dated list to your inbox, so you can read it again later."),
      ], "wide"),
    ),
  ],
};
