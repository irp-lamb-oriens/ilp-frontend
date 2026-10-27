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
  say,
  scene,
  set,
  show,
  shut,
  stack,
  stat,
  step,
  tabs,
  text,
  type,
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
  version: 2,
  title: "Opportunities",
  summary: "Paid legal work beyond the membership, from first idea to won or lost.",
  audience: ["staff"],
  route: "/dashboard/opportunities",
  steps: [
    step(
      "summary",
      "Read the summary",
      "An opportunity is a chance to do paid legal work for a member, beyond the membership. The numbers on top show how much work is on offer and how often members say yes.",
      scene(page(), [
        say(hover("s_open"), "Open pipeline", "The total price of all offers still waiting for a yes or a no. Nine are open right now."),
        say(hover("s_win"), "Win rate", "Out of the offers that were decided, how many members said yes. Here it is 5 of 12."),
        say(hover("s_gmv", [mark("s_gmv")]), "Won legal fees", "Money members agreed to pay for lawyers' work. Most of it goes to the lawyer, so it is not counted as ILP's own income.", ["legalFees"]),
      ]),
      { target: "staff-opps-summary" },
    ),
    step(
      "board",
      "Move an opportunity on the board",
      "Each column is a stage, from first idea on the left to won or lost on the right. Move a card when the situation changes.",
      scene(page(), [
        say(hover("o3"), "Action overdue", "This card's next job is late. The label on the card says so in words, so it is easy to spot.", ["card"]),
        say(drag("o1", "c_quoted"), "S.A. clean-up before sale", "Drag a card to the next column when it moves on. Here the price was sent, so it goes to Quoted."),
      ]),
      { target: "staff-opps-board" },
    ),
    step(
      "close",
      "Close it with an outcome",
      "Click a card to open its details. Pick the new stage and write what happened. Won or lost always needs a reason, so the team can learn from it.",
      scene(page(), [
        say(click("o4", [open("drawer")]), "Property purchase review", "Opens the details in a side panel: who owns it, the estimated fee and where it came from."),
        say(click("newstage", [set("newstage", { value: "Won" })]), "New stage", "Pick where it goes now. Won means the member said yes; Lost means they said no."),
        say(type("outcome", "Member accepted the quote by email."), "Outcome", "One line on why it was won or lost, so the team learns what works."),
        say(click("won", [shut("drawer"), { id: "o4", moveTo: "c_won" }]), "Mark won", "Closes the opportunity as won. The card moves to the Won column."),
      ]),
    ),
    step(
      "new",
      "Add one by hand",
      "Most opportunities come from a lawyer's notes after a call. You can also add one yourself, for example when a member mentions new work on the phone.",
      scene(page(), [
        say(hover("import"), "Create from past handoffs", "Reads the notes lawyers left after past calls. It makes a card for each piece of paid work they mentioned."),
        say(hover("views"), "Board and List", "Board shows cards in columns. List shows the same opportunities as a table you can sort."),
        say(click("new"), "New opportunity", "Opens a short form: the member, the kind of law, the estimated fee and the next job to do."),
      ]),
    ),
  ],
};

export default staffOpportunities;
