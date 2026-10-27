import type { Tutorial } from "../../components/tutorial/types";
import { btn, card, click, hover, input, list, mark, mockShell, row, scene, set, stack, step, toggle, type, wait }  from "../presets";

function page() {
  return mockShell(
    "client",
    "Money",
    stack([
      card(
        "What happens",
        [
          list(
            [
              { title: "Your membership stays active until the end of this month." },
              { title: "No more monthly charges after that." },
              { title: "Your profile and documents stay in your account." },
            ],
            "plain",
          ),
        ],
        { id: "what" },
      ),
      card(
        "Why are you leaving?",
        [
          toggle("I am moving back home", false, "r1", "checkbox"),
          toggle("I did not use the calls", false, "r2", "checkbox"),
          toggle("The price", false, "r3", "checkbox"),
          input("Anything you would like us to know (optional)", { multiline: true, id: "comment" }),
        ],
        { id: "why" },
      ),
      row([btn("Keep my membership", "primary", "keep"), btn("Cancel membership", "danger", "cancel")], "start", 3, "actions"),
    ]),
    { title: "Cancel your membership" },
  );
}

export const clientCancel: Tutorial = {
  id: "client.cancel",
  version: 1,
  title: "Cancel your membership",
  summary: "What happens if you cancel, and how.",
  audience: ["client"],
  route: "/status/money/cancel",
  steps: [
    step(
      "what",
      "Read what happens first",
      "Cancelling stops future charges. Your profile and documents stay in your account.",
      scene(page(), [hover("what", [mark("what")], 1500)]),
      { target: "client-cancel-what" },
    ),
    step(
      "why",
      "Tell us why, if you like",
      "Picking a reason is optional. It helps your ILP team improve.",
      scene(page(), [click("r1", [set("r1", { on: true })], "I am moving back home"), type("comment", "Thank you for the help with my residency."), wait(500)]),
    ),
    step(
      "choose",
      "Keep or cancel",
      "Keep my membership takes you back with nothing changed. Cancel membership confirms the cancellation.",
      scene(page(), [hover("keep", [], 1000), hover("cancel", [mark("actions")], 1000), wait(400)]),
    ),
  ],
};

export default clientCancel;
