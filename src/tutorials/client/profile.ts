import type { Tutorial } from "../../components/tutorial/types";
import { btn, card, click, grid, hover, input, list, mark, meta, mockShell, p, progress, row, scene, set, show, stack, step, text, hidden, wait, pill }  from "../presets";

const completion = card(
  "Profile completion",
  [row([pill("Not ready yet", "warning", "readypill"), meta("Your lawyer reads your profile before every call.")], "start"), progress("Profile completion", 0.64, "64%", "warning", "bar")],
  { id: "completion" },
);

const residency = card(
  "Residency",
  [
    meta("Your status and its renewal date drive several deadlines."),
    input("Residency status in Costa Rica", { value: "Resident: pensionado", select: true }),
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
  version: 1,
  title: "Profile and documents",
  summary: "Keep your details current and upload documents.",
  audience: ["client"],
  route: "/status/profile",
  steps: [
    step(
      "completion",
      "Get your profile ready",
      "Your lawyer reads your profile before every call. When it is complete enough, it says Ready for your lawyer.",
      scene(page(), [hover("bar", [mark("bar")], 1400), wait(400)]),
      { target: "client-profile-completion" },
    ),
    step(
      "fill",
      "Fill in one section at a time",
      "Each section has its own Save button. Fill in what you know; you can come back to the rest later.",
      scene(page(), [
        click("dimex", [set("dimex", { value: dateIn(74) })], "Residency card (DIMEX) expiry date"),
        click("save", [show("saved"), set("bar", { value: 0.76, valueText: "76%", tone: "success" }), set("readypill", { label: "Ready for your lawyer", tone: "success" })], "Save residency"),
        wait(1100),
      ]),
    ),
    step(
      "upload",
      "Upload a document",
      "Choose which matter it is for and what kind of document it is, pick the file, then select Upload document.",
      scene(page(), [
        click("kind", [set("kind", { value: "Residency" })], "What kind of document is it?"),
        click("file", [set("file", { value: "dimex-front.jpg" })], "File"),
        click("upload", [show("doc2")], "Upload document"),
        wait(1000),
      ]),
      { target: "client-documents" },
    ),
  ],
};

function dateIn(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default clientProfile;
