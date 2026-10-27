import type { Tutorial } from "../../components/tutorial/types";
import {
  LAWYERS as L,
  MEMBERS as M,
  click,
  dateIn,
  deflist,
  drawer,
  hide,
  hover,
  input,
  list,
  mark,
  meta,
  mockShell,
  open,
  p,
  pill,
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

const rows = table(
  ["Member", "Matter", "Stage", "Deadlines", "Next call"],
  [
    { id: "r1", cells: [M.hiroshi, "S.A. clean-up · Corporate", pill("Legal Review"), pill("1 due soon", "warning"), `Today 9:30`] },
    { id: "r2", cells: [M.omar, "Property transfer · Property", pill("Legal Review"), pill("1 overdue", "danger"), "—"] },
    { id: "r3", cells: [M.chloe, "Will and estate plan · Family", pill("Quote Sent"), "None due", dateIn(6)] },
    { id: "r4", cells: [M.dmitri, "Residency application · Immigration", pill("Intake"), "None due", dateIn(2)] },
  ],
  "rows",
);

const inspector = drawer(
  "drawer",
  M.hiroshi,
  [
    tabs(["Brief", "Matter", "Notes and calls", "Quotes", "Deadlines", "Documents"], "Brief", "itabs", ["i_brief", "i_matter", "i_notes", "i_quotes", "i_deadlines", "i_docs"]),
    stack(
      [
        text("Their question", "label"),
        text("“Can I sell the house before the S.A. books are fixed?”", "body"),
        deflist([
          { term: "Residency", value: "Pensionado" },
          { term: "Property", value: "Nosara, Guanacaste" },
          { term: "Company", value: "S.A." },
          { term: "Profile completeness", value: "82%" },
        ]),
      ],
      3,
      "i_brief_body",
    ),
    {
      ...list(
        [
          { title: "Corporate tax return (D-101)", meta: `Due ${dateIn(6)}`, pill: p("Due soon", "warning") },
          { title: "Annual S.A. tax (impuesto a las personas jurídicas)", meta: `Due ${dateIn(40)}` },
        ],
        "plain",
        "i_deadlines_body",
      ),
      hidden: true,
    },
  ],
  `S.A. clean-up before sale · ${L.andrea}`,
);

function page() {
  return mockShell("lawyer", "Clients", stack([input("Find a member or matter", { placeholder: "Name, matter or area", id: "search" }), rows, meta("4 members")]), {
    title: "Your members and matters",
    overlays: [inspector],
  });
}

export const lawyerClients: Tutorial = {
  id: "lawyer.clients",
  version: 2,
  title: "Clients",
  summary: "Every member assigned to you, with their matters and legal dates.",
  audience: ["lawyer"],
  route: "/lawyer/clients",
  steps: [
    step(
      "find",
      "Find a member or matter",
      "Clients lists every ILP member assigned to you, one row for each matter. Search to find one quickly.",
      scene(page(), [
        say(type("search", "Tanaka", [hide("r2"), hide("r3"), hide("r4")]), "Find a member or matter", "Type a name, a matter or a kind of law. The list keeps only what matches."),
        say(hover("r1", [mark("r1")]), M.hiroshi, "One matter, with its stage, upcoming legal dates and next call. 1 due soon means a legal date is close."),
      ]),
      { target: "lawyer-clients-search" },
    ),
    step(
      "open",
      "Open the side panel",
      "Click a row to open the member in a panel on the side. It opens on Brief: their question and the profile facts that matter.",
      scene(page(), [
        say(hover("r2"), M.omar, "This row shows 1 overdue: a legal date for this matter has already passed."),
        say(click("r1", [open("drawer")]), M.hiroshi, "Opens his details in a side panel, so you keep your place in the list."),
        say(hover("i_brief_body"), "Brief", "His question in his own words, and the profile facts that matter: residency, property and company."),
      ]),
    ),
    step(
      "tabs",
      "Check deadlines and documents",
      "The tabs inside the panel show the matter, your notes and calls, prices, legal dates and the member's documents.",
      scene(page(), [
        wait(200, [open("drawer")]),
        say(hover("i_docs"), "Documents", "Files the member uploaded, like a passport or the company's books."),
        say(click("i_deadlines", [set("itabs", { active: "Deadlines" }), hide("i_brief_body"), show("i_deadlines_body")]), "Deadlines", "Legal dates for this matter, like a yearly tax return. Due soon means the date is close."),
        say(hover("i_deadlines_body"), "Corporate tax return (D-101)", "The company's yearly tax return, due in six days. Worth mentioning on your next call."),
      ]),
    ),
  ],
};

export default lawyerClients;
