import type { Tutorial } from "../../components/tutorial/types";
import {
  FEE,
  btn,
  card,
  click,
  dialog,
  grid,
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
  scroll,
  set,
  shut,
  stack,
  step,
  text,
  toggle,
  type,
} from "../presets";

const balance = card("Balance due", [text("US$79.99", "big", "due"), meta("Your ILP team sends payment instructions by email.")], { tone: "accent", id: "balance" });

const proposals = card(
  "Proposals waiting for your answer",
  [
    row([text("S.A. clean-up before sale", "strong"), pill("Waiting for you", "warning", "qstate")], "between"),
    text("US$1,200 · Lic. Andrea Vargas", "meta"),
    text("What this covers", "label"),
    list(
      [
        { title: "Review the minute books and share register" },
        { title: "Prepare and file the missing corrections" },
        { title: "Certificate that the company is up to date" },
      ],
      "plain",
      "covers",
    ),
    row([btn("Accept this proposal", "primary", "accept"), btn("Ask a question first", "secondary", "ask")], "start"),
  ],
  { id: "proposal" },
);

const charges = card(
  "Charges and proposals",
  [
    list(
      [
        { title: "Monthly membership", meta: "This month", trailing: FEE, pill: p("To pay", "warning") },
        { title: "Activation fee", meta: "When you joined", trailing: "US$100.00", pill: p("Paid", "success") },
      ],
      "rows",
    ),
  ],
  { id: "charges" },
);

const plan = card(
  "Your membership plan",
  [row([pill("Active", "success"), meta(`${FEE} a month · 60 minutes`)], "start", 2, "plan_info"), row([btn("Update your card", "secondary", "card", "sm"), btn("Cancel membership", "ghost", "cancel", "sm")], "start")],
  { id: "plan" },
);

function page() {
  return mockShell("client", "Money", stack([grid("1-2", [balance, proposals]), grid("1-1", [charges, plan])]), {
    title: "Money",
    overlays: [
      dialog("confirm", "Accept this proposal", [
        input("Type your full name to accept", { id: "name" }),
        toggle("I agree to this proposal for US$1,200.", false, "agree", "checkbox"),
        row([btn("Not now", "secondary", "notnow", "sm"), btn("Confirm and accept", "primary", "confirm_btn", "sm")], "end"),
      ]),
    ],
  });
}

export const clientMoney: Tutorial = {
  id: "client.money",
  version: 2,
  title: "Money",
  summary: "What you owe, proposals for extra work, and your plan.",
  audience: ["client"],
  route: "/status/money",
  steps: [
    step(
      "balance",
      "See what you owe",
      "The first box shows the amount you need to pay now, if any. When it says you are all paid up, there is nothing to do.",
      scene(page(), [
        say(hover("due", [mark("balance")]), "Balance due", "What you owe right now: this month's membership. Your ILP team emails you how to pay."),
        say(hover("charges", [mark("balance", false)]), "Charges", "Everything you have been charged, and whether it is paid. The activation fee was paid when you joined."),
      ]),
      { target: "client-balance" },
    ),
    step(
      "read",
      "Read a proposal",
      "Sometimes you need legal work beyond your membership, like putting your company's papers in order. Your lawyer then sends a proposal: the work and the price.",
      scene(page(), [
        say(hover("proposal", [mark("proposal")]), "S.A. clean-up before sale", "A price of US$1,200 from your lawyer for this work. Nothing is charged unless you accept."),
        say(hover("covers", [mark("proposal", false)]), "What this covers", "The work included, in plain words. Anything not listed is not included."),
        say(hover("ask"), "Ask a question first", "Not sure? Ask your ILP team before you decide. There is no rush."),
      ]),
      { target: "client-proposals" },
    ),
    step(
      "accept",
      "Accept it in a few steps",
      "If you want the work done, accept the proposal. You type your name and tick a box, so nothing is accepted by accident.",
      scene(page(), [
        say(click("accept", [open("confirm")]), "Accept this proposal", "Opens a short confirmation box. Nothing is accepted yet."),
        say(type("name", "Linda Pendleton"), "Type your full name", "Your name acts as your signature on the proposal."),
        say(click("agree", [set("agree", { on: true })]), "I agree", "A tick box that confirms you agree to the price shown."),
        say(
          click("confirm_btn", [shut("confirm"), set("qstate", { label: "Accepted", tone: "success" }), set("accept", { hidden: true }), set("ask", { hidden: true })]),
          "Confirm and accept",
          "Accepts the proposal. Your lawyer can start, and the label changes to Accepted.",
        ),
      ]),
    ),
    step(
      "plan",
      "Manage your plan",
      "Your membership plan shows what you pay each month. You can update your card or cancel here.",
      scene(page(), [
        scroll("plan"),
        say(hover("plan_info"), "US$79.99 a month", "Your monthly fee. It includes up to 60 minutes of calls with your lawyer each month."),
        say(hover("card"), "Update your card", "Change the bank card your monthly payment is taken from."),
        say(hover("cancel", [mark("plan")]), "Cancel membership", "Opens a page that explains what happens first. Nothing is cancelled until you confirm."),
      ]),
    ),
  ],
};

export default clientMoney;
