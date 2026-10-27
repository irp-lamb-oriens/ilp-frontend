import type { Tutorial } from "../../components/tutorial/types";
import { btn, click, hide, hover, input, list, mark, meta, mockShell, p, row, scene, set, show, stack, step, tabs, text, toast, toastOn, type, wait } from "../presets";

const stage = (id: string, staffLabel: string, sla: string) =>
  row([text(staffLabel, "strong"), input("Staff label", { value: staffLabel, id: `${id}_label` }), input("SLA days", { value: sla, id: `${id}_sla` })], "between", 3, id);

const stages = stack(
  [stage("s_intake", "Intake", "3"), stage("s_scoping", "Scoping", "5"), stage("s_review", "Legal Review", "10"), stage("s_filing", "Filing", "21"), row([btn("Save", "primary", "save")], "end")],
  3,
  "stages",
);

const emails = stack(
  [
    list(
      [
        { id: "e1", title: "Your call with Lic. Andrea Vargas is booked", meta: "To: imani.okafor@example.com · in 4 min", pill: p("Queued", "info") },
        { id: "e2", title: "Quote: S.A. clean-up before sale", meta: "To: hiroshi.tanaka@example.com · in 12 min", pill: p("Queued", "info") },
      ],
      "rows",
    ),
    row([btn("Preview", "secondary", "preview", "sm"), btn("Send now", "secondary", "send", "sm"), btn("Cancel", "ghost", "cancel", "sm")], "start"),
  ],
  3,
  "emails",
);

function page() {
  return mockShell(
    "staff",
    "Settings",
    stack([meta("Changes here apply to every member and lawyer."), tabs(["Stages", "Email queue", "Vendors"], "Stages", "views", ["t_stages", "t_emails", "t_vendors"]), stages, { ...emails, hidden: true }]),
    { title: "Settings", overlays: [toast("toast", "Stages saved")] },
  );
}

export const staffSettings: Tutorial = {
  id: "staff.settings",
  version: 1,
  title: "Settings",
  summary: "Stage names and SLAs, the email queue, vendors.",
  audience: ["staff"],
  route: "/dashboard/settings",
  steps: [
    step(
      "labels",
      "Rename a stage",
      "Each stage has a staff label. Keep it short; members and lawyers see stage names in their portals.",
      scene(page(), [type("s_review_label", "Lawyer review", [set("s_review", { highlight: true })]), wait(600)]),
      { target: "staff-settings-tabs" },
    ),
    step(
      "sla",
      "Set the SLA for a stage",
      "SLA days drive the aging badges on the pipeline and the lawyer board: a warning at half the SLA, Overdue once it has passed.",
      scene(page(), [type("s_filing_sla", "14"), click("save", [toastOn("toast")], "Save"), wait(900)]),
    ),
    step(
      "emails",
      "Check the email queue",
      "Email queue shows messages waiting to go out. Preview one, send it now, or cancel it before it leaves.",
      scene(page(), [
        click("t_emails", [set("views", { active: "Email queue" }), hide("stages"), show("emails")], "Email queue"),
        hover("e2", [mark("e2")], 800),
        click("preview", [], "Preview"),
        wait(600),
      ]),
    ),
  ],
};

export default staffSettings;
