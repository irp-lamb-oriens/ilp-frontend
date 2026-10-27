import type { Tutorial } from "../../components/tutorial/types";
import { FEE, LAWYERS as L, card, grid, hover, mark, meta, mockShell, scene, scroll, stack, stat, step, table, text, wait } from "../presets";

function page() {
  return mockShell(
    "staff",
    "Finance",
    stack([
      meta("Membership revenue is ILP's. Legal fees (GMV) belong to the work lawyers do and are reported apart."),
      grid("2-1-1-1", [
        stat("MRR", "US$3,679.54", { size: "lg", hint: `46 active members × ${FEE}`, id: "mrr" }),
        stat("ARR run rate", "US$44,154", { id: "arr" }),
        stat("Membership revenue, 30 days", "US$4,239.46", { hint: "Activation and monthly fees paid", id: "rev30" }),
        stat("Legal fees (GMV), 30 days", "US$6,870", { hint: "8 accepted quotes; not platform revenue", id: "gmv" }),
      ]),
      card(
        "Quote finance",
        [
          grid("1-1-1", [stat("Revenue", "US$6,870"), stat("Margin", "US$1,374"), stat("Win rate", "58.3%", { hint: "7 won" })]),
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
  version: 1,
  title: "Finance",
  summary: "Membership revenue and legal fees, kept apart.",
  audience: ["staff"],
  route: "/dashboard/finance",
  steps: [
    step(
      "mrr",
      "Membership revenue first",
      "MRR is active members times the monthly fee. ARR run rate is MRR times 12. Admins only.",
      scene(page(), [hover("mrr", [mark("mrr")], 1100), hover("arr", [mark("mrr", false)], 800)]),
      { target: "staff-finance-kpis" },
    ),
    step(
      "gmv",
      "Keep legal fees apart",
      "Legal fees (GMV) are what members pay for lawyers' work. They are not platform revenue, so they never add to MRR.",
      scene(page(), [hover("rev30", [], 800), hover("gmv", [mark("gmv")], 1200)]),
    ),
    step(
      "quotes",
      "Review quote finance",
      "Quote finance breaks priced quotes into revenue, cost and margin, by month, route, service, lawyer and stage.",
      scene(page(), [scroll("quotes"), hover("p1", [mark("p1")], 1000), wait(500)]),
    ),
  ],
};

export default staffFinance;
