import type { Tutorial } from "../../components/tutorial/types";
import { btn, card, chip, click, hidden, hide, hover, input, mark, meta, mockPhone, row, scene, set, show, stack, step, text, type, wait } from "../presets";

const scale = row(
  Array.from({ length: 11 }, (_, i) => chip(String(i), false, `n${i}`)),
  "start",
  1,
  "scale",
);

function page() {
  return mockPhone("Overview", "One question", [
    stack(
      [
        card(undefined, [
          text("How likely are you to recommend ILP to a friend living abroad?", "strong"),
          scale,
          row([meta("0 · Not likely"), meta("10 · Very likely")], "between"),
        ]),
        input("What is the main reason for your answer? (optional)", { multiline: true, id: "reason" }),
        btn("Send", "primary", "send"),
      ],
      3,
      "form",
    ),
    hidden(card("Thank you", [text("Thank you for telling us more.", "body"), btn("Back to your ILP home", "secondary")], { tone: "accent", id: "thanks" })),
  ]);
}

export const clientFeedback: Tutorial = {
  id: "client.feedback",
  version: 1,
  title: "One question",
  summary: "The monthly question about ILP.",
  audience: ["client"],
  route: "/status/feedback",
  steps: [
    step(
      "pick",
      "Pick a number",
      "Once a month we ask one question. Pick a number from 0 to 10; your answer is saved straight away.",
      scene(page(), [hover("n7", [], 600), click("n9", [set("n9", { selected: true })], "9"), wait(700)], "phone"),
      { target: "client-feedback-scale" },
    ),
    step(
      "reason",
      "Add a reason if you like",
      "Writing a reason is optional. It helps your ILP team understand what to keep and what to fix.",
      scene(page(), [wait(100, [set("n9", { selected: true })]), type("reason", "Fast answers about my residency."), wait(600)], "phone"),
    ),
    step(
      "send",
      "Send it",
      "Select Send. That is all; you can go back to your ILP home.",
      scene(page(), [wait(100, [set("n9", { selected: true }), set("reason", { value: "Fast answers about my residency." })]), click("send", [hide("form"), show("thanks")], "Send"), hover("thanks", [mark("thanks")], 900)], "phone"),
    ),
  ],
};

export default clientFeedback;
