import type { Tutorial } from "../../components/tutorial/types";
import {
  MEMBERS as M,
  board,
  btn,
  chip,
  click,
  drag,
  hide,
  hover,
  input,
  mark,
  menu,
  mockShell,
  move,
  open,
  p,
  pill,
  row,
  say,
  scene,
  set,
  show,
  shut,
  stack,
  step,
  table,
  tabs,
  type,
} from "../presets";

const cards = board(
  [
    {
      id: "c_intake",
      title: "Intake",
      cards: [{ id: "k1", title: M.dmitri, meta: "Residency application · Immigration", badge: p("2 days in stage") }],
    },
    {
      id: "c_review",
      title: "Legal Review",
      cards: [
        { id: "k2", title: M.hiroshi, meta: "S.A. clean-up · Corporate", badge: p("Warn · 8 days in stage", "warning") },
        { id: "k3", title: M.omar, meta: "Property transfer · Property", pill: p("Deadlines: 1 overdue", "danger"), badge: p("Overdue · 16 days in stage", "danger") },
      ],
    },
    { id: "c_quote", title: "Quote Sent", cards: [{ id: "k4", title: M.chloe, meta: "Will and estate plan · Family", badge: p("3 days in stage") }] },
    { id: "c_filing", title: "Filing", cards: [] },
  ],
  "board",
);

const listView = table(
  ["Member", "Matter", "Stage", "In stage", "Next call"],
  [
    { id: "l1", cells: [M.omar, "Property transfer", pill("Legal Review"), pill("Overdue · 16 days in stage", "danger"), "None booked"] },
    { id: "l2", cells: [M.hiroshi, "S.A. clean-up", pill("Legal Review"), pill("Warn · 8 days in stage", "warning"), "Today 9:30"] },
    { id: "l3", cells: [M.chloe, "Will and estate plan", pill("Quote Sent"), "3 days", "None booked"] },
  ],
  "list",
);

function page() {
  return mockShell(
    "lawyer",
    "Board",
    stack([
      row(
        [
          tabs(["Board", "List"], "Board", "layout", ["t_board", "t_list"]),
          row([input("Legal area", { value: "All areas", select: true, id: "area" }), btn("Reload", "ghost", "reload", "sm")], "end"),
        ],
        "between",
      ),
      row([chip("Move to…", false, "moveto"), menu("menu", [{ id: "mi_quote", label: "Quote Sent" }, { id: "mi_filing", label: "Filing" }, { id: "mi_closed", label: "Closed" }])], "end"),
      cards,
      { ...listView, hidden: true },
    ]),
    { title: "Your matters" },
  );
}

export const lawyerBoard: Tutorial = {
  id: "lawyer.board",
  version: 3,
  title: "Board",
  summary: "Your matters by stage, and what has waited too long.",
  audience: ["lawyer"],
  route: "/lawyer/board",
  steps: [
    step(
      "aging",
      "Find what is waiting on you",
      "Your board shows every matter assigned to you. Each column is a stage, and each card shows how many days the matter has waited there.",
      scene(page(), [
        say(hover("k3", [mark("k3")]), M.omar, "Overdue: 16 days in Legal Review, past the time limit ILP set for that step, and one legal deadline missed. Look at this first.", ["sla"]),
        say(hover("k2", [mark("k3", false), mark("k2")]), M.hiroshi, "Warn: half of the time limit for this step is used. Not late yet."),
        say(hover("c_intake", [mark("k2", false)]), "Intake", "New matters nobody has worked on yet. Move them on once you start."),
      ]),
      { target: "lawyer-board" },
    ),
    step(
      "drag",
      "Move a matter to its next stage",
      "When a matter moves on, drag its card to the next column. The member and the ILP team then see the new stage on their own screens.",
      scene(page(), [
        say(drag("k2", "c_quote"), M.hiroshi, "You sent a price for the extra work, so the card goes to Quote Sent. The member sees the new step in their portal."),
        say(hover("c_filing"), "Filing", "Papers are with a public office, such as the National Registry. Move cards here when you file."),
      ]),
    ),
    step(
      "keyboard",
      "Or use Move to…",
      "The Move to menu does the same without dragging, and it works with the keyboard: arrow keys to pick a stage, Enter to move.",
      scene(page(), [
        say(click("moveto", [open("menu")]), "Move to…", "Opens a short list of stages. Handy when dragging is hard, or when you use the keyboard."),
        say(click("mi_filing", [shut("menu"), { id: "k3", moveTo: "c_filing" }]), "Filing", "Moves the card to Filing. The result is the same as dragging it."),
      ]),
    ),
    step(
      "list",
      "Filter, or switch to a list",
      "Filter the board by legal area, or switch to List to see the same matters as a table.",
      scene(page(), [
        say(click("area", [set("area", { value: "Property" })]), "Legal area", "Shows only matters of one kind of law, here property."),
        say(click("t_list", [set("layout", { active: "List" }), hide("board"), show("list")]), "List", "Shows the same matters as a table, one row each, easy to sort and scan."),
        say(hover("l1", [mark("l1")]), M.omar, "The same overdue matter, now as a row. Both views always match."),
      ]),
    ),
  ],
};

export default lawyerBoard;
