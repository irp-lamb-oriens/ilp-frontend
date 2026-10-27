import type { Tutorial } from "../../components/tutorial/types";
import {
  btn,
  card,
  click,
  hover,
  input,
  list,
  mark,
  mockShell,
  row,
  say,
  scene,
  set,
  stack,
  step,
  toggle,
  type,
} from "../presets";

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
              { title: "Your profile and documents stay in your account.", id: "kept" },
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
  version: 2,
  title: "Cancel your membership",
  summary: "What happens if you cancel, and how to do it.",
  audience: ["client"],
  route: "/status/money/cancel",
  steps: [
    step(
      "what",
      "Read what happens first",
      "Before anything changes, this page explains what cancelling means for you. Take your time.",
      scene(page(), [
        say(hover("what", [mark("what")]), "What happens", "Your membership stays active until the end of this month. After that, there are no more monthly charges."),
        say(hover("kept", [mark("what", false)]), "Your profile and documents stay", "Nothing you shared with us is lost. If you come back later, it is all still here."),
      ]),
      { target: "client-cancel-what" },
    ),
    step(
      "why",
      "Tell us why, if you like",
      "Choosing a reason is optional. It helps your ILP team learn what to improve.",
      scene(page(), [
        say(click("r1", [set("r1", { on: true })]), "I am moving back home", "Tick any reasons that fit. You can tick more than one, or none at all."),
        say(type("comment", "Thank you for the help with my residency."), "Anything you would like us to know", "An optional note in your own words. Your ILP team reads every one."),
      ]),
    ),
    step(
      "choose",
      "Keep or cancel",
      "The choice is yours. Keeping your membership changes nothing. Cancel membership confirms that you want to leave.",
      scene(page(), [
        say(hover("keep"), "Keep my membership", "Takes you back. Nothing changes, and nothing extra is charged."),
        say(hover("cancel", [mark("actions")]), "Cancel membership", "Confirms that you want to cancel. Your membership stays active until the end of this month."),
      ]),
    ),
  ],
};

export default clientCancel;
