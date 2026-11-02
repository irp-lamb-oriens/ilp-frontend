/**
 * The three hero ledgers (HeroLedger.tsx), one per landing page. Each answers
 * the first question of its reader, using the same fictional people and
 * dates as the demo screens (tutorials/presets.ts, heroScreens.ts,
 * lawyerScreens.ts, csmScreens.ts), so the hero and the demos agree.
 *
 *   member (/)                 : which dates may apply to me, and what is next
 *   lawyer (/attorneys)        : who am I speaking to next
 *   CSM    (/customer-success) : what needs me today
 */
import { LAWYERS, MEMBERS, dateIn } from "@/tutorials/presets";
import type { LedgerData } from "./HeroLedger";

/** Next usual municipal tax installment (Mar 31, Jun 30, Sep 30, Dec 31), as in heroScreens.ts. */
function nextInstallment(now = new Date()): string {
  const y = now.getFullYear();
  const dates = [new Date(y, 2, 31), new Date(y, 5, 30), new Date(y, 8, 30), new Date(y, 11, 31), new Date(y + 1, 2, 31)];
  const next = dates.find((d) => d.getTime() >= now.getTime()) ?? dates[dates.length - 1];
  return next.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function memberLedger(): LedgerData {
  return {
    label: "Your dates",
    context: "Costa Rica",
    todayLabel: "Today",
    todayAt: 1,
    rows: [
      {
        when: dateIn(-5),
        title: "Call about the S.A. books",
        meta: `${LAWYERS.andrea} · 20 min`,
        status: { label: "Next steps sent", tone: "success" },
        state: "past",
      },
      {
        when: dateIn(6),
        title: "Corporate tax return (D-101)",
        meta: "Your S.A.",
        status: { label: "May require review", tone: "warning" },
        state: "next",
      },
      {
        when: nextInstallment(),
        title: "Municipal property tax",
        meta: "Your house in Nosara",
        status: { label: "May require review", tone: "warning" },
      },
      {
        when: dateIn(74),
        title: "Residency card renewal",
        meta: "Pensionado",
        status: { label: "Ask your lawyer" },
      },
    ],
    note: "General dates based on your answers. They are not legal advice.",
    caption: "Example: a member's dates in Costa Rica.",
  };
}

export function lawyerLedger(): LedgerData {
  return {
    label: "Today",
    context: "2 calls · 20 min each",
    todayLabel: "Now",
    todayAt: 0,
    rows: [
      {
        when: "9:30 am",
        title: MEMBERS.hiroshi,
        meta: "S.A. clean-up before sale · Profile 82%",
        status: { label: "Brief ready", tone: "accent" },
        state: "next",
      },
      {
        when: "11:00 am",
        title: MEMBERS.asa,
        meta: "Residency renewal · Profile 64%",
        status: { label: "Brief ready", tone: "accent" },
      },
      {
        when: dateIn(1),
        title: MEMBERS.joseLuis,
        meta: "Company · 10:00 am",
        status: { label: "Booked" },
      },
      {
        when: dateIn(2),
        title: MEMBERS.winona,
        meta: "Vehicle · 2:30 pm",
        status: { label: "Booked" },
      },
    ],
    note: "Each brief has the member's question, their profile facts and the dates coming up. You can join 10 minutes before the call.",
    caption: "Example: a partner lawyer's day in the portal.",
  };
}

export function csmLedger(): LedgerData {
  return {
    label: "Your tasks",
    context: "Late ones first",
    todayLabel: "Today",
    todayAt: 1,
    rows: [
      {
        when: dateIn(-1),
        title: "Payment failed: contact member",
        meta: `${MEMBERS.linda} · At risk · 40`,
        status: { label: "Late 1 day", tone: "danger" },
      },
      {
        when: "4:00 pm",
        title: "Welcome call and profile review",
        meta: `${MEMBERS.imani} · Watch · 71`,
        status: { label: "Due today", tone: "warning" },
        state: "next",
      },
      {
        when: dateIn(1),
        title: "Send the lawyer's next steps",
        meta: `${MEMBERS.priya} · Healthy · 92`,
        status: { label: `Due ${dateIn(1)}` },
      },
    ],
    note: "Each task names the member, the job and when it is due.",
    caption: "Example: a customer success manager's day. The members are fictional.",
  };
}
