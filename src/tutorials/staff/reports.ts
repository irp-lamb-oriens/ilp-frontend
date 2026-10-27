import type { Tutorial } from "../../components/tutorial/types";
import {
  card,
  click,
  grid,
  h3,
  hide,
  hover,
  list,
  mark,
  meta,
  mockShell,
  p,
  progress,
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

const funnel = stack(
  [
    grid("1-1-1", [stat("Free check → paid member", "6.4%", { hint: "41 of 640", id: "conv" }), stat("Average call rating", "4.7", { hint: "38 ratings", id: "rating" }), stat("NPS (monthly question)", "52", { hint: "29 answers", id: "nps" })]),
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
  version: 2,
  title: "Reports",
  summary: "How people become members, and how members feel.",
  audience: ["staff"],
  route: "/dashboard/reports",
  steps: [
    step(
      "funnel",
      "Follow the member funnel",
      "Most members start with the free check on our website. The member funnel counts how many people reach each next step, so you can see where most people stop.",
      scene(page(), [
        say(hover("conv"), "Free check to paid member", "Out of everyone who started the free check, how many became paying members. Here it is 41 of 640.", ["freeCheck"]),
        say(hover("paid", [mark("paid")]), "Paid and active", "The step where people start paying. The biggest drop between two steps shows where to improve first.", ["funnel"]),
      ]),
    ),
    step(
      "nps",
      "Read how members feel",
      "Once a month members answer one question: would they recommend ILP to a friend? Their answers make the NPS score.",
      scene(page(), [
        say(hover("nps", [mark("nps")]), "NPS", "A score from -100 to 100 based on that monthly question. Above 50 is very good; here it is 52."),
        say(hover("rating", [mark("nps", false)]), "Average call rating", "Members rate each call out of 5. A 4.7 means most calls go well."),
        say(hover("cancels", [mark("cancels")]), "Why members cancel", "The reasons members gave when they left, grouped and counted. Use them to decide what to fix.", ["churn"]),
      ]),
    ),
    step(
      "tabs",
      "Switch report",
      "The tabs along the top show other reports: how people find us, how members rate each step of their case, activity and more.",
      scene(page(), [
        say(click("t_sat", [set("views", { active: "Satisfaction" }), hide("funnel"), hide("cancels"), show("satisfaction")]), "Satisfaction", "Shows how members rate each step of their case."),
        say(hover("r3", [mark("r3")]), "Filing, 3.9", "The lowest score. Members are least happy while papers are being filed, so look there first."),
        say(hover("t_src", [mark("r3", false)]), "Sources", "Where new members came from, for example a web search or a friend's advice."),
      ]),
    ),
  ],
};

export default staffReports;
