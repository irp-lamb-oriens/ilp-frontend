import type { Tutorial } from "../../components/tutorial/types";
import {
  LAWYERS as L,
  MEMBERS as M,
  btn,
  click,
  dateIn,
  h3,
  hide,
  hover,
  input,
  mark,
  meta,
  mockShell,
  open,
  pill,
  row,
  say,
  scene,
  set,
  show,
  stack,
  step,
  table,
  tabs,
  text,
  type,
  wait,
} from "../presets";

const matters = table(
  ["Matter", "Stage", "In stage", "Next step", "Lawyer"],
  [
    { id: "m1", cells: [`Property transfer · ${M.omar}`, pill("Filing"), pill("Overdue · 16 days in stage", "danger"), `Registry filing by ${dateIn(-1)}`, L.mauricio] },
    { id: "m2", cells: [`Residency renewal · ${M.asa}`, pill("Legal Review"), pill("Warn · 9 days in stage", "warning"), `Criminal record apostille by ${dateIn(5)}`, L.daniela] },
    { id: "m3", cells: [`S.A. clean-up · ${M.hiroshi}`, pill("Quote Sent"), pill("2 days in stage"), `Member answers quote by ${dateIn(4)}`, L.andrea] },
    { id: "m4", cells: [`Will and estate plan · ${M.chloe}`, pill("Scoping"), pill("4 days in stage"), "Collect property list", L.andrea] },
  ],
  "matters",
);

function page() {
  return mockShell(
    "staff",
    "Pipeline",
    stack([
      meta("Open matters by stage and time in stage. The client CRM keeps stage actions, Lily and emails."),
      tabs(["Matters", "Client CRM"], "Matters", "views", ["tab_matters", "tab_crm"]),
      stack(
        [
          row([input("Stage", { value: "All stages (4)", select: true, id: "stage" })], "start"),
          matters,
        ],
        3,
        "matters_view",
      ),
      { type: "stack", id: "crm_view", hidden: true, gap: 3, children: [h3("Client CRM"), text("Stage actions, Lily and emails per client, as before.", "meta"), row([btn("Import clients", "secondary", "import", "sm")], "start")] },
    ]),
    { title: "Pipeline" },
  );
}

export const staffPipeline: Tutorial = {
  id: "staff.pipeline",
  version: 2,
  title: "Pipeline",
  summary: "Every open legal job, its step and how long it has waited.",
  audience: ["staff"],
  route: "/dashboard/pipeline",
  steps: [
    step(
      "aging",
      "Spot matters that wait too long",
      "A matter is one legal job, like a property transfer. This list shows every open matter, the step it is in, and how many days it has waited there.",
      scene(page(), [
        say(hover("m1", [mark("m1")]), "Overdue · 16 days in stage", "This property transfer has waited 16 days in Filing, longer than that step's time limit. Find out what is blocking it.", ["sla"]),
        say(hover("m2", [mark("m1", false), mark("m2")]), "Warn · 9 days in stage", "This one has used half of its time limit. It is not late yet, but worth a look so it stays on time."),
        say(hover("m3", [mark("m2", false)]), "Next step", "Each row says what has to happen next and by when. Here the member has to answer a price offer."),
      ]),
    ),
    step(
      "filter",
      "Filter by stage",
      "Pick one stage to see only the matters in it, for example everything that waits for a member to answer a price.",
      scene(page(), [
        say(click("stage", [set("stage", { value: "Quote Sent (1)" }), hide("m1"), hide("m2"), hide("m4")]), "Stage", "A drop-down list of the steps a matter goes through. Pick one and the list keeps only the matters in that step."),
        say(hover("m3", [mark("m3")]), "S.A. clean-up", "The only matter waiting for the member's answer to a price. If it waits too long, remind them kindly."),
      ]),
    ),
    step(
      "crm",
      "Use the client CRM for older tools",
      "The Client CRM tab keeps the older tools for each client: actions per step, the AI assistant Lily, emails, and importing clients from a file.",
      scene(page(), [
        say(hover("tab_matters"), "Matters", "The view you just used: one row for each legal job."),
        say(click("tab_crm", [set("views", { active: "Client CRM" }), hide("matters_view"), show("crm_view")]), "Client CRM", "Opens the older client tools: actions for each step, Lily the AI assistant, and the emails sent to each client."),
        say(hover("import"), "Import clients", "Adds many clients at once from a spreadsheet file, instead of typing them in one by one."),
      ]),
    ),
  ],
};

export default staffPipeline;
