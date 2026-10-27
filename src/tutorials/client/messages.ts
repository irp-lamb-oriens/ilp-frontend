import type { Tutorial } from "../../components/tutorial/types";
import {
  TEAM,
  btn,
  card,
  click,
  hidden,
  hide,
  hover,
  input,
  mark,
  message,
  mockShell,
  row,
  say,
  scene,
  set,
  show,
  stack,
  step,
  text,
  type,
  wait,
} from "../presets";

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
  version: 2,
  title: "Messages",
  summary: "Write to your ILP team, or ask the AI assistant a general question.",
  audience: ["client"],
  route: "/status/messages",
  steps: [
    step(
      "notice",
      "Read the AI notice once",
      "Messages gives you two ways to get answers: your ILP team, who are people, and an AI assistant, which is a computer program. A short notice explains the difference.",
      scene(page(), [
        say(hover("notice"), "Before you use the AI assistant", "The AI assistant gives general information. It can be wrong, and it is not your lawyer."),
        say(click("understand", [hide("notice")]), "I understand", "Confirms you have read the notice. You only do this once."),
      ]),
      { target: "client-ai-notice" },
    ),
    step(
      "team",
      "Write to your team",
      "Type your message and send it to your team. A person from your ILP team answers here, and you also get an email.",
      scene(page(), [
        wait(100, [hide("notice")]),
        say(hover("m1"), `${TEAM.csm} · ILP team`, "A message from the person at ILP who looks after you. Messages from people are labeled ILP team."),
        say(type("msg", "Where do I find the minute books?"), "Your message", "Write your question here in your own words, as you would in an email."),
        say(click("send", [show("m2"), set("msg", { value: "" })]), "Send to my team", "Sends your message to your ILP team. Their answer appears below it and comes by email too."),
        wait(900, [show("m3")]),
      ]),
      { target: "client-message-box" },
    ),
    step(
      "ai",
      "Ask the AI assistant",
      "For general questions, like what a word means, you can ask the AI assistant. Its answers are always labeled, and your team confirms anything legal.",
      scene(page(), [
        wait(100, [hide("notice")]),
        say(type("msg", "What is the marchamo?"), "Your message", "A general question like this one is a good fit for the AI assistant."),
        say(click("ai", [show("m4"), set("msg", { value: "" })]), "Ask the AI assistant", "Sends the question to the computer program instead of a person. It answers within seconds."),
        wait(900, [show("m5")]),
        say(hover("m5", [mark("m5")]), "AI assistant", "The answer is labeled AI assistant and says it is general information. Your team confirms anything important for you."),
      ]),
    ),
  ],
};

export default clientMessages;
