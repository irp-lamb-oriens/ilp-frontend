import type { Tutorial } from "../../components/tutorial/types";
import {
  MEMBERS as M,
  TEAM,
  board,
  btn,
  click,
  dateIn,
  drag,
  drawer,
  grid,
  hover,
  input,
  mark,
  mockShell,
  open,
  p,
  pill,
  row,
  scene,
  set,
  shut,
  stack,
  stat,
  step,
  tabs,
  text,
  type,
  wait,
} from "../presets";

function page() {
  return mockShell(
    "staff",
    "Opportunities",
    stack([
      grid("1-1-1-1", [
        stat("Open pipeline", "US$14,850", { hint: "9 open", id: "s_open" }),
        stat("Win rate", "41.7%", { hint: "5 of 12 closed", id: "s_win" }),
        stat("Days to win", "18", { id: "s_days" }),
        stat("Won legal fees", "US$9,420", { hint: "GMV, not ILP revenue", id: "s_gmv" }),
      ]),
      row([tabs(["Board", "List"], "Board", "views"), row([input(undefined, { value: "All areas", select: true }), btn("Create from past handoffs", "secondary", "import", "sm")], "end")], "between"),
      board([
        {
          id: "c_identified",
          title: "Identified",
          cards: [
            { id: "o1", title: "S.A. clean-up before sale", meta: `${M.hiroshi} · US$1,200`, pill: p("Corporate", "neutral"), badge: p(`Send the proposal · ${dateIn(2)}`) },
            { id: "o2", title: "Marchamo and title transfer", meta: `${M.winona} · US$380`, pill: p("Vehicle") },
          ],
        },
        { id: "c_quoted", title: "Quoted", cards: [{ id: "o3", title: "Will and estate plan", meta: `${M.chloe} · US$950`, badge: p("Action overdue", "danger") }] },
        { id: "c_neg", title: "Negotiating", cards: [{ id: "o4", title: "Property purchase review", meta: `${M.imani} · US$2,400` }] },
        { id: "c_won", title: "Won", cards: [{ id: "o5", title: "Residency renewal", meta: `${M.asa} · US$650` }] },
        { id: "c_lost", title: "Lost", cards: [] },
      ]),
    ]),
    {
      title: "Opportunities",
      actions: [btn("New opportunity", "primary", "new", "sm")],
      overlays: [
        drawer(
          "drawer",
          "Property purchase review",
          [
            row([pill("Negotiating", "warning", "stagepill"), text(`Owner ${TEAM.csmEmail}`, "meta")], "start"),
            text("Estimated legal fees US$2,400 · Source: handoff after call", "meta"),
            input("New stage", { value: "Choose a stage", select: true, id: "newstage" }),
            input("Outcome", { multiline: true, placeholder: "Why it was lost, e.g. “Member chose a notary in Liberia.”", id: "outcome" }),
            row([btn("Mark won", "primary", "won"), btn("Mark lost", "danger", "lost")], "start"),
          ],
          M.imani,
        ),
      ],
    },
  );
}

export const staffOpportunities: Tutorial = {
  id: "staff.opportunities",
  version: 1,
  title: "Opportunities",
  summary: "Paid legal work beyond the membership, from first mention to won or lost.",
  audience: ["staff"],
  route: "/dashboard/opportunities",
  steps: [
    step(
      "summary",
      "Read the pipeline summary",
      "Values are legal fees (GMV), reported apart from membership revenue. Win rate and days to win show how quickly paid work closes.",
      scene(page(), [hover("s_open", [], 800), hover("s_gmv", [mark("s_gmv")], 1000)]),
      { target: "staff-opps-summary" },
    ),
    step(
      "board",
      "Move an opportunity on the board",
      "Drag a card to its new stage, or use Move to… on the card. A card with an overdue next action says so.",
      scene(page(), [hover("o3", [], 700), drag("o1", "c_quoted"), wait(800)]),
      { target: "staff-opps-board" },
    ),
    step(
      "close",
      "Close it with an outcome",
      "Open a card, pick the new stage and say what happened. Won or lost always needs an outcome, so no opportunity closes without a reason.",
      scene(page(), [
        click("o4", [open("drawer")], "Property purchase review"),
        click("newstage", [set("newstage", { value: "Won" })], "New stage"),
        type("outcome", "Member accepted the quote by email."),
        click("won", [shut("drawer"), { id: "o4", moveTo: "c_won" }], "Mark won"),
        wait(800),
      ]),
    ),
    step(
      "new",
      "Add one by hand",
      "New opportunity links paid work to its source, area and next action. Create from past handoffs picks up commercial notes lawyers already left.",
      scene(page(), [hover("import", [], 900), click("new", [], "New opportunity"), wait(600)]),
    ),
  ],
};

export default staffOpportunities;
