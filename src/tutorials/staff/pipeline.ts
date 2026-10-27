import type { Tutorial } from "../../components/tutorial/types";
import { LAWYERS as L, MEMBERS as M, btn, click, dateIn, h3, hide, hover, input, mark, meta, mockShell, pill, row, scene, set, show, stack, step, table, tabs, text, wait } from "../presets";

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
  version: 1,
  title: "Pipeline",
  summary: "Open matters by stage and how long they have waited.",
  audience: ["staff"],
  route: "/dashboard/pipeline",
  steps: [
    step(
      "aging",
      "Spot matters that wait too long",
      "In stage counts days since the matter entered its stage. It turns to a warning at half the stage's SLA and to Overdue when the SLA has passed.",
      scene(page(), [hover("m1", [mark("m1")], 1200), hover("m2", [mark("m1", false), mark("m2")], 1000)]),
      { target: "staff-pipeline-table" },
    ),
    step(
      "filter",
      "Filter by stage",
      "Pick a stage to see only those matters. Next step says what has to happen and by when.",
      scene(page(), [click("stage", [set("stage", { value: "Quote Sent (1)" }), hide("m1"), hide("m2"), hide("m4")], "Stage"), hover("m3", [mark("m3")], 1000)]),
    ),
    step(
      "crm",
      "Use the client CRM for stage actions",
      "The Client CRM tab keeps the older per-client tools: stage actions, Lily and emails, and Import clients.",
      scene(page(), [click("tab_crm", [set("views", { active: "Client CRM" }), hide("matters_view"), show("crm_view")], "Client CRM"), wait(1000)]),
    ),
  ],
};

export default staffPipeline;
