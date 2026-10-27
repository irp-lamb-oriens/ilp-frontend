import type { Tutorial } from "../../components/tutorial/types";
import { FEE, btn, card, click, dialog, grid, hover, input, list, mark, meta, mockShell, open, p, pill, row, scene, scroll, set, shut, stack, step, text, toggle, type, wait }  from "../presets";

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
  [row([pill("Active", "success"), meta(`${FEE} a month · 60 minutes`)], "start"), row([btn("Update your card", "secondary", "card", "sm"), btn("Cancel membership", "ghost", "cancel", "sm")], "start")],
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
  version: 1,
  title: "Money",
  summary: "What you owe, proposals and your plan.",
  audience: ["client"],
  route: "/status/money",
  steps: [
    step(
      "balance",
      "See what you owe",
      "Balance due comes first. When it says you are all paid up, there is nothing to do.",
      scene(page(), [hover("due", [mark("balance")], 1400), wait(300)]),
      { target: "client-balance" },
    ),
    step(
      "read",
      "Read a proposal",
      "Legal work beyond your membership comes as a proposal. What this covers lists the work in plain words. Ask a question first if anything is unclear.",
      scene(page(), [hover("proposal", [mark("proposal")], 1300), hover("ask", [], 800)]),
      { target: "client-proposals" },
    ),
    step(
      "accept",
      "Accept it in a few steps",
      "Select Accept this proposal, type your full name, tick the box and select Confirm and accept.",
      scene(page(), [
        click("accept", [open("confirm")], "Accept this proposal"),
        type("name", "Linda Pendleton"),
        click("agree", [set("agree", { on: true })], "I agree"),
        click("confirm_btn", [shut("confirm"), set("qstate", { label: "Accepted", tone: "success" }), set("accept", { hidden: true }), set("ask", { hidden: true })], "Confirm and accept"),
        wait(1000),
      ]),
    ),
    step(
      "plan",
      "Manage your plan",
      "Your membership plan shows the monthly fee. Update your card here, or cancel your membership if you need to.",
      scene(page(), [scroll("plan"), hover("card", [], 900), hover("cancel", [mark("plan")], 900)]),
    ),
  ],
};

export default clientMoney;
