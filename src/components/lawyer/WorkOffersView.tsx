"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, EmptyState, ErrorNotice, SkeletonList, SkeletonRegion, Stagger, StaggerItem, StatusPill, TextArea, useSkeleton } from "@/components/ui";
import { fmtDate } from "./lawyerApi";
import { getWorkOffers, OFFER_STATUS, respondToOffer, type LawyerWorkOffer } from "./commsApi";
import s from "./WorkOffersView.module.scss";

export function WorkOffersSkeleton() {
  return <SkeletonList rows={3} lead={null} trail="pills" lines={3} variant="spaced" />;
}

/**
 * Paid legal work ILP offers to lawyers whose specialty and licence fit.
 * Open offers first with Accept and Decline; the first lawyer to accept
 * takes the work and ILP introduces them to the member. No member name or
 * estimated value is shown before that.
 */
export default function WorkOffersView() {
  const [offers, setOffers] = useState<LawyerWorkOffer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [declining, setDeclining] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [rowError, setRowError] = useState<{ id: string; text: string } | null>(null);

  const load = useCallback(() => {
    setError(null);
    getWorkOffers()
      .then(setOffers)
      .catch((e) => setError(e instanceof Error ? e.message : "Offers did not load."));
  }, []);
  useEffect(load, [load]);
  const { showSkeleton, skeletonVisible } = useSkeleton(!offers && !error);

  const answer = async (o: LawyerWorkOffer, action: "accept" | "decline") => {
    setBusy(o.id);
    setRowError(null);
    try {
      const next = await respondToOffer(o.id, action, action === "decline" ? reason.trim() || undefined : undefined);
      setOffers((list) => (list ?? []).map((x) => (x.id === o.id ? next : x)));
      setDeclining(null);
      setReason("");
    } catch (e) {
      setRowError({ id: o.id, text: e instanceof Error ? e.message : "That did not go through. Try again." });
      load();
    } finally {
      setBusy(null);
    }
  };

  if (error && !offers) {
    return <ErrorNotice audience="lawyer" variant="block" title="Offers did not load" onRetry={load}>{error}</ErrorNotice>;
  }
  if (showSkeleton || !offers) {
    return (
      <SkeletonRegion label="Loading offers" visible={skeletonVisible}>
        <WorkOffersSkeleton />
      </SkeletonRegion>
    );
  }
  if (!offers.length) {
    return <EmptyState title="No work offered yet" body="When a member needs paid legal work in one of your specialties, in a country where you are licensed, it shows here and we email you." />;
  }

  const open = offers.filter((o) => o.status === "offered");
  const past = offers.filter((o) => o.status !== "offered");
  const card = (o: LawyerWorkOffer, i: number) => {
    const st = OFFER_STATUS[o.status];
    return (
      <StaggerItem as="li" key={o.id} index={i} className={s.offer}>
        <div className={s.head}>
          <h3 className={s.title}>{o.title}</h3>
          <StatusPill size="sm" label={st.label} tone={st.tone} srPrefix="Status" />
        </div>
        <p className={s.meta}>
          {o.areaLabel} · {o.countryName} · offered {fmtDate(o.offeredAt)}
          {o.status === "offered" && o.respondBy ? ` · answer by ${fmtDate(o.respondBy)}` : ""}
        </p>
        {o.description && <p className={s.body}>{o.description}</p>}
        {o.status === "accepted" && <p className={s.body}>The ILP team will introduce you to the member. You then scope the quote on the member&apos;s Quotes tab.</p>}
        {rowError?.id === o.id && <p className={s.error} role="alert">{rowError.text}</p>}
        {o.status === "offered" && (
          declining === o.id ? (
            <div className={s.decline}>
              <TextArea label="Why not? (optional)" hint="For example: no capacity this month, or outside my practice. Only the ILP team reads it." value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={300} />
              <div className={s.actions}>
                <Button variant="secondary" busy={busy === o.id} onClick={() => answer(o, "decline")}>Decline the offer</Button>
                <Button variant="ghost" onClick={() => { setDeclining(null); setReason(""); }}>Keep it open</Button>
              </div>
            </div>
          ) : (
            <div className={s.actions}>
              <Button busy={busy === o.id} onClick={() => answer(o, "accept")}>Accept</Button>
              <Button variant="ghost" disabled={busy === o.id} onClick={() => { setDeclining(o.id); setReason(""); }}>Decline</Button>
            </div>
          )
        )}
      </StaggerItem>
    );
  };

  return (
    <Stagger>
      <div className={s.page}>
        <section aria-labelledby="work-open">
          <h2 id="work-open" className={s.h}>Waiting for your answer ({open.length})</h2>
          {open.length ? <ul className={s.list}>{open.map(card)}</ul> : <p className={s.muted}>Nothing waiting. New offers also arrive by email.</p>}
        </section>
        {past.length > 0 && (
          <section aria-labelledby="work-past">
            <h2 id="work-past" className={s.h}>Earlier offers</h2>
            <ul className={s.list}>{past.map((o, i) => card(o, open.length + i))}</ul>
          </section>
        )}
      </div>
    </Stagger>
  );
}
