import type { Tutorial } from "../../components/tutorial/types";
import {
  btn,
  card,
  click,
  dialog,
  grid,
  hover,
  list,
  meta,
  mockShell,
  open,
  p,
  row,
  say,
  scene,
  set,
  shut,
  stack,
  step,
  text,
  toast,
  toastOn,
  type,
} from "../presets";

const rights = card(
  "Your data and privacy",
  [
    meta("Download, correct or object to how we use your data. We answer within the legal time limit."),
    row([btn("Download my data", "primary", "download", "sm"), btn("Correct my data", "secondary", "correct", "sm"), btn("Object to a use of my data", "secondary", "object", "sm")], "start"),
  ],
  { id: "rights" },
);

const choices = card(
  "Your choices",
  [
    grid("2-1", [stack([text("Call recording", "strong"), meta("Last answer: yes. We ask you at each booking and before each call.")], 1), btn("Withdraw for upcoming calls", "secondary", "w_rec", "sm")]),
    grid("2-1", [stack([text("News and offers by email", "strong"), meta("You get them", "newsstate")], 1), btn("Stop news and offers", "secondary", "news", "sm")]),
    grid("2-1", [stack([text("AI assistant", "strong"), meta("You accepted the AI notice")], 1), btn("Withdraw", "secondary", "w_ai", "sm")]),
  ],
  { id: "choices" },
);

const requests = card("Your requests", [list([{ title: "Download of my data", meta: "Sent Oct 2", pill: p("Completed", "success") }], "plain")], { id: "requests" });

const danger = card("Delete my account", [meta("We delete your account and data, except records the law requires us to keep."), btn("Ask to delete my account", "danger", "delete", "sm")], { id: "danger" });

function page() {
  return mockShell("client", "Overview", stack([rights, grid("1-1", [choices, stack([requests, danger], 3)])]), {
    title: "Your data and privacy",
    overlays: [
      toast("toast", "Your download is starting"),
      dialog("confirm", "Ask to delete your account?", [
        text("Your ILP team confirms by email and finishes within the legal time limit.", "body"),
        row([btn("Keep my account", "secondary", "keep", "sm"), btn("Yes, delete my account", "danger", "yes", "sm")], "end"),
      ]),
    ],
  });
}

export const clientPrivacy: Tutorial = {
  id: "client.privacy",
  version: 2,
  title: "Your data and privacy",
  summary: "Get a copy of your data, change your choices, or ask to delete your account.",
  audience: ["client"],
  route: "/status/privacy",
  steps: [
    step(
      "download",
      "Download or correct your data",
      "You have rights over the personal information we keep about you. Here you can get a copy, ask us to fix it, or object to how we use it.",
      scene(page(), [
        say(click("download", [toastOn("toast")]), "Download my data", "Prepares a copy of everything we keep about you, as a file you can save. A short note says it has started."),
        say(hover("correct"), "Correct my data", "Tell us what is wrong, like a misspelled name, and we fix it."),
        say(hover("object"), "Object to a use of my data", "Ask us to stop using your information for something, for example for news emails."),
      ]),
      { target: "client-privacy-rights" },
    ),
    step(
      "choices",
      "Change your choices",
      "You decide about call recording, news by email and the AI assistant. You can change each one here at any time.",
      scene(page(), [
        say(hover("w_rec"), "Withdraw for upcoming calls", "Stops recording on your calls from now on. You are still asked before each call."),
        say(click("news", [set("news", { label: "Send me news and offers" }), set("newsstate", { text: "You do not get them" })]), "Stop news and offers", "Stops our news and offers emails. Messages about your calls and your case still arrive."),
        say(hover("w_ai"), "Withdraw", "Turns off the AI assistant for you. You can still write to your team as usual."),
      ]),
    ),
    step(
      "delete",
      "Ask to delete your account",
      "If you want to leave for good, you can ask us to delete your account. You confirm first, and your requests list shows how it is going.",
      scene(page(), [
        say(hover("requests"), "Your requests", "Everything you have asked for on this page, with where it stands, like Completed."),
        say(click("delete", [open("confirm")]), "Ask to delete my account", "Opens a box asking you to confirm. Nothing is deleted yet."),
        say(click("keep", [shut("confirm")]), "Keep my account", "Closes the box and changes nothing. Yes, delete my account would send the request."),
      ]),
    ),
  ],
};

export default clientPrivacy;
