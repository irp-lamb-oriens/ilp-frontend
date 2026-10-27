import type { Tutorial } from "../../components/tutorial/types";
import {
  FEE,
  LAWYERS as L,
  card,
  grid,
  hover,
  mark,
  meta,
  mockShell,
  say,
  scene,
  scroll,
  stack,
  stat,
  step,
  table,
  text,
  type,
} from "../presets";

function page() {
  return mockShell(
    "staff",
    "Finance",
    stack([
      meta("Membership revenue is ILP's. Legal fees (GMV) belong to the work lawyers do and are reported apart.", "fin_note"),
      grid("2-1-1-1", [
        stat("MRR", "US$3,679.54", { size: "lg", hint: `46 active members × ${FEE}`, id: "mrr" }),
        stat("ARR run rate", "US$44,154", { id: "arr" }),
        stat("Membership revenue, 30 days", "US$4,239.46", { hint: "Activation and monthly fees paid", id: "rev30" }),
        stat("Legal fees (GMV), 30 days", "US$6,870", { hint: "8 accepted quotes; not platform revenue", id: "gmv" }),
      ]),
      card(
        "Quote finance",
        [
          grid("1-1-1", [stat("Revenue", "US$6,870"), stat("Margin", "US$1,374", { id: "q_margin" }), stat("Win rate", "58.3%", { hint: "7 won", id: "q_win" })]),
          text("Revenue vs cost vs margin", "h3"),
          table(
            ["Provider", "Revenue", "Cost", "Margin"],
            [
              { id: "p1", cells: [L.andrea, "US$3,150", "US$2,520", "US$630"] },
              { id: "p2", cells: [L.mauricio, "US$2,400", "US$1,920", "US$480"] },
              { id: "p3", cells: [L.daniela, "US$1,320", "US$1,056", "US$264"] },
            ],
          ),
        ],
        { id: "quotes" },
      ),
    ]),
    { title: "Finance" },
  );
}

export const staffFinance: Tutorial = {
  id: "staff.finance",
  version: 2,
  title: "Finance",
  summary: "ILP's membership income and lawyers' legal fees, always kept apart.",
  audience: ["staff"],
  route: "/dashboard/finance",
  steps: [
    step(
      "mrr",
      "Membership money first",
      "This page is for admins. The top row shows ILP's own income from memberships, which is what pays for the business.",
      scene(page(), [
        say(hover("mrr", [mark("mrr")]), "MRR", "Monthly recurring revenue: active members times the monthly fee. Here, 46 members paying US$79.99 each.", ["mrr"]),
        say(hover("arr", [mark("mrr", false)]), "ARR run rate", "This month's MRR times 12: what a full year would bring if nothing changed."),
        say(hover("rev30"), "Membership revenue, 30 days", "Money that actually came in from memberships in the last 30 days, including the one-time activation fees.", ["activationFee"]),
      ]),
      { target: "staff-finance-kpis" },
    ),
    step(
      "gmv",
      "Keep legal fees apart",
      "When members pay for extra legal work, most of that money belongs to the lawyer. We count it apart, so ILP's own income is never overstated.",
      scene(page(), [
        say(hover("fin_note"), "Two kinds of money", "Membership money is ILP's. Legal fees pay for lawyers' work. This page always shows them apart."),
        say(hover("gmv", [mark("gmv")]), "Legal fees (GMV), 30 days", "What members agreed to pay for lawyers' work this month. It is not ILP's income, so it never adds to MRR."),
      ]),
    ),
    step(
      "quotes",
      "Review quote finance",
      "Quote finance looks at the prices sent for extra legal work: how much came in, what the lawyers were paid, and what ILP kept.",
      scene(page(), [
        scroll("quotes"),
        say(hover("q_margin"), "Margin", "What ILP keeps after paying the lawyer: revenue minus cost."),
        say(hover("p1", [mark("p1")]), L.andrea, "One row per lawyer: what members paid, the lawyer's share, and what ILP kept."),
        say(hover("q_win", [mark("p1", false)]), "Win rate", "Out of the prices sent, how many members accepted."),
      ]),
    ),
  ],
};

export default staffFinance;
