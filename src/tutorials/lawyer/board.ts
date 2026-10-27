import type { Tutorial } from "../../components/tutorial/types";
import { MEMBERS as M, board, btn, chip, click, drag, hover, input, mark, menu, mockShell, open, p, row, scene, set, shut, stack, step, tabs, wait, hide, show, table, pill } from "../presets";

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
    { id: "l1", cells: [M.omar, "Property transfer", pill("Legal Review"), pill("Overdue · 16 days in stage", "danger"), "—"] },
    { id: "l2", cells: [M.hiroshi, "S.A. clean-up", pill("Legal Review"), pill("Warn · 8 days in stage", "warning"), "Today 9:30"] },
    { id: "l3", cells: [M.chloe, "Will and estate plan", pill("Quote Sent"), "3 days", "—"] },
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
  version: 1,
  title: "Board",
  summary: "Your matters by stage.",
  audience: ["lawyer"],
  route: "/lawyer/board",
  steps: [
    step(
      "aging",
      "Find what is waiting on you",
      "Each card shows days in stage. Warn and Overdue follow the stage's SLA; overdue deadlines are flagged on the card.",
      scene(page(), [hover("k3", [mark("k3")], 1200), hover("k2", [mark("k3", false), mark("k2")], 900)]),
      { target: "lawyer-board" },
    ),
    step(
      "drag",
      "Move a matter to its next stage",
      "Drag a card to the next column. The member's portal and the ILP team see the new stage.",
      scene(page(), [drag("k2", "c_quote"), wait(900)]),
    ),
    step(
      "keyboard",
      "Or use Move to…",
      "Every card has Move to…, which works with the keyboard: arrows to pick a stage, Enter to move.",
      scene(page(), [
        click("moveto", [open("menu")], "Move to…"),
        hover("mi_filing", [mark("mi_filing")], 600),
        click("mi_filing", [shut("menu"), { id: "k3", moveTo: "c_filing" }], "Filing"),
        wait(900),
      ]),
    ),
    step(
      "list",
      "Filter, or switch to the list",
      "Filter by legal area, or switch to List for a sortable table of the same matters.",
      scene(page(), [
        click("area", [set("area", { value: "Property" })], "Legal area"),
        click("t_list", [set("layout", { active: "List" }), hide("board"), show("list")], "List"),
        hover("l1", [mark("l1")], 900),
      ]),
    ),
  ],
};

export default lawyerBoard;
