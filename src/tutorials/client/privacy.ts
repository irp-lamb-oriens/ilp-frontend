import type { Tutorial } from "../../components/tutorial/types";
import { btn, card, click, dialog, grid, hover, list, mark, meta, mockShell, open, p, row, scene, set, shut, stack, step, text, toast, toastOn, wait }  from "../presets";

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
  version: 1,
  title: "Your data and privacy",
  summary: "Download, correct, choices and deletion.",
  audience: ["client"],
  route: "/status/privacy",
  steps: [
    step(
      "download",
      "Download or correct your data",
      "Select Download my data for a copy of everything we hold. Use Correct my data if something is wrong.",
      scene(page(), [click("download", [toastOn("toast")], "Download my data"), hover("correct", [], 900)]),
      { target: "client-privacy-rights" },
    ),
    step(
      "choices",
      "Change your choices",
      "You decide about call recording, news by email and the AI assistant. Each one can be withdrawn here at any time.",
      scene(page(), [hover("w_rec", [], 800), click("news", [set("news", { label: "Send me news and offers" }), set("newsstate", { text: "You do not get them" })], "Stop news and offers"), wait(800)]),
    ),
    step(
      "delete",
      "Ask to delete your account",
      "If you want to leave for good, select Ask to delete my account. You confirm first, and your requests list shows its progress.",
      scene(page(), [
        hover("danger", [mark("danger")], 900),
        click("delete", [open("confirm")], "Ask to delete my account"),
        hover("keep", [], 800),
        click("keep", [shut("confirm")], "Keep my account"),
        wait(500),
      ]),
    ),
  ],
};

export default clientPrivacy;
