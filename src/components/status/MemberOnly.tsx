"use client";

import type { ReactNode } from "react";
import { ButtonLink, Notice } from "@/components/ui";
import { PLAN_STANDARD } from "@/lib/contracts";
import { isFreeAccount } from "./api";
import { useMember } from "./MemberContext";

const MONTHLY = `US$${(PLAN_STANDARD.monthlyCents / 100).toFixed(2)}`;

const FEATURE: Record<"book" | "money" | "messages", { title: string; body: string }> = {
  book: {
    title: "Calls with a lawyer are part of the ILP membership",
    body: `Members get up to ${PLAN_STANDARD.callsIncluded} calls of ${PLAN_STANDARD.callLengthMin} minutes a month with a lawyer licensed in their country.`,
  },
  money: {
    title: "You have nothing to pay",
    body: "Your free ILP account has no charges. If you join, your membership payments and any quotes for legal work appear here.",
  },
  messages: {
    title: "Messages with your ILP team are part of the membership",
    body: "Members write to their ILP team here, and the team follows up after each call.",
  },
};

/**
 * DEADLINES: free accounts see a calm join notice instead of a member-only
 * screen (the server answers those routes with 402 membership_required).
 */
export default function MemberOnly({ feature, children }: { feature: keyof typeof FEATURE; children: ReactNode }) {
  const { home } = useMember();
  if (!isFreeAccount(home)) return <>{children}</>;
  const f = FEATURE[feature];
  return (
    <Notice
      tone="info"
      headingLevel={1}
      title={f.title}
      actions={
        <>
          <ButtonLink href="/join">Join ILP</ButtonLink>
          <ButtonLink href="/status/deadlines" variant="secondary">
            Go to my deadlines
          </ButtonLink>
        </>
      }
    >
      {f.body} The membership is {MONTHLY} a month. Your deadlines, profile and reminders stay free either way.
    </Notice>
  );
}
