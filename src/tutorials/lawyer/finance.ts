import type { Tutorial } from "../../components/tutorial/types";
import {
  MEMBERS as M,
  click,
  dateIn,
  grid,
  hide,
  hover,
  mark,
  meta,
  mockShell,
  pill,
  say,
  scene,
  set,
  show,
  stack,
  stat,
  step,
  table,
  tabs,
  type,
} from "../presets";

function page() {
  return mockShell(
    "lawyer",
    "Finance",
    stack([
      meta("Amounts are your fees as agreed with ILP. Member pricing is not shown here.", "fin_note"),
      grid("1-1-1-1", [
        stat("Your fee", "US$4,150", { hint: "6 matters", id: "fee" }),
        stat("Paid to you", "US$2,600", { hint: "4 payments", id: "paid" }),
        stat("Pending", "US$1,550", { hint: "2 payments", id: "pending" }),
        stat("Next payout", "US$950", { hint: dateIn(9), id: "next" }),
      ]),
      tabs(["By matter", "Payouts"], "By matter", "views", ["t_matter", "t_payouts"]),
      table(
        ["Matter", "Member", "Legal fee", "Status"],
        [
          { id: "m1", cells: ["S.A. clean-up before sale", M.hiroshi, "US$1,200", pill("Pending", "warning")] },
          { id: "m2", cells: ["Residency renewal", M.asa, "US$650", pill("Paid to you", "success")] },
          { id: "m3", cells: ["Will and estate plan", M.chloe, "US$950", pill("Pending", "warning")] },
        ],
        "bymatter",
      ),
      {
        ...table(
          ["Payout date", "Matter", "Your fee", "Status"],
          [
            { id: "p1", cells: [dateIn(9), "Will and estate plan", "US$950", pill("Pending", "warning")] },
            { id: "p2", cells: [dateIn(-12), "Residency renewal", "US$650", pill("Paid to you", "success")] },
          ],
          "payouts",
        ),
        hidden: true,
      },
    ]),
    { title: "Finance" },
  );
}

export const lawyerFinance: Tutorial = {
  id: "lawyer.finance",
  version: 2,
  title: "Finance",
  summary: "Your fees, what has been paid and what is coming.",
  audience: ["lawyer"],
  route: "/lawyer/finance",
  steps: [
    step(
      "totals",
      "Read your totals",
      "This page shows only your own fees, as agreed with ILP. What members pay ILP is not shown here.",
      scene(page(), [
        say(hover("fin_note"), "Your fees only", "Amounts are your share of the legal work, as agreed with ILP. Member prices are not shown."),
        say(hover("fee"), "Your fee", "What you earn on the paid legal work members accepted: six matters so far."),
        say(hover("pending", [mark("pending")]), "Pending", "Money you have earned that ILP has not paid out to you yet."),
        say(hover("next", [mark("pending", false), mark("next")]), "Next payout", "The next payment ILP sends you, with its amount and date."),
      ]),
      { target: "lawyer-finance-totals" },
    ),
    step(
      "matter",
      "See fees by matter",
      "By matter lists each piece of paid work, its fee and whether it has been paid to you.",
      scene(page(), [
        say(hover("m1", [mark("m1")]), "S.A. clean-up before sale", "Your fee for this matter and its status. Pending means it has not been paid to you yet."),
        say(hover("m2", [mark("m1", false), mark("m2")]), "Residency renewal", "Paid to you: this money has already reached you."),
      ]),
    ),
    step(
      "payouts",
      "Check payout dates",
      "Payouts lists each payment ILP sends you, with its date and status.",
      scene(page(), [
        say(click("t_payouts", [set("views", { active: "Payouts" }), hide("bymatter"), show("payouts")]), "Payouts", "Switches the table to payments, one row for each payment."),
        say(hover("p1", [mark("p1")]), "Will and estate plan", "US$950, planned to reach you in nine days. It is still Pending until then."),
      ]),
    ),
  ],
};

export default lawyerFinance;
