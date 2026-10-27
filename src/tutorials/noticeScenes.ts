/**
 * One-off mock scenes for Notice "Show me" buttons, where no tutorial step
 * covers the fix. Notices load this file only when "Show me" is pressed:
 *   fix={{ steps, scene: () => import("@/tutorials/noticeScenes").then((m) => m.placeholderData) }}
 */
import type { Scene } from "../components/tutorial/types";
import { MEMBERS as M, btn, card, click, grid, hover, list, mockShell, p, row, say, scene, set, stack, stat, text, toggle } from "./presets";

/** Staff Today: the placeholder-data notice and its "Exclude" switch. */
export const placeholderData: Scene = scene(
  mockShell(
    "staff",
    "Today",
    stack([
      card(
        "Placeholder data is loaded",
        [
          text("38 example members are in the database. Run scripts/removePlaceholders.ts to clear them."),
          row([toggle("Exclude placeholder data", false, "exclude", "checkbox")], "start"),
        ],
        { tone: "mist", id: "notice" },
      ),
      grid("2-1-1", [stat("Monthly recurring revenue", "US$3,679.54", { size: "lg", id: "mrr" }), stat("Open tasks", "12"), stat("Overdue", "3")]),
      card("My queue", [
        list(
          [
            { title: `Welcome call: ${M.imani}`, meta: "Due today", pill: p("Example", "neutral"), id: "t1" },
            { title: `Send proposal: ${M.hiroshi}`, meta: "Due tomorrow" },
          ],
          "rows",
          "queue",
        ),
      ]),
    ]),
    { title: "Today" },
  ),
  [
    say(hover("notice"), "Placeholder data is loaded", "This box appears while made-up example members are in the system. It is only shown to ILP staff.", ["placeholderData"]),
    say(
      click("exclude", [set("exclude", { on: true }), set("mrr", { value: "US$0.00" }), set("t1", { hidden: true })]),
      "Exclude placeholder data",
      "Hides the example members from your figures and your queue, so you see only real members.",
    ),
    say(hover("mrr"), "Figures update", "The numbers now count real members only. Turn the switch off to see the examples again."),
  ],
);

/** Member Money page: updating the card after a failed payment. */
export const updateCard: Scene = scene(
  mockShell(
    "client",
    "Money",
    stack([
      card(
        "Your last payment did not go through",
        [text("Your access continues for 7 days while you update your card."), row([btn("Update your card", "primary", "card", "sm")], "start")],
        { tone: "mist", id: "notice" },
      ),
      card("Your membership plan", [text("US$79.99 a month · 60 minutes, up to 3 calls")]),
    ]),
    { title: "Money" },
  ),
  [
    say(hover("notice"), "Payment did not go through", "Your bank or card refused the last monthly payment. Nothing is lost yet.", ["gracePeriod"]),
    say(click("card"), "Update your card", "Opens a secure payment page. Type the new card details there, then come back here."),
  ],
);
