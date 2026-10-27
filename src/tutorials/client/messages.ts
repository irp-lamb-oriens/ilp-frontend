import type { Tutorial } from "../../components/tutorial/types";
import { TEAM, btn, card, click, hidden, hide, hover, input, mark, message, mockShell, row, scene, set, show, stack, step, text, type, wait }  from "../presets";

const notice = card(
  "Before you use the AI assistant",
  [
    text("It gives general information, not legal advice, and it can be wrong. It is not your lawyer.", "body"),
    text("Its answers are labeled AI assistant. Your ILP team confirms anything legal.", "body"),
    row([btn("I understand", "primary", "understand"), text("How ILP uses AI", "meta")], "start"),
  ],
  { tone: "accent", id: "notice" },
);

const thread = stack(
  [
    message("team", `${TEAM.csm} · ILP team`, "Hi Linda, your lawyer confirmed the next step: send the S.A. minute books by Friday.", "Yesterday 4:12 pm", "m1"),
    hidden(message("me", "You", "Where do I find the minute books?", "Just now", "m2")),
    hidden(message("team", `${TEAM.csm} · ILP team`, "Your accountant or the notary who set up the S.A. usually keeps them. I can ask for you.", "Just now", "m3")),
    hidden(message("me", "You", "What is the marchamo?", "Just now", "m4")),
    hidden(message("ai", "AI assistant", "The marchamo is the yearly vehicle circulation permit in Costa Rica, usually paid by December 31.", "This is general information, not legal advice. Your team will confirm.", "m5")),
  ],
  3,
  "thread",
);

function page() {
  return mockShell(
    "client",
    "Messages",
    stack([
      notice,
      thread,
      input("Your message", { multiline: true, id: "msg" }),
      row([btn("Send to my team", "primary", "send"), btn("Ask the AI assistant", "secondary", "ai")], "start"),
    ]),
    { title: "Messages" },
  );
}

export const clientMessages: Tutorial = {
  id: "client.messages",
  version: 1,
  title: "Messages",
  summary: "Write to your ILP team, or ask the AI assistant.",
  audience: ["client"],
  route: "/status/messages",
  steps: [
    step(
      "notice",
      "Read the AI notice once",
      "Before you use the AI assistant, read the short notice and select I understand. You only do this once.",
      scene(page(), [hover("notice", [], 900), click("understand", [hide("notice")], "I understand"), wait(700)]),
      { target: "client-ai-notice" },
    ),
    step(
      "team",
      "Write to your team",
      "Type your message and select Send to my team. A person from your ILP team answers here and by email.",
      scene(page(), [
        wait(100, [hide("notice")]),
        type("msg", "Where do I find the minute books?"),
        click("send", [show("m2"), set("msg", { value: "" })], "Send to my team"),
        wait(900, [show("m3")]),
        wait(800),
      ]),
      { target: "client-message-box" },
    ),
    step(
      "ai",
      "Ask the AI assistant",
      "For general questions, select Ask the AI assistant. Its answers are labeled AI assistant, and your team confirms anything legal.",
      scene(page(), [
        wait(100, [hide("notice")]),
        type("msg", "What is the marchamo?"),
        click("ai", [show("m4"), set("msg", { value: "" })], "Ask the AI assistant"),
        wait(900, [show("m5")]),
        hover("m5", [mark("m5")], 1000),
      ]),
    ),
  ],
};

export default clientMessages;
