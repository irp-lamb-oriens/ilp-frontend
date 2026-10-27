import type { Tutorial } from "../../components/tutorial/types";
import { MEMBERS as M, click, dateIn, grid, hide, hover, mark, meta, mockShell, pill, scene, set, show, stack, stat, step, table, tabs, wait } from "../presets";

function page() {
  return mockShell(
    "lawyer",
    "Finance",
    stack([
      meta("Amounts are your fees as agreed with ILP. Member pricing is not shown here."),
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
  version: 1,
  title: "Finance",
  summary: "Your fees, what is paid and what is coming.",
  audience: ["lawyer"],
  route: "/lawyer/finance",
  steps: [
    step(
      "totals",
      "Read your totals",
      "Your fee is what you earn on accepted quotes. Paid and Pending split it; Next payout shows the amount and date.",
      scene(page(), [hover("fee", [], 700), hover("pending", [mark("pending")], 900), hover("next", [mark("pending", false), mark("next")], 900)]),
      { target: "lawyer-finance-totals" },
    ),
    step(
      "matter",
      "See fees by matter",
      "By matter lists each matter's fee and whether it has been paid to you.",
      scene(page(), [hover("m1", [mark("m1")], 1000), hover("m2", [mark("m1", false), mark("m2")], 900)]),
    ),
    step(
      "payouts",
      "Check payout dates",
      "Payouts lists each payment to you with its date and status.",
      scene(page(), [click("t_payouts", [set("views", { active: "Payouts" }), hide("bymatter"), show("payouts")], "Payouts"), hover("p1", [mark("p1")], 1000), wait(300)]),
    ),
  ],
};

export default lawyerFinance;
