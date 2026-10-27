"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, ButtonLink, EmptyState, RadioGroup, SkeletonRegion, TextArea, useSkeleton } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { membershipApi, type MembershipBillingView } from "./membershipApi";
import { useMember } from "./MemberContext";
import { dateLong } from "./format";
import { CancelSkeleton } from "./StatusSkeletons";
import s from "./CancelMembership.module.scss";

/**
 * One screen: what happens, an optional reason, one confirm. After confirming
 * the same screen says when access ends and offers to undo.
 */
export default function CancelMembership() {
  const { refresh } = useMember();
  const [data, setData] = useState<MembershipBillingView | null>(null);
  const [failed, setFailed] = useState(false);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    membershipApi.get().then(setData).catch(() => setFailed(true));
  }, []);
  const { showSkeleton, skeletonVisible } = useSkeleton(!data && !failed);

  if (failed) return <EmptyState title="We could not load your membership" body="Try again in a minute. Nothing has changed." />;
  if (showSkeleton || !data) {
    return (
      <SkeletonRegion label="Loading your membership" visible={skeletonVisible}>
        <CancelSkeleton />
      </SkeletonRegion>
    );
  }
  const m = data.membership;
  if (!m || m.status === "pending" || m.status === "cancelled") {
    return (
      <EmptyState
        title="There is nothing to cancel"
        body={m?.status === "cancelled" ? "Your membership has already ended." : "You do not have a running membership."}
      />
    );
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      setData(await membershipApi.cancel({ reason: reason || undefined, comment: comment.trim() || undefined }));
      void refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That did not work. Nothing has changed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function undo() {
    setBusy(true);
    setError(null);
    try {
      setData(await membershipApi.undoCancel());
      void refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That did not work. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const ends = dateLong(m.periodEnd);

  if (m.cancelAtPeriodEnd) {
    return (
      <div className={s.page}>
        <h1 className={s.title}>Your membership ends on {ends}</h1>
        <p className={s.body}>
          We sent a confirmation to your email. Until {ends} everything works as usual. Someone from your ILP team may call
          to ask how we could have done better; you do not have to take the call.
        </p>
        {error && (
          <p className={s.err} role="alert">
            {error}
          </p>
        )}
        <div className={s.actions}>
          <Button variant="secondary" onClick={undo} busy={busy}>
            Keep my membership
          </Button>
          <Link className={s.back} href="/status/money">
            Back to money
          </Link>
        </div>
      </div>
    );
  }

  const reasons = Object.entries(data.reasons ?? {});
  return (
    <div className={s.page}>
      <h1 className={s.title}>Cancel your membership</h1>

      <section className={s.what} aria-labelledby="what-title">
        <h2 className={s.sub} id="what-title">
          What happens
        </h2>
        <ul className={s.list}>
          <li>You keep full access until {ends}, including calls you have already booked.</li>
          <li>You are not charged again. The current month is not refunded; if something went wrong, tell us below and your team will look at it.</li>
          <li>Your profile and documents stay in your account.</li>
          <li>You can change your mind any time before {ends}.</li>
        </ul>
      </section>

      <RadioGroup
        className={s.reasons}
        label="Why are you leaving?"
        optional
        name="reason"
        value={reason}
        onChange={setReason}
        options={reasons.map(([value, label]) => ({ value, label }))}
      />

      <div className={s.field}>
        <TextArea
          label="Anything you would like us to know (optional)"
          id="cancel-comment"
          rows={4}
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      {error && (
        <p className={s.err} role="alert">
          {error}
        </p>
      )}
      <div className={s.actions}>
        <Button variant="danger" onClick={confirm} busy={busy}>
          Cancel membership
        </Button>
        <ButtonLink href="/status/money" variant="ghost">
          Keep my membership
        </ButtonLink>
      </div>
    </div>
  );
}
