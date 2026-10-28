import type { MemberHome, MatterView, NextStepView, Who } from "./api";

export interface NextStepModel {
  what: string;
  who: Who;
  whoName?: string | null;
  dueAt?: string;
  more: NextStepView["more"];
  action?: { label: string; href: string };
  /** Where the step came from, for the small print. */
  origin: "lawyer" | "matter" | "profile" | "booking" | "call";
}

/** "Book your first call" (the first matter from the join form, T3) leads to booking. */
const BOOK_WORDS = /\bbook\b.*\bcall\b/i;
const DOC_WORDS = /\b(upload|send|scan|document|certificate|receipt|letter|books|copy|passport|deed)\b/i;

/** The single card at the top of Overview: always something, never empty. */
export function nextStepModel(home: MemberHome, matter: MatterView | null): NextStepModel {
  const step = matter?.nextStep ?? (home.matters.length ? null : home.generalNextStep);
  if (step) {
    const action = step.who === "client"
      ? BOOK_WORDS.test(step.what) && home.capacity.canBook
        ? { label: "Book a call", href: "/status/book" }
        : DOC_WORDS.test(step.what)
        ? { label: "Upload a document", href: "/status/profile#documents" }
        : { label: "Message your team", href: "/status/messages" }
      : undefined;
    return {
      what: step.what,
      who: step.who,
      whoName: step.who === "lawyer" ? matter?.lawyerName : undefined,
      dueAt: step.dueAt,
      more: step.more ?? [],
      action,
      origin: step.source === "handoff" ? "lawyer" : "matter",
    };
  }
  if (!home.completeness.consultationReady) {
    return {
      what: "Complete your profile so your lawyer is ready for your first call",
      who: "client",
      more: [],
      action: { label: "Complete your profile", href: "/status/profile" },
      origin: "profile",
    };
  }
  const call = home.upcomingCalls[0];
  if (call) {
    return {
      what: "Your call is booked. Your lawyer will read your question beforehand.",
      who: "lawyer",
      whoName: call.lawyerName,
      dueAt: call.scheduledAt,
      more: [],
      origin: "call",
    };
  }
  return {
    what: home.capacity.canBook ? "Book a 20-minute call to ask your first question" : "Nothing is needed from you right now",
    who: home.capacity.canBook ? "client" : "ilp",
    more: [],
    action: home.capacity.canBook ? { label: "Book a call", href: "/status/book" } : undefined,
    origin: "booking",
  };
}
