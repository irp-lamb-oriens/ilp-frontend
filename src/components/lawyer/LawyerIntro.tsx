"use client";

import { useContext } from "react";
import { PageIntro } from "@/components/ui";
import { LawyerContext } from "./LawyerContext";
import { inReview } from "./ApplicationStatus";
import s from "./LawyerIntro.module.scss";

/**
 * Compact page intros for the lawyer portal (copy-rules.md: what, how, why on
 * working screens). Each one collapses and the choice is remembered per screen
 * (PageIntro `storageKey`). Today has a second version for lawyers whose
 * application is still in review.
 */
export type LawyerScreen = "today" | "board" | "clients" | "call" | "finance" | "availability" | "profile";

interface IntroCopy {
  title: string;
  what: string;
  how: string[];
  why: string;
  tutorialId?: string;
  /** Start collapsed the first time (the call page keeps the brief on one screen). */
  collapsed?: boolean;
}

export const LAWYER_INTROS: Record<LawyerScreen | "todayReview", IntroCopy> = {
  today: {
    title: "Your calls with members",
    what: "Today lists your 20-minute video calls with ILP members, in time order. Each call opens a one-screen brief built from the member's legal profile.",
    how: [
      "Open a call to read the brief: the member's question and the facts on file.",
      "Join from the call page and ask whether you may record the call.",
      "After the call, check the suggested summary, add the next steps and confirm.",
      "The member's customer success manager (CSM) at ILP takes the follow-up from there.",
    ],
    why: "You start each call knowing the facts, and ILP handles reminders, quotes and paperwork with the member. The member leaves with a written answer they can act on.",
    tutorialId: "lawyer.today",
  },
  todayReview: {
    title: "Your application is in review",
    what: "This is your partner lawyer portal. While ILP reviews your application you can look around and finish your profile. Members cannot book you yet.",
    how: [
      "Check your weekly hours on the Availability page.",
      "Work through the checklist below.",
      "ILP checks your carné with the Colegio and reads your answers.",
      "We email you when you can take calls. Your calls then appear on this page.",
    ],
    why: "Once you are approved, members can book you inside the hours you set, with nothing else to set up.",
    tutorialId: "lawyer.today",
  },
  board: {
    title: "Your matters by stage",
    what: "Every matter assigned to you, in columns by stage. A matter is one legal topic for one member, such as a residency renewal or a property transfer.",
    how: [
      "Read the labels on each card: days in this stage, overdue dates and dates due within 14 days.",
      "Drag a card to its new stage, or use Move to, which also works with the keyboard.",
      "Open a card for the brief, notes, quotes, deadlines and documents.",
    ],
    why: "The member sees their stage in plain words on their home page, and the ILP team sees what is waiting on you before a date is missed.",
    tutorialId: "lawyer.board",
  },
  clients: {
    title: "Members you work with",
    what: "One row per matter for every member assigned to you, with the stage, deadlines and next call.",
    how: [
      "Search by name, matter or area. The search box in the top bar opens this list from any page.",
      "Sort a column to see what is oldest or due first.",
      "Open a row for the member's brief, notes, quotes, deadlines and documents.",
    ],
    why: "You find a member's file in seconds, before a call or when they write to you.",
    tutorialId: "lawyer.clients",
  },
  call: {
    title: "Before, during and after the call",
    what: "The brief on the left is what ILP has on file for this member. The numbered steps on the right take you through the call.",
    how: [
      "Read the brief and the member's question before the start.",
      "Join the call and ask whether you may record it, then press Member agreed or Member declined.",
      "After the call, get the transcript or write the summary yourself, and add up to five next steps.",
      "Press Confirm and hand off. The member sees the summary, and their CSM follows up on the next steps.",
    ],
    why: "Nothing reaches the member until you confirm it, so the advice on file is always yours. After the hand-off, ILP sends the reminders and quotes, not you.",
    tutorialId: "lawyer.call",
    collapsed: true,
  },
  finance: {
    title: "Your fees from ILP work",
    what: "What ILP has paid you and what is still pending, by matter and by payout. Amounts are your fees as agreed with ILP.",
    how: [
      "You scope a quote for legal work on the member's Quotes tab.",
      "The member accepts it and you do the work.",
      "Your fee shows here as pending, then as paid on the payout date.",
    ],
    why: "Every fee is in one place, so you can check a payout without asking. Member pricing is not shown on this page.",
    tutorialId: "lawyer.finance",
  },
  availability: {
    title: "When members can book you",
    what: "Your weekly hours, days off, notice and daily limit, in your own time zone (the one of the country where you are licensed, unless you change it). Your specialties are on your Profile page.",
    how: [
      "Turn on the days you take calls and set the hours for each one.",
      "Add days off, the minimum notice and the most calls you take in one day.",
      "Press Save hours. From then on members see only times inside these hours.",
    ],
    why: "You only get calls you can take. Which members reach you depends on your profile: specialties, languages and capacity.",
    tutorialId: "lawyer.availability",
  },
  profile: {
    title: "Your profile for member matching",
    what: "The specialties, languages, regions and weekly capacity ILP uses to give you members. Members do not choose a lawyer: the system matches each one to a lawyer licensed in their country who takes their kind of question and has free time.",
    how: [
      "Choose every specialty you take. Search the list or open each area.",
      "Add the languages you hold calls in, the regions you cover and the most calls you take in a week.",
      "List anyone you cannot act for or against, so they are never matched to you.",
      "Press Save profile. New members are matched with it from then on.",
    ],
    why: "Accurate specialties bring you members you can help, and capacity keeps your week manageable. Before each call you get the member's brief by email in the language you choose here.",
  },
};

/** `flush` drops the bottom margin where the parent already spaces its children. */
export default function LawyerIntro({ screen, flush = false }: { screen: LawyerScreen; flush?: boolean }) {
  const me = useContext(LawyerContext);
  const key = screen === "today" && inReview(me) ? "todayReview" : screen;
  const c = LAWYER_INTROS[key];
  return (
    <PageIntro
      compact
      audience="lawyer"
      headingLevel={2}
      title={c.title}
      what={c.what}
      how={c.how}
      why={c.why}
      tutorialId={c.tutorialId}
      storageKey={`lawyer.${key}`}
      defaultCollapsed={c.collapsed}
      className={flush ? undefined : s.intro}
    />
  );
}
