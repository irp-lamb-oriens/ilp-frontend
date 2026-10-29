import type { Tutorial } from "../../components/tutorial/types";
import { btn, card, click, grid, hide, hover, list, mark, meta, mockShell, p, pill, progress, say, scene, show, stack, stat, step, table, tabs } from "../presets";

const SECTIONS = ["Overview", "Paths", "Stuck", "Time", "Outbound", "Experiments"];
const SECTION_IDS = ["s_over", "s_paths", "s_stuck", "s_time", "s_out", "s_exp"];

const kpis = grid("2-1-1", [
  stat("Visitors", "6,840", { hint: "Last 28 days", id: "visitors" }),
  stat("Check to account", "18.4%", { hint: "431 of 2,390", id: "c2a" }),
  stat("Account to member", "20.2%", { hint: "87 paid", id: "a2m" }),
]);

const funnel = card(
  "Member funnel",
  [
    progress("Started the free check", 1, "2,390"),
    progress("Finished the free check", 0.83, "1,978", "accent", "finish"),
    progress("Picked deadlines to keep", 0.27, "655", "accent", "pick"),
    progress("Free account created", 0.18, "431"),
    progress("Paid activation (member)", 0.036, "87", "success", "paid"),
  ],
  { id: "funnel" },
);

const leaks = card(
  "Biggest leaks",
  [
    list(
      [
        { title: "1,267 people saw their results but did not pick any deadlines to keep", id: "leak1" },
        { title: "219 people started joining but did not pay the activation fee", id: "leak2" },
        { title: "412 people started the free check but did not finish it", id: "leak3" },
      ],
      "plain",
    ),
  ],
  { id: "leaks" },
);

const stuck = card(
  "Who is stuck now",
  [
    table(
      ["Person", "Stuck at", "Days", "Follow-up"],
      [
        { id: "p1", cells: ["Margaret Ellison", "Free account created", "9 days", "Create follow-up task"] },
        { id: "p2", cells: ["Douglas Pruitt", "Started joining", "4 days", "Task open"] },
      ],
    ),
  ],
  { id: "stuck", hidden: true },
);

const results = card(
  "Homepage headline",
  [
    pill("Running", "info", "running"),
    meta("B is ahead, not yet conclusive. About 949 more visitors per version are needed.", "verdict"),
    table(
      ["Version", "Visitors", "Rate", "Chance to be best"],
      [
        { id: "va", cells: ["A: Current headline", "1,874", "26.5%", "11.3%"] },
        { id: "vb", cells: ["B: Legal dates headline", "1,911", "28.8%", "88.7%"] },
      ],
    ),
    btn("End", "secondary", "end", "sm"),
  ],
  { id: "results", hidden: true },
);

function page() {
  return mockShell(
    "staff",
    "Journeys",
    stack([
      tabs(SECTIONS, "Overview", "sections", SECTION_IDS),
      meta("Last 28 days, inbound and outbound, all countries", "filters"),
      kpis,
      grid("2-1", [funnel, leaks]),
      stuck,
      results,
    ]),
    { title: "Journeys" },
  );
}

export const staffJourneys: Tutorial = {
  id: "staff.journeys",
  version: 1,
  title: "Journeys",
  summary: "Where people stop on the way to becoming members, and what to test next.",
  audience: ["staff"],
  route: "/dashboard/journeys",
  steps: [
    step(
      "funnel",
      "Read the funnel",
      "The funnel counts how many people reach each step, from the free check to paying. The filters at the top change the dates, the country or the source.",
      scene(page(), [
        say(hover("filters", [mark("filters")]), "Filters", "Pick the dates and, if you want, inbound or outbound people, a country or a device. The page link keeps your choice.", ["funnel"]),
        say(hover("finish", [mark("filters", false), mark("finish")]), "Finished the free check", "83% of the people who started the check finished it. The bar shows the share of everyone who started."),
        say(hover("paid", [mark("finish", false), mark("paid")]), "Paid activation", "The step where people become members. Each row shows how many people were lost since the row before.", ["dropOff"]),
      ]),
    ),
    step(
      "leaks",
      "Start with the biggest leaks",
      "Biggest leaks names the three steps that lose the most future members. A person lost close to paying counts for more than one lost on the homepage.",
      scene(page(), [
        say(hover("leak1", [mark("leak1")]), "The first leak", "Most people see their results and stop there. This is the first thing to look at."),
        say(hover("leak2", [mark("leak1", false), mark("leak2")]), "Close to paying", "Fewer people, but each was close to joining, so this leak is worth a lot."),
        say(hover("c2a", [mark("leak2", false), mark("c2a")]), "Check to account", "The share of people who start the check and then create a free account."),
      ]),
    ),
    step(
      "stuck",
      "Follow up with people who are stuck",
      "Stuck lists the people who have not moved past a step, longest first. One click creates a follow-up task for their CSM.",
      scene(page(), [
        say(click("s_stuck", [hide("funnel"), hide("leaks"), show("stuck")]), "Stuck", "Opens the list of people stuck at a step, with how long they have been there.", ["dwellTime"]),
        say(hover("p1", [mark("p1")]), "Margaret Ellison", "She created a free account 9 days ago and did nothing since. Create a follow-up task so her CSM calls her.", ["csm", "task"]),
      ]),
    ),
    step(
      "tests",
      "Read an experiment",
      "An experiment shows two versions of a page to different visitors. The result says which one gets more people to the next step, and how sure we can be.",
      scene(page(), [
        say(click("s_exp", [hide("funnel"), hide("leaks"), hide("stuck"), show("results")]), "Experiments", "Every test the team runs. Admins start and stop them; everyone can read the results.", ["experiment", "variant"]),
        say(hover("verdict", [mark("verdict")]), "Not yet conclusive", "B is ahead, but there are not enough visitors yet to be sure. Wait before you pick a winner.", ["confidence"]),
        say(hover("vb", [mark("verdict", false), mark("vb")]), "Chance to be best", "An 88.7% chance that B is the better version. Pick a winner at 95% or more, with enough visitors.", ["confidence"]),
      ]),
    ),
  ],
};

export default staffJourneys;
