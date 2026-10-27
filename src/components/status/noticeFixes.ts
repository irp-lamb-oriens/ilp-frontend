/**
 * "How to fix this" content for member notices whose wording comes from the
 * server (booking blocked, payment). One place, so the steps match the
 * server's reasons in server/API/clientStatus/memberLogic.ts and
 * server/API/payments/lifecycle.ts.
 */
import type { NoticeFix } from "@/components/ui";

export interface BlockedNotice {
  tone: "warning" | "danger";
  title: string;
  fix: NoticeFix;
}

const UPDATE_CARD: NoticeFix = {
  summary: "Your profile, documents and messages stay as they are.",
  steps: [
    "Open Money from the menu.",
    "Under Your membership plan, press Update your card and type the new card details on the secure page.",
    "When the payment goes through, booking opens again by itself. This can take a few minutes.",
    "If you pay by bank transfer, or the card keeps failing, write to your ILP team from Messages.",
  ],
  tutorialId: "client.money",
  tutorialStep: "plan",
};

/** Notice content for the reason the server gives when a call cannot be booked. */
export function bookingBlocked(reason: string | undefined): BlockedNotice {
  const r = (reason ?? "").toLowerCase();
  if (r.includes("paused")) {
    return { tone: "danger", title: "Calls are paused until your payment goes through", fix: UPDATE_CARD };
  }
  if (r.includes("first payment")) {
    return {
      tone: "warning",
      title: "Your membership has not started yet",
      fix: {
        steps: [
          "Your membership starts when ILP receives the first payment (the monthly fee plus the activation fee).",
          "If you paid by card, wait a few minutes and reload this page.",
          "If you pay by bank transfer, send the payment with the details your ILP team emailed you. They open your membership when it arrives.",
          "Questions? Write to your ILP team from Messages.",
        ],
      },
    };
  }
  if (r.includes("ended") || r.includes("not active")) {
    return {
      tone: "warning",
      title: "Your membership is not active",
      fix: {
        steps: [
          "Calls are part of an active membership, so booking is closed for now.",
          "Your profile and documents are still here for you.",
          "To join again, write to your ILP team from Messages. They restart your membership and tell you what it costs.",
        ],
      },
    };
  }
  if (r.includes("calls")) {
    return {
      tone: "warning",
      title: "No calls left this month",
      fix: {
        summary: "Each month includes up to 3 calls.",
        steps: [
          "New calls open on the date shown above, when your membership renews.",
          "Until then, write your question to your ILP team from Messages. They can answer many things in writing.",
          "If something cannot wait, say so in your message. Your team can tell you about extra paid help.",
        ],
      },
    };
  }
  if (r.includes("minutes")) {
    return {
      tone: "warning",
      title: "Not enough minutes left for a call",
      fix: {
        summary: "Each month includes 60 minutes, and one call takes 20.",
        steps: [
          "Fresh minutes arrive on the date shown above, when your membership renews.",
          "Minutes set aside for a call you booked come back if you cancel it at least 24 hours before.",
          "For anything urgent, write to your ILP team from Messages.",
        ],
      },
    };
  }
  return {
    tone: "warning",
    title: "You cannot book a call right now",
    fix: {
      steps: ["Read the reason above.", "Write to your ILP team from Messages. They can book a call for you or explain what is needed."],
    },
  };
}

/** Past-due payment: still inside the 7-day grace window, or paused after it. */
export function pastDueFix(paidByCard: boolean): NoticeFix {
  return paidByCard
    ? {
        summary: "This takes about two minutes.",
        steps: [
          "Press Update your card.",
          "Type the new card details on the secure payment page. ILP never sees the full card number.",
          "Come back here. This notice goes away once the payment goes through.",
        ],
        tutorialId: "client.money",
        tutorialStep: "plan",
        scene: () => import("@/tutorials/noticeScenes").then((m) => m.updateCard),
      }
    : {
        steps: [
          "Press Message your team about payment.",
          "Tell them how you will pay, for example a bank transfer or SINPE.",
          "Your team records the payment when it arrives, and this notice goes away.",
        ],
      };
}
