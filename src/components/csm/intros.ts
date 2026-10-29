/**
 * Page intros for the CSM portal (copy-rules.md, "what-how-why" order).
 * Written for a CSM on day one. Same shape as the staff intros, so the
 * staff ScreenIntro renders them.
 */
import type { StaffIntro } from "../dashboard/staff/intros";

export const CSM_INTROS = {
  today: {
    title: "Today",
    what: "Your day with your members. On top, how many tasks are late or due today. Below, your tasks with the late ones first, new members waiting for their welcome call, and members whose health score says they are at risk.",
    how: [
      "Start with the tasks marked late, then the ones due today. Click a task to see the member and close it with one line on what happened.",
      "Call every new member before their first contact is due (one business day after joining).",
      "Open each member under At risk and read the reasons on their health pill before you contact them.",
    ],
    why: "Members pay every month to hear from ILP on time. A late welcome call or a failed payment nobody follows up is how members leave in their first three months.",
    tutorialId: "csm.today",
    terms: ["csm", "book", "task", "healthScore", "firstContact", "digest"],
  },
  book: {
    title: "My book",
    what: "Every member you look after, with a health score from 0 to 100 and the reasons behind it, profile completeness, days since your last contact, calls used, deadlines and open quotes.",
    how: [
      "The list opens with the lowest scores first. Filter by health or membership, or search by name.",
      "Tick Show unassigned to see new members with no CSM yet, and take the ones that are yours from their page.",
      "Click a row to open the member's page, log a call, send a playbook email or create a task.",
    ],
    why: "The score turns a long list into an order of work: the members most likely to leave or miss a deadline come first.",
    tutorialId: "csm.today",
    terms: ["book", "healthScore", "consultationReady", "membership"],
  },
  member: {
    title: "Member",
    what: "One member's full record, the same page staff use, with your actions on the right: log a call or message, send a playbook email, and create or close tasks.",
    how: [
      "Read the health pill and its reasons, then the timeline, before you contact the member.",
      "After every call, message or email, log it with one line. It goes on the timeline and resets the days since contact.",
      "Send a playbook email when it fits. Members who unsubscribed do not get service emails; call them instead.",
    ],
    why: "Anyone on the team can pick up this member from here and give the same answer, and your notes are what the lawyer and staff read next.",
    tutorialId: "csm.today",
    terms: ["healthScore", "playbook", "timeline", "task", "handoff"],
  },
  onboarding: {
    title: "Onboarding",
    what: "Members who joined in the last 45 days and their four first steps: your first contact, a consultation-ready profile, a first call booked and a first call held.",
    how: [
      "Members with the fewest steps done are on top. A step marked Late needs you today.",
      "Make the first contact within one business day of joining and log it on the member's page.",
      "Help members reach 70% of their profile, then book their first call with them.",
    ],
    why: "Members who have a useful first call in their first two weeks are the ones who stay. This page shows who is stuck before it shows in the numbers.",
    tutorialId: "csm.today",
    terms: ["firstContact", "consultationReady", "profile", "consultation"],
  },
  calls: {
    title: "Calls",
    what: "Your members' calls: the next 14 days with a readiness check, calls that ended without a confirmed summary or handoff, and missed calls in the last 30 days.",
    how: [
      "Fix any red check before the call: profile, question for the lawyer, recording consent, lawyer and video link.",
      "For a call that needs wrap-up, ask the lawyer to confirm the summary and next steps.",
      "For a missed call, send the Missed call playbook email the same day and offer a new time.",
    ],
    why: "A call costs the member a third of their month. A ready member and a quick follow-up make it worth it.",
    tutorialId: "csm.today",
    terms: ["consultation", "recordingConsent", "handoff", "aiSummary"],
  },
  risk: {
    title: "Renewals and risk",
    what: "Members who may leave: renewals in the next 7 days, failed payments, cancellation requests, low ratings in the last 30 days and members with no activity for 30 days.",
    how: [
      "Failed payments first: call the member the same day and send the payment playbook email.",
      "For a cancellation request, call to understand why before the period ends.",
      "Before a renewal, check that the member used their calls this month and offer one if not.",
    ],
    why: "Keeping a member costs far less than finding a new one, and most members who leave were quiet for weeks first.",
    tutorialId: "csm.today",
    terms: ["renewal", "pastDue", "healthScore"],
  },
  deadlines: {
    title: "Deadlines",
    what: "Legal dates across your members in the next 60 days, plus deadlines that still need a date. These may require review by the member's lawyer.",
    how: [
      "Start with the closest dates. Make sure the member knows and has asked their lawyer if needed.",
      "Help members set a date where it says Needs a date.",
      "Open the member to see their full deadlines list.",
    ],
    why: "A missed renewal or filing date can cost a member a fine or their residency. Reminding them in time is part of what they pay for.",
    tutorialId: "csm.today",
    terms: ["obligation", "dimex"],
  },
  quotes: {
    title: "Quotes and opportunities",
    what: "Quotes your members have not answered yet, longest waiting first, and open opportunities for paid legal work with their next action.",
    how: [
      "Follow up on quotes waiting five days or more: ask whether the member has questions about the scope or price.",
      "Keep each opportunity's next action and date current, and close it as won or lost with the reason.",
    ],
    why: "Paid legal work is how members get their matter done. A quote nobody follows up is help the member wanted and did not get.",
    tutorialId: "csm.today",
    terms: ["quote", "opportunity", "proposal"],
  },
  messages: {
    title: "Messages",
    what: "What your members sent in the last 30 days: messages to the team and documents they uploaded. Unanswered items are on top.",
    how: [
      "Open the member and answer from their Messages page, or call if it is urgent.",
      "Check each upload is the document you asked for and close the related task.",
    ],
    why: "Members judge ILP by how fast someone answers. Same-day answers keep trust high.",
    tutorialId: "csm.today",
    terms: ["member"],
  },
  playbooks: {
    title: "Playbooks",
    what: "Checklists for the moments that come up again and again: welcome call, renewal check-in, failed payment and missed call. Each has an email you can send from a member's page.",
    how: [
      "Follow the steps in order the first few times. They are the same for every CSM.",
      "Edit an email's subject and paragraphs if the wording needs to change. Your edit applies to every CSM.",
      "Words in double braces, like {{firstName}}, are filled in for each member when the email is sent.",
    ],
    why: "Members get the same care whichever CSM they have, and new CSMs know what good looks like from day one.",
    tutorialId: "csm.today",
    terms: ["playbook"],
  },
  kpis: {
    title: "My KPIs",
    what: "How your book is doing: time to first contact, first contacts within one business day, follow-ups after a handoff on time, retention after 90 days, readiness after 7 days and tasks closed on time.",
    how: [
      "Read each figure with the line under it, which says how it is counted and the target.",
      "Use the lowest figure to choose what to improve this week.",
    ],
    why: "These are the habits that keep members. They describe your book, not a ranking against colleagues.",
    tutorialId: "csm.today",
    terms: ["firstContact", "handoff", "retention", "consultationReady"],
  },
} satisfies Record<string, StaffIntro>;

export type CsmIntroKey = keyof typeof CSM_INTROS;
