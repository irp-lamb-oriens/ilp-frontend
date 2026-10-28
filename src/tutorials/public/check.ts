import type { Tutorial } from "../../components/tutorial/types";
import { btn, card, click, dateIn, hidden, hide, hover, input, list, mark, meta, progress, row, say, scene, show, stack, step, text, toast, toastOn, type } from "../presets";

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
          text("Do you have a Costa Rican corporation?", "h2"),
          meta("Many people hold a house or car through one, even if it does no business."),
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
  version: 1,
  title: "The free deadline check",
  summary: "Answer a few questions and see the dates that may apply to you in Costa Rica.",
  audience: ["public"],
  autoStart: "never",
  steps: [
    step(
      "answer",
      "Answer a few questions",
      "Each question has a short answer to tap. It takes about two minutes and you do not need an account.",
      scene(question, [
        say(hover("q1"), "One question at a time", "Each screen asks one thing about your life in Costa Rica. The bar on top shows how far along you are."),
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
        say(hover("join", [mark("f2", false)]), "Join ILP", "Members talk these dates through with a lawyer licensed in Costa Rica, on a 20-minute video call."),
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
