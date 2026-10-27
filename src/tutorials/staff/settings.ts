import type { Tutorial } from "../../components/tutorial/types";
import {
  btn,
  click,
  hide,
  hover,
  input,
  list,
  mark,
  meta,
  mockShell,
  p,
  row,
  say,
  scene,
  set,
  show,
  stack,
  step,
  tabs,
  text,
  toast,
  toastOn,
  type,
  wait,
} from "../presets";

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
    stack([meta("Changes here apply to every member and lawyer.", "set_note"), tabs(["Stages", "Email queue", "Vendors"], "Stages", "views", ["t_stages", "t_emails", "t_vendors"]), stages, { ...emails, hidden: true }]),
    { title: "Settings", overlays: [toast("toast", "Stages saved")] },
  );
}

export const staffSettings: Tutorial = {
  id: "staff.settings",
  version: 2,
  title: "Settings",
  summary: "Stage names and time limits, and emails waiting to go out.",
  audience: ["staff"],
  route: "/dashboard/settings",
  steps: [
    step(
      "labels",
      "Rename a stage",
      "Every matter moves through the same steps, called stages. Here you choose their names. Members and lawyers see them, so keep them short and clear.",
      scene(page(), [
        say(hover("set_note"), "Applies to everyone", "Changes on this page affect every member and lawyer at once, so check before you save."),
        say(hover("s_intake"), "Intake", "The first step: a new request has arrived and nobody has worked on it yet."),
        say(type("s_review_label", "Lawyer review", [set("s_review", { highlight: true })]), "Staff label", "The name of this step. Lawyer review is clearer than Legal Review for someone new to us."),
      ]),
    ),
    step(
      "sla",
      "Set the time limit for a stage",
      "Each stage has a time limit in days, called the SLA. Cards that wait longer get a warning, so cases do not get stuck.",
      scene(page(), [
        say(type("s_filing_sla", "14"), "SLA days", "The most days a matter should stay in this step. After half of it the card shows a warning; after all of it, Overdue.", ["sla"]),
        say(click("save", [toastOn("toast")]), "Save", "Keeps your changes for everyone. A short note at the bottom confirms they were saved."),
      ]),
    ),
    step(
      "emails",
      "Check the email queue",
      "The system writes some emails for you, like booking confirmations, and waits a few minutes before sending. The email queue lets you check them first.",
      scene(page(), [
        say(click("t_emails", [set("views", { active: "Email queue" }), hide("stages"), show("emails")]), "Email queue", "Shows the emails waiting to go out in the next few minutes."),
        say(hover("e2", [mark("e2")]), "Quote: S.A. clean-up before sale", "A price offer that leaves in 12 minutes. Check the name and the amount before it goes."),
        say(click("preview"), "Preview", "Shows the email exactly as the member will read it."),
        say(hover("cancel"), "Cancel", "Stops the email before it leaves. Send now sends it right away instead."),
      ]),
    ),
  ],
};

export default staffSettings;
