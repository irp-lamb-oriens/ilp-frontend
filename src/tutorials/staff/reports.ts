import type { Tutorial } from "../../components/tutorial/types";
import { card, click, grid, h3, hide, hover, list, mark, meta, mockShell, p, progress, scene, set, show, stack, stat, step, table, tabs, wait } from "../presets";

const funnel = stack(
  [
    grid("1-1-1", [stat("Free check → paid member", "6.4%", { hint: "41 of 640", id: "conv" }), stat("Average call rating", "4.7", { hint: "38 ratings" }), stat("NPS (monthly question)", "52", { hint: "29 answers", id: "nps" })]),
    card("Member funnel", [
      progress("Started the free check", 1, "640"),
      progress("Saw their findings", 0.78, "499"),
      progress("Gave an email", 0.41, "262"),
      progress("Opened Join", 0.17, "109"),
      progress("Paid and active", 0.064, "41", "success", "paid"),
      progress("Booked a first call", 0.05, "32"),
    ]),
  ],
  3,
  "funnel",
);

const satisfaction = stack(
  [
    h3("Stage ratings"),
    table(
      ["Stage", "Ratings", "Average"],
      [
        { id: "r1", cells: ["Intake", "31", "4.8"] },
        { id: "r2", cells: ["Legal Review", "18", "4.4"] },
        { id: "r3", cells: ["Filing", "9", "3.9"] },
      ],
    ),
  ],
  3,
  "satisfaction",
);

const cancels = card("Why members cancel", [list([{ title: "Moved back home", pill: p("3") }, { title: "Did not use the calls", pill: p("2") }, { title: "Price", pill: p("1") }], "plain")], { id: "cancels" });

function page() {
  return mockShell(
    "staff",
    "Reports",
    stack([
      meta("Acquisition funnel and pipeline. Membership KPIs are on Today."),
      tabs(["Member funnel", "Funnel", "Pipeline", "Satisfaction", "Activity", "Sources", "Jurisdictions"], "Member funnel", "views", [
        "t_pmf",
        "t_funnel",
        "t_pipe",
        "t_sat",
        "t_act",
        "t_src",
        "t_jur",
      ]),
      funnel,
      cancels,
      { ...satisfaction, hidden: true },
    ]),
    { title: "Reports" },
  );
}

export const staffReports: Tutorial = {
  id: "staff.reports",
  version: 1,
  title: "Reports",
  summary: "How free checks turn into members, and how members feel.",
  audience: ["staff"],
  route: "/dashboard/reports",
  steps: [
    step(
      "funnel",
      "Follow the member funnel",
      "Member funnel follows people from the free check to a paid membership and a first call. The biggest drop is where to act.",
      scene(page(), [hover("conv", [], 800), hover("paid", [mark("paid")], 1200)]),
    ),
    step(
      "nps",
      "Read satisfaction and cancel reasons",
      "NPS comes from the monthly question members answer in their portal. Why members cancel groups the reasons they give.",
      scene(page(), [hover("nps", [mark("nps")], 1000), hover("cancels", [mark("nps", false), mark("cancels")], 1000)]),
    ),
    step(
      "tabs",
      "Switch report",
      "The other tabs cover the acquisition funnel, pipeline by stage, stage ratings, activity, sources and jurisdictions. Admins also see the sales report.",
      scene(page(), [click("t_sat", [set("views", { active: "Satisfaction" }), hide("funnel"), hide("cancels"), show("satisfaction")], "Satisfaction"), hover("r3", [mark("r3")], 1000), wait(400)]),
    ),
  ],
};

export default staffReports;
