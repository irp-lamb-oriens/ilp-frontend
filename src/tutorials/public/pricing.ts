import type { Tutorial } from "../../components/tutorial/types";
import { FEE, LAWYERS as L, btn, card, click, dateIn, grid, hover, list, mark, meta, mockShell, p, pill, progress, row, say, scene, set, stack, step, text } from "../presets";

/**
 * "What you pay and what's included", for visitors near the homepage
 * pricing. The member's Money page with placeholder data: the plan and
 * activation fee, the monthly minutes and calls, and a quote for extra legal
 * work that the member accepts or declines. Prices come from docs/PLAN.md
 * (PLAN_STANDARD in lib/contracts.ts).
 */

const plan = card(
  "Your membership plan",
  [
    row([pill("Active", "success"), text(`${FEE} a month`, "strong", "monthly")], "start", 2),
    list(
      [
        { id: "c1", title: "Monthly membership", meta: `Renews ${dateIn(18)}`, trailing: FEE, pill: p("To pay", "warning") },
        { id: "c2", title: "Activation fee", meta: "Paid once, when you joined", trailing: "US$100.00", pill: p("Paid", "success") },
      ],
      "rows",
      "charges",
    ),
  ],
  { id: "plan" },
);

const included = card(
  "Included every month",
  [
    progress("Minutes left this month", 1, "60 of 60 minutes left", "accent", "minutes"),
    meta("Up to 3 calls of 20 minutes. Unused minutes do not carry over.", "calls"),
    list(
      [
        { title: "A brief prepared from your profile before each call" },
        { title: "Follow-up on next steps from your ILP team" },
        { title: "Your living legal profile and reminders before the dates that apply to you" },
      ],
      "plain",
      "extras",
    ),
  ],
  { id: "included" },
);

const proposal = card(
  "Proposal for extra legal work",
  [
    row([text("Transfer of a car into your name", "strong"), pill("Waiting for you", "warning", "qstate")], "between"),
    meta(`US$350 · ${L.mauricio}`),
    text("What this covers", "label"),
    list([{ title: "Check the car's registry record" }, { title: "Prepare and file the transfer" }], "plain"),
    row([btn("Accept this proposal", "primary", "accept"), btn("Decline", "secondary", "decline")], "start"),
  ],
  { id: "proposal" },
);

function page() {
  return mockShell("client", "Money", stack([grid("1-1", [plan, included]), proposal]), { title: "Money" });
}

export const publicPricing: Tutorial = {
  id: "public.pricing",
  version: 1,
  title: "What you pay and what's included",
  summary: "The monthly fee, the one-time activation, the calls included and how quotes for extra legal work work.",
  audience: ["public"],
  autoStart: "never",
  steps: [
    step(
      "plan",
      "One plan with a monthly fee",
      `Membership costs ${FEE} a month. When you join, you also pay a one-time activation fee of US$100.`,
      scene(page(), [
        say(hover("monthly", [mark("plan")]), `${FEE} a month`, "The monthly fee. It is the same every month and covers everything in the box next to it."),
        say(hover("c2"), "Activation fee", "Paid once, when you join. It covers setting up your legal profile and your welcome call with the ILP team.", ["activationFee"]),
        say(hover("c1", [mark("plan", false)]), "Monthly membership", "Shows whether this month is paid. Your ILP team sends payment instructions by email."),
      ]),
    ),
    step(
      "included",
      "What the monthly fee includes",
      "Each month includes up to 60 minutes with your lawyer, split into up to three 20-minute calls. Your ILP team and your profile are included too.",
      scene(page(), [
        say(hover("minutes", [mark("included")]), "60 minutes a month", "Up to three 20-minute video calls with a lawyer licensed in Costa Rica."),
        say(hover("calls"), "Unused minutes do not carry over", "The minutes start again each month on your renewal date. Minutes you did not use are not added to the next month."),
        say(hover("extras", [mark("included", false)]), "Also included", "Your profile, the brief your lawyer reads before each call, reminders and follow-up from your team."),
      ]),
    ),
    step(
      "quotes",
      "Extra legal work is quoted first",
      "Drafting, filings and other legal work cost extra. Your lawyer writes a quote, and you decide whether to go ahead.",
      scene(page(), [
        say(hover("proposal", [mark("proposal")]), "Proposal for extra legal work", "A written quote for one job, with the price and what it covers. Here it is moving a car into your name.", ["quote"]),
        say(hover("decline", [mark("proposal", false)]), "Decline", "Say no and nothing is charged. Your membership stays the same."),
        say(click("accept", [set("qstate", { label: "Accepted", tone: "success" })]), "Accept this proposal", "Say yes and the work starts. Nothing starts and nothing is charged before you accept."),
      ]),
    ),
  ],
};

export default publicPricing;
