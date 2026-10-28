import type { Tutorial } from "../../components/tutorial/types";
import { MEMBERS as M, TEAM, btn, card, click, dateIn, grid, hidden, hover, input, list, mark, message, meta, mockShell, p, pill, row, say, scene, scroll, set, show, stack, step, text, toast, toastOn, type, wait } from "../presets";

/**
 * "During and after a call", for lawyers on the /attorneys landing: recording
 * consent, the AI-suggested summary the lawyer confirms, and the hand-off to
 * the member's customer success manager. Same flow as lawyer.call, with
 * captions for someone new to the portal.
 */

const SUMMARY = "You can sell once the S.A. books are updated. Send the books and I will list what is missing.";

const callPage = mockShell(
  "lawyer",
  "Today",
  grid("1-1", [
    card(
      "Recording",
      [
        meta("Ask the member at the start. Nothing is recorded until they agree."),
        row([btn("Member agreed", "secondary", "agree", "sm"), btn("Member declined", "secondary", "decline", "sm"), hidden(pill("Recording allowed", "success", "consent_ok"))], "start"),
        row([btn("Start recording", "primary", "rec", "sm"), meta("Locked until the member agrees.")], "start", 2),
      ],
      { id: "consent" },
    ),
    card(
      "Summary for the member",
      [
        row([btn("Draft summary", "secondary", "draft", "sm"), hidden(pill("Suggested: check it", "warning", "suggested"))], "start"),
        input(undefined, { multiline: true, placeholder: "What you discussed and concluded, in plain words.", id: "summary" }),
        text("Next steps", "label"),
        list(
          [
            { id: "s1", title: "Send the S.A. minute books", meta: `Member · by ${dateIn(7)}`, pill: p("Member", "info") },
            { id: "s2", title: "Review the books and list what is missing", meta: `Lawyer · by ${dateIn(14)}`, pill: p("Lawyer") },
          ],
          "plain",
          "steps",
        ),
        row([meta("Minutes used 20", "minutes"), btn("Confirm and hand off", "primary", "handoff")], "between"),
      ],
      { id: "summarycard" },
    ),
  ]),
  { title: `Call with ${M.hiroshi}`, overlays: [toast("toast", "Summary confirmed and handed off")] },
);

const followPage = mockShell(
  "lawyer",
  "Clients",
  stack([
    card(
      `${M.hiroshi} · after the call`,
      [
        row([text("Summary", "strong"), pill("Confirmed by you", "success", "confirmed")], "between"),
        text(SUMMARY, "body"),
        message("team", `${TEAM.csm} · ILP customer success`, "Thanks. I sent Hiroshi the next steps and asked for the minute books. I will prepare the quote for the clean-up once you list the work.", dateIn(0), "csm"),
      ],
      { id: "after" },
    ),
    card("Paid work", [row([text("S.A. clean-up before sale", "strong"), pill("Quote in progress", "info", "quote")], "between"), meta("You set the scope and your fee. The member accepts before work starts.")], { id: "paid" }),
  ]),
  { title: "Follow-up" },
);

export const publicLawyerCall: Tutorial = {
  id: "public.lawyer-call",
  version: 1,
  title: "During and after a call",
  summary: "Recording only with consent, a suggested summary you confirm, then ILP's customer success manager takes the follow-up.",
  audience: ["public"],
  autoStart: "never",
  steps: [
    step(
      "consent",
      "Record only with consent",
      "ILP records a call only when the member agrees. You ask at the start and note the answer.",
      scene(callPage, [
        say(hover("rec"), "Start recording", "Stays locked until the member says yes. This protects the member and you.", ["recordingConsent"]),
        say(click("agree", [show("consent_ok"), set("agree", { variant: "primary" })]), "Member agreed", "Press this when the member says yes. If they say no, take your own notes instead."),
      ]),
    ),
    step(
      "summary",
      "Check the suggested summary",
      "After a recorded call, a computer program drafts a summary from the transcript. It stays marked as suggested until you check it.",
      scene(callPage, [
        wait(100, [show("consent_ok")]),
        say(click("draft", [show("suggested")]), "Draft summary", "The draft is a starting point. You correct anything that is wrong or missing.", ["aiSummary", "transcript"]),
        say(type("summary", SUMMARY), "Summary for the member", "Write it in plain words. The member reads it after you confirm."),
        say(hover("s1", [mark("s1")]), "Next steps", "Each step says who does it and by when: the member, you or the ILP team."),
      ]),
    ),
    step(
      "handoff",
      "Confirm and hand off",
      "One button sends your confirmed summary and steps to the member and to their customer success manager.",
      scene(callPage, [
        wait(100, [show("consent_ok"), show("suggested"), set("summary", { value: SUMMARY })]),
        scroll("summarycard"),
        say(
          click("handoff", [set("suggested", { label: "Confirmed", tone: "success" }), set("handoff", { label: "Handed off", disabled: true }), toastOn("toast")]),
          "Confirm and hand off",
          "Nothing reaches the member until you confirm. After that, the ILP team follows up.",
          ["handoff"],
        ),
      ]),
    ),
    step(
      "followup",
      "ILP follows up",
      "The customer success manager sends the next steps and chases documents. If paid work is needed, they prepare the quote with you.",
      scene(followPage, [
        say(hover("csm", [mark("csm")]), TEAM.csm, "The member's customer success manager handles reminders and questions about price, so you do not have to.", ["csm"]),
        say(hover("quote", [mark("csm", false), mark("paid")]), "Quote in progress", "Work beyond the call is quoted separately. The member says yes or no before anything starts.", ["quote"]),
      ]),
    ),
  ],
};

export default publicLawyerCall;
