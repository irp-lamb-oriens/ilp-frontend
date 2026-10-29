/**
 * Page intros for every staff screen (copy-rules.md, "what-how-why" order).
 * Written for a new hire on day one: what the screen is, what you do here
 * and what happens when you do, and why it matters to the business or the
 * member. `terms` are glossary keys shown under "Words on this screen".
 */
import type { TermKey } from "@/tutorials/glossary";

export interface StaffIntro {
  title: string;
  what: string;
  how: string[];
  why: string;
  tutorialId: string;
  terms?: TermKey[];
}

export const STAFF_INTROS = {
  today: {
    title: "Today",
    what: "Your work list for the day. The figures on top show how the membership business is doing, My queue lists the tasks given to you, and Needs attention lists members whose case may stall if nobody acts.",
    how: [
      "Read the figures on top. The line under each one shows its target or how it is counted.",
      "Open the first task in My queue. The most urgent one is on top, and a side panel shows the member's details.",
      "Do the job, then close the task with one line on what happened. That line goes on the member's timeline.",
      "Before you finish the day, open each member listed under Needs attention.",
    ],
    why: "Members pay US$79.99 a month to hear from ILP on time. Tasks closed with a clear outcome are how the team keeps that promise, and they are what keeps members past their third month.",
    tutorialId: "staff.today",
    terms: ["task", "csm", "mrr", "retention", "consultationReady", "handoff", "obligation", "quote"],
  },
  members: {
    title: "Members",
    what: "Every ILP member in one table: membership status, how complete their legal profile is, minutes used this month, renewal date and the CSM who looks after them.",
    how: [
      "Search by name or email, or filter by membership, CSM, readiness or country.",
      "Sort by name, join date, profile or renewal to bring the people who need you to the top.",
      "Click a row to open that member's full page.",
    ],
    why: "A member whose profile is not ready gets less from a call, and a member who is past due may leave. This list shows both groups before it is too late to help.",
    tutorialId: "staff.members",
    terms: ["member", "membership", "consultationReady", "profile", "csm", "pastDue", "renewal"],
  },
  member: {
    title: "Member",
    what: "One member's full record. On the left, their living legal profile, join answers, membership and documents. In the centre, their next step and everything that happened, newest first. On the right, open tasks, calls and paid legal work.",
    how: [
      "Check the profile bar. Below 70% the member is not consultation-ready, so ask them for the facts marked Missing.",
      "Read the timeline to see the last call, handoff and task before you contact them.",
      "Use Next actions to close a task, book a call or give the member a lawyer.",
      "Open a handoff from the timeline to check the lawyer's next steps and start any proposal.",
    ],
    why: "Anyone on the team can pick up this member from here without asking a colleague, so the member gets the same answer whoever they speak to.",
    tutorialId: "staff.member",
    terms: ["profile", "consultationReady", "membership", "nextStep", "handoff", "timeline", "opportunity"],
  },
  pipeline: {
    title: "Pipeline",
    what: "Every open legal matter, the stage it is in and how long it has been there. The Client CRM tab keeps the older client tools: stage actions, Lily and emails.",
    how: [
      "Pick a stage to see only the matters in it.",
      "Sort by In stage. A warning or overdue badge means the matter has stayed in that stage longer than its time limit.",
      "Click a matter to open the member's page and move it forward.",
      "To bring in clients from a spreadsheet, press Import clients.",
    ],
    why: "A matter that sits still is a member waiting for an answer. Catching it here, before the member has to ask, keeps their trust.",
    tutorialId: "staff.pipeline",
    terms: ["matter", "stage", "daysInStage", "sla", "crm", "lily"],
  },
  opportunities: {
    title: "Opportunities",
    what: "Paid legal work beyond the membership, such as a property transfer or a company clean-up, from the first mention on a call to won or lost. Values are legal fees and only staff see them.",
    how: [
      "Read the summary: open value, win rate, and what was won in legal fees and in ILP revenue.",
      "Filter by owner or legal area, then work the board from left to right.",
      "Drag a card to its new stage, or open it to set the next action and its date.",
      "Close it as won or lost with a reason, so the result is on record.",
    ],
    why: "Most members need some paid legal work after a call. An opportunity with an owner and a dated next action gets done; one without them is easy to forget.",
    tutorialId: "staff.opportunities",
    terms: ["opportunity", "quote", "legalFees", "winRate", "pipeline", "revenue"],
  },
  lawyers: {
    title: "Lawyers",
    what: "The partner lawyers who take member calls: how much work each one has, who has applied to join, their weekly hours, and which members still need a lawyer.",
    how: [
      "Check Capacity to see who has room. Aging counts matters that have stayed 14 days or more in one stage.",
      "Review new lawyers in Applications: approve, ask for changes or decline.",
      "Give members without a lawyer one in Assignment, picking someone with room.",
      "Change a lawyer's weekly hours in Hours when they ask you to.",
    ],
    why: "A member cannot book a call until they have a lawyer, and an overloaded lawyer answers late. Spreading the work here keeps calls on time.",
    tutorialId: "staff.lawyers",
    terms: ["partnerLawyer", "capacity", "matter", "daysInStage"],
  },
  finance: {
    title: "Finance",
    what: "ILP's money. Membership revenue (what members pay ILP) is shown apart from legal fees (what members pay for extra legal work), and the two are never added together.",
    how: [
      "Read MRR first: active members times US$79.99.",
      "Compare membership revenue with legal fees for the last 30 days.",
      "Use the charts below to see quote revenue, cost and margin by lawyer, service and route.",
    ],
    why: "Membership revenue pays for ILP. Most legal fees belong to the lawyers who do the work, so adding them in would make ILP look bigger than it is.",
    tutorialId: "staff.finance",
    terms: ["mrr", "arr", "revenue", "legalFees", "margin", "winRate"],
  },
  reports: {
    title: "Reports",
    what: "How people find ILP and move through it: the member funnel from the free check to paid member, how members rate ILP, the pipeline by stage, activity and where clients come from. Admins also see the sales report.",
    how: [
      "Start with Member funnel to see how many people reach each step and where most of them stop.",
      "Open the other tabs for pipeline counts, stage ratings, activity and sources.",
      "Look for membership figures such as MRR on Today, not here.",
    ],
    why: "These numbers show where people drop off. If many take the free check and few join, the team knows where to look first.",
    tutorialId: "staff.reports",
    terms: ["funnel", "freeCheck", "nps", "stage"],
  },
  journeys: {
    title: "Journeys",
    what: "How people move through the ILP website and app: how many reach each step from first visit to renewal, where they stop, how long each page takes, how outbound campaigns convert, and the A/B tests the team runs.",
    how: [
      "Pick the dates and, if you want, a source, channel, country, device or test. The filters stay in the link, so you can share the view.",
      "Start with Overview. Biggest leaks names the three steps that lose the most future members.",
      "Open Stuck to see who is stuck now and create a follow-up task for them.",
      "Use Experiments to compare versions of a page. Admins create, start and stop tests; everyone can read results.",
    ],
    why: "Knowing where people stop shows what to fix first so more visitors become members, instead of guessing.",
    tutorialId: "staff.journeys",
    terms: ["funnel", "dropOff", "dwellTime", "experiment", "variant", "confidence", "srm"],
  },
  settings: {
    title: "Settings",
    what: "Settings shared by the whole team: the name and time limit of each matter stage, the queue of emails waiting to go out, and the vendor list.",
    how: [
      "In Stages, rename a stage or change its SLA days, then press Save on that row.",
      "In Email queue, check the emails the system has written before they are sent.",
      "In Vendors, keep the list of outside suppliers up to date.",
    ],
    why: "A change here reaches every member and lawyer at once. Stage names appear on member timelines, and SLA days decide when a matter is flagged as late.",
    tutorialId: "staff.settings",
    terms: ["stage", "sla", "emailQueue"],
  },
  privacy: {
    title: "Privacy requests",
    what: "Requests from members to see, correct, object to or delete the personal data ILP keeps about them, each with the date ILP must answer by.",
    how: [
      "Open the request with the nearest answer-by date first.",
      "Confirm it is really the member before you act.",
      "Write your answer in plain words and complete the request. The member gets it by email.",
      "For a deletion, read what the system will delete and what it must keep, then run it.",
    ],
    why: "The law gives ILP a fixed time to answer. Answering on time, and keeping a record of it, protects the member and ILP.",
    tutorialId: "staff.privacy",
    terms: ["privacyRequest", "personalData", "anonymize", "auditLog"],
  },
} satisfies Record<string, StaffIntro>;

export type StaffIntroKey = keyof typeof STAFF_INTROS;
