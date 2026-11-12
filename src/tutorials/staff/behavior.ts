import type { Tutorial } from "../../components/tutorial/types";
import { card, click, grid, hide, hover, list, mark, meta, mockShell, pill, progress, say, scene, show, stack, stat, step, table, tabs } from "../presets";

const SECTIONS = ["Overview", "Behavior", "Paths", "Stuck", "Time", "Outbound", "Experiments"];
const SECTION_IDS = ["s_over", "s_beh", "s_paths", "s_stuck", "s_time", "s_out", "s_exp"];
const LAYERS = ["Clicks", "Rage clicks", "Dead clicks", "Scroll reach", "Attention"];
const LAYER_IDS = ["l_clicks", "l_rage", "l_dead", "l_scroll", "l_att"];

const kpis = grid("2-1-1", [
  stat("Views of the free check", "2,390", { hint: "Phone 1,512, Tablet 96, Computer 782", id: "views" }),
  stat("Rage clicks", "84", { hint: "3.5% of views", id: "rage" }),
  stat("Dead clicks", "17.2%", { hint: "412 of 2,395 clicks", id: "dead" }),
]);

const findings = card(
  "What stands out on this page",
  [
    list(
      [
        { title: "Fix first: rage clicks on 3.5% of views. Open the Rage clicks layer to see which spot people hammer.", id: "f1" },
        { title: "Look at this: 17% of clicks do nothing. People expect something there to be a link or a button.", id: "f2" },
        { title: "Note: only 22% of views reach the middle of the page.", id: "f3" },
      ],
      "plain",
    ),
  ],
  { id: "findings" },
);

const map = card(
  "Heat map",
  [
    tabs(LAYERS, "Clicks", "layers", LAYER_IDS),
    meta("Where people click or tap. Warmer spots get more clicks.", "layerHelp"),
    progress("Top of the page: See my dates button", 0.92, "61% of clicks", "accent", "hot1"),
    progress("Country picker", 0.38, "22% of clicks", "accent", "hot2"),
    progress("Photo of the lawyer (not a link)", 0.21, "9% of clicks", "accent", "hot3"),
  ],
  { id: "map" },
);

const reach = card(
  "How far people get",
  [
    progress("0% to 10% of the page", 1, "100%", "accent", "r0"),
    progress("40% to 50%", 0.41, "41%", "accent", "r4"),
    progress("50% to 60%", 0.22, "22%", "accent", "r5"),
    progress("90% to 100%", 0.06, "6%", "accent", "r9"),
  ],
  { id: "reach", hidden: true },
);

const elements = card(
  "What people click",
  [
    table(
      ["Control", "Clicks", "Rage", "Dead"],
      [
        { id: "e1", cells: ["button: See my dates", "1,461", "71", "0"] },
        { id: "e2", cells: ["field: country", "527", "2", "0"] },
        { id: "e3", cells: ["img", "216", "9", "216"] },
      ],
    ),
    pill("Totals only: no person, nothing typed", "info", "privacy"),
  ],
  { id: "elements", hidden: true },
);

function page() {
  return mockShell(
    "staff",
    "Journeys",
    stack([
      tabs(SECTIONS, "Behavior", "sections", SECTION_IDS),
      meta("The free check, all devices, last 28 days", "controls"),
      kpis,
      findings,
      map,
      reach,
      elements,
    ]),
    { title: "Journeys" },
  );
}

export const staffBehavior: Tutorial = {
  id: "staff.behavior",
  version: 1,
  title: "Behavior and heat maps",
  summary: "What visitors do on each page: where they click, how far they scroll and what annoys them.",
  audience: ["staff"],
  route: "/dashboard/journeys/behavior",
  steps: [
    step(
      "pick",
      "Pick a page and read what stands out",
      "Behavior shows one public page at a time. Choose the page, the device and the dates. The findings under the figures say in plain words what to fix first.",
      scene(page(), [
        say(hover("controls", [mark("controls")]), "Page, device and dates", "Phones and computers show a page differently, so pick one device when you study where clicks land."),
        say(hover("f1", [mark("controls", false), mark("f1")]), "Fix first", "A finding appears only after 30 measured views, so one odd visit never raises an alarm."),
        say(hover("rage", [mark("f1", false), mark("rage")]), "Rage clicks", "Three or more fast clicks on one spot. The visitor thinks something is broken or too slow."),
        say(hover("dead", [mark("rage", false), mark("dead")]), "Dead clicks", "Clicks on something that does nothing, like a photo that looks like a link."),
      ]),
    ),
    step(
      "map",
      "Read the heat map",
      "The heat map draws the clicks over the page itself. Scroll it like the page. Switch the layer to see rage clicks, dead clicks, how far people scroll or where they look longest.",
      scene(page(), [
        say(hover("hot1", [mark("hot1")]), "The warmest spot", "Most clicks land on the main button. That is what this page is for, so this is healthy."),
        say(hover("hot3", [mark("hot1", false), mark("hot3")]), "A photo that gets clicks", "People click the lawyer's photo and nothing happens. Make it a link, or make it look less like one."),
        say(click("l_scroll", [mark("hot3", false), hide("map"), show("reach")]), "Scroll reach", "Shows how many views got to each part of the page."),
        say(hover("r5", [mark("r5")]), "Half the page", "Only 22% of views get past the middle. Move anything a visitor must see above this line."),
      ]),
    ),
    step(
      "controls",
      "See which controls people use",
      "What people click lists every button, link and field by its label, with how often it was clicked. Use it to check that the control you care about is the one people choose.",
      scene(page(), [
        say(click("s_beh", [hide("map"), hide("reach"), hide("findings"), show("elements")]), "What people click", "One row per control. Sort by Rage or Dead to find the ones that annoy people."),
        say(hover("e1", [mark("e1")]), "The main button", "71 rage clicks on the main button. It probably reacts too slowly on phones. Ask the developers to check it."),
        say(hover("e3", [mark("e1", false), mark("e3")]), "Not a control", "Every click on this image was a dead click. It is the photo from the heat map."),
        say(hover("privacy", [mark("e3", false), mark("privacy")]), "What is measured", "Only visitors who allowed measurement, only public pages, only totals. Nothing typed is ever recorded, and no person can be picked out."),
      ]),
    ),
  ],
};

export default staffBehavior;
