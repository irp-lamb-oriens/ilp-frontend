import type { Tutorial } from "../../components/tutorial/types";
import {
  btn,
  card,
  click,
  grid,
  hidden,
  hover,
  input,
  list,
  mark,
  meta,
  mockShell,
  p,
  pill,
  progress,
  row,
  say,
  scene,
  set,
  show,
  stack,
  step,
  text,
  type,
} from "../presets";

const completion = card(
  "Profile completion",
  [row([pill("Not ready yet", "warning", "readypill"), meta("Your lawyer reads your profile before every call.")], "start"), progress("Profile completion", 0.64, "64%", "warning", "bar")],
  { id: "completion" },
);

const residency = card(
  "Residency",
  [
    meta("Your status and its renewal date drive several deadlines."),
    input("Residency status", { value: "Resident: pensionado", select: true, id: "res_status" }),
    input("Residency card (DIMEX) expiry date", { placeholder: "Pick a date", hint: "Leave empty if you do not have one yet.", id: "dimex" }),
    row([btn("Save residency", "secondary", "save"), hidden(text("Saved.", "meta", "saved"))], "start"),
  ],
  { id: "residency" },
);

const property = card(
  "Property",
  [meta("Owning property in Costa Rica brings yearly taxes and registrations."), input("Do you own property in Costa Rica?", { value: "Yes", select: true }), input("Where is the property?", { value: "Tamarindo, Guanacaste" })],
);

const documents = card(
  "Documents",
  [
    grid("1-1", [input("Which matter is it for?", { value: "General (not one matter)", select: true, id: "matter" }), input("What kind of document is it?", { value: "Choose…", select: true, id: "kind" })]),
    input("File", { placeholder: "Choose a file", id: "file" }),
    btn("Upload document", "primary", "upload"),
    list([{ id: "doc1", title: "passport-linda.pdf", meta: "General", pill: p("Identity") }, { id: "doc2", title: "dimex-front.jpg", meta: "General", pill: p("Residency"), hidden: true }], "plain", "docs"),
  ],
  { id: "documents" },
);

function page() {
  return mockShell("client", "Profile", stack([completion, grid("1-1", [stack([residency, property], 3), documents])]), { title: "Profile and documents" });
}

export const clientProfile: Tutorial = {
  id: "client.profile",
  version: 2,
  title: "Profile and documents",
  summary: "Keep your details up to date and send your documents.",
  audience: ["client"],
  route: "/status/profile",
  steps: [
    step(
      "completion",
      "Get your profile ready",
      "Your profile holds the facts about your life in the country your membership covers: residency, property, family and companies. Your lawyer reads it before every call.",
      scene(page(), [
        say(hover("bar", [mark("bar")]), "Profile completion", "How much of your profile is filled in. At 70% or more, your lawyer has enough to help you well on a call."),
        say(hover("readypill", [mark("bar", false)]), "Not ready yet", "This label changes to Ready for your lawyer once enough is filled in. Nothing is wrong in the meantime."),
      ]),
      { target: "client-profile-completion" },
    ),
    step(
      "fill",
      "Fill in one part at a time",
      "Each part has its own Save button. Fill in what you know; you can come back to the rest at any time.",
      scene(page(), [
        say(hover("res_status"), "Residency status", "The kind of permission you have to live in your country. This example member lives in Costa Rica as a pensionado, the kind for retirees."),
        say(click("dimex", [set("dimex", { value: dateIn(74) })]), "Residency card (DIMEX) expiry date", "The date printed on your residency card. We use it to remind you well before it needs renewing."),
        say(
          click("save", [show("saved"), set("bar", { value: 0.76, valueText: "76%", tone: "success" }), set("readypill", { label: "Ready for your lawyer", tone: "success" })]),
          "Save residency",
          "Keeps what you entered. Your profile now has enough for your lawyer.",
        ),
      ]),
    ),
    step(
      "upload",
      "Upload a document",
      "Send your lawyer copies of papers, like your passport or residency card, here instead of by email. They stay in your account.",
      scene(page(), [
        say(click("kind", [set("kind", { value: "Residency" })]), "What kind of document is it?", "Pick the closest kind, for example Residency for your residency card. It helps your lawyer find it."),
        say(click("file", [set("file", { value: "dimex-front.jpg" })]), "File", "Choose the photo or scan from your computer or phone."),
        say(click("upload", [show("doc2")]), "Upload document", "Sends the file. It appears in the list below, and your lawyer can see it."),
      ]),
      { target: "client-documents" },
    ),
  ],
};

function dateIn(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default clientProfile;
