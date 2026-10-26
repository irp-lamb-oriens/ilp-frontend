"use client";

import { useState } from "react";
import { staffApi } from "@/lib/api";
import type { Membership } from "@/lib/contracts";
import { Button, ProgressBar, StatusPill } from "@/components/ui";
import { ErrorText } from "../staff/PageHeader";
import { MEMBERSHIP_LABEL, MEMBERSHIP_TONE, shortDate } from "../staff/format";
import s from "./member.module.scss";

/**
 * Membership status, usage and renewal. Pending memberships get "Mark paid"
 * (W3's manual payment mode: POST /api/payments/memberships/:id/mark-paid).
 */
export function MembershipPanel({ membership, onChanged }: { membership: Membership | null; onChanged?: () => void }) {
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  if (!membership) {
    return (
      <section className={s.block} aria-label="Membership">
        <h2 className={s.blockTitle}>Membership</h2>
        <p className={s.meta}>No membership on record. The person has not joined yet.</p>
      </section>
    );
  }
  const m = membership;

  async function markPaid() {
    if (!ref.trim()) {
      setError("Enter the payment reference (bank transfer or SINPE number).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await staffApi.post(`/api/payments/memberships/${encodeURIComponent(m.id)}/mark-paid`, { reference: ref.trim() });
      setOk("Payment recorded. The membership is active and an onboarding task is open.");
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The payment could not be recorded.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={s.block} aria-label="Membership">
      <div className={s.blockHead}>
        <h2 className={s.blockTitle}>Membership</h2>
        <StatusPill label={MEMBERSHIP_LABEL[m.status]} tone={MEMBERSHIP_TONE[m.status]} srPrefix="Membership status" />
      </div>
      <dl className={s.facts}>
        <div>
          <dt>Activation fee</dt>
          <dd>{m.activationPaidAt ? `Paid ${shortDate(m.activationPaidAt)}` : "Not paid"}</dd>
        </div>
        <div>
          <dt>{m.status === "cancelled" ? "Ended" : "Renews"}</dt>
          <dd>{shortDate(m.cancelledAt ?? m.periodEnd)}</dd>
        </div>
        <div>
          <dt>CSM</dt>
          <dd>{m.csmEmail ?? "Unassigned"}</dd>
        </div>
        <div>
          <dt>Member since</dt>
          <dd>{shortDate(m.activatedAt ?? m.createdAt)}</dd>
        </div>
      </dl>
      <ProgressBar
        label="Minutes used this period"
        value={m.minutesUsed}
        max={m.minutesIncluded}
        valueText={`${m.minutesUsed} of ${m.minutesIncluded} min`}
      />
      <ProgressBar label="Calls used" value={m.callsUsed} max={m.callsIncluded} valueText={`${m.callsUsed} of ${m.callsIncluded}`} />

      {m.status === "pending" && !ok && (
        <div className={s.markPaid}>
          <label className={s.field}>
            Payment reference
            <input
              className={s.input}
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="SINPE 8812-4471 or bank transfer id"
            />
          </label>
          <Button busy={busy} onClick={markPaid}>
            Mark paid
          </Button>
        </div>
      )}
      {ok && (
        <p className={s.ok} role="status">
          {ok}
        </p>
      )}
      {error && <ErrorText>{error}</ErrorText>}
    </section>
  );
}
