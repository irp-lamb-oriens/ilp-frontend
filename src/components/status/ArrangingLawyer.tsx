"use client";

import { ButtonLink, Notice } from "@/components/ui";
import type { SalesCallView } from "./api";
import { dateLong, timeOfDay, zoneName } from "./format";

/**
 * ROUTING: no lawyer matches the member's question yet. Calm, plain words:
 * we are arranging the lawyer and will confirm by email; meanwhile a short
 * call with the ILP team is set (or the team will write to set one). It does
 * not use membership minutes.
 */
export default function ArrangingLawyer({ salesCall, reason }: { salesCall?: SalesCallView | null; reason?: string }) {
  return (
    <Notice
      tone="info"
      title="We are arranging your lawyer"
      terms={["partnerLawyer"]}
      actions={
        salesCall?.meetUrl ? (
          <ButtonLink href={salesCall.meetUrl} variant="secondary" target="_blank" rel="noreferrer">
            Join the call with the ILP team
          </ButtonLink>
        ) : (
          <ButtonLink href="/status/messages" variant="secondary">
            Message your team
          </ButtonLink>
        )
      }
    >
      <p>
        {reason ?? "We are choosing the right lawyer licensed in your country for your question."} We will email you as soon as your lawyer is confirmed, and their open times will then appear here.
      </p>
      <p>
        {salesCall
          ? `In the meantime, a short ${salesCall.durationMin}-minute call with the ILP team is set for ${dateLong(salesCall.scheduledAt)} at ${timeOfDay(salesCall.scheduledAt)}, ${zoneName()}. It does not use your membership minutes or calls.`
          : "In the meantime, someone from the ILP team will write to you within one working day to set up a short call. It does not use your membership minutes or calls."}
      </p>
    </Notice>
  );
}
