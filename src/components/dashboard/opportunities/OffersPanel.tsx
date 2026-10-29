"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { staffApi } from "@/lib/api";
import type { WorkOfferStatus } from "@/lib/contracts";
import { Button, Checkbox, Loadable, Skeleton, StatusPill, TextArea } from "@/components/ui";
import { ErrorText } from "../staff/PageHeader";
import { shortDate } from "../staff/format";
import { isClosedStage, type OpportunityRow } from "./oppApi";
import s from "./opportunities.module.scss";

interface StaffOffer {
  id: string;
  providerId: string;
  lawyerName: string;
  status: WorkOfferStatus;
  offeredAt: string;
  respondBy: string | null;
  respondedAt: string | null;
  declineReason: string | null;
}

interface OffersData {
  countryName: string;
  areaLabel: string;
  offers: StaffOffer[];
  candidates: Array<{ providerId: string; name: string }>;
}

const STATUS: Record<WorkOfferStatus, { label: string; tone: "info" | "success" | "neutral" | "warning" }> = {
  offered: { label: "Waiting", tone: "info" },
  accepted: { label: "Accepted", tone: "success" },
  declined: { label: "Declined", tone: "neutral" },
  taken: { label: "Taken by another", tone: "neutral" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
};

/**
 * COMMS-P2: offer the work to lawyers whose specialty and licence fit. Each
 * gets an email and Accept or Decline on their New work page; the first to
 * accept becomes the opportunity's lawyer and staff are alerted. Lawyers see
 * the title, area, country and the description below, never the member's
 * name or the estimated fees.
 */
export function OffersPanel({ o, onAccepted }: { o: OpportunityRow; onAccepted: () => void }) {
  const [data, setData] = useState<OffersData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pick, setPick] = useState<string[] | null>(null);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const closed = isClosedStage(o.stage);
  const url = `/api/dashboard/opportunities/${encodeURIComponent(o.id)}`;
  // The parent passes a new function each render; keep the latest without refetching.
  const accepted = useRef(onAccepted);
  useEffect(() => {
    accepted.current = onAccepted;
  });

  const load = useCallback(() => {
    staffApi
      .get<OffersData>(`${url}/offers`)
      .then((d) => {
        setData(d);
        setPick((p) => p ?? d.candidates.map((c) => c.providerId));
        if (d.offers.some((x) => x.status === "accepted") && !o.providerId) accepted.current();
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Offers could not be loaded."));
  }, [url, o.providerId]);
  useEffect(load, [load]);

  async function offer() {
    setBusy(true);
    setError(null);
    try {
      const d = await staffApi.post<OffersData>(`${url}/offer`, { providerIds: pick ?? [], ...(description.trim() ? { description: description.trim() } : {}) });
      setData(d);
      setPick(d.candidates.map((c) => c.providerId));
      setDescription("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The offer could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  const toggle = (id: string, on: boolean) => setPick((p) => (on ? [...(p ?? []), id] : (p ?? []).filter((x) => x !== id)));

  return (
    <section className={s.panel} aria-label="Offer to lawyers">
      <h3 className={s.panelTitle}>Offer to lawyers</h3>
      <Loadable
        loading={!data && !error}
        label="Loading offers"
        skeleton={
          <>
            <Skeleton shape="line" size="sm" width="60" />
            <Skeleton shape="line" size="sm" width="40" />
          </>
        }
      >
        {data && (
          <>
            {data.offers.length > 0 && (
              <ul className={s.memberList}>
                {data.offers.map((x) => (
                  <li key={x.id} className={s.quoteRow}>
                    <div>
                      <p className={s.quoteTitle}>{x.lawyerName}</p>
                      <p className={s.meta}>
                        Offered {shortDate(x.offeredAt)}
                        {x.respondedAt ? `, answered ${shortDate(x.respondedAt)}` : x.respondBy ? `, answer by ${shortDate(x.respondBy)}` : ""}
                        {x.declineReason ? `. Reason: ${x.declineReason}` : ""}
                      </p>
                    </div>
                    <StatusPill size="sm" label={STATUS[x.status].label} tone={STATUS[x.status].tone} srPrefix="Offer" />
                  </li>
                ))}
              </ul>
            )}
            {o.providerId || closed ? (
              <p className={s.meta}>{o.providerId ? "A lawyer has this work. Clear the lawyer on the opportunity to offer it again." : "This opportunity is closed."}</p>
            ) : data.candidates.length ? (
              <div className={s.form}>
                <p className={s.meta}>
                  Lawyers licensed in {data.countryName} who take {data.areaLabel.toLowerCase()} work. They see the title, area, country and your description, never the member&apos;s name or the fees.
                </p>
                {data.candidates.map((c) => (
                  <Checkbox key={c.providerId} label={c.name} checked={(pick ?? []).includes(c.providerId)} onChange={(e) => toggle(c.providerId, e.target.checked)} />
                ))}
                <TextArea
                  label="Description for the lawyers"
                  optional
                  hint="What the work is, without the member's name or contact details."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={600}
                />
                <div className={s.actionsRow}>
                  <Button variant="secondary" disabled={!(pick ?? []).length} busy={busy} onClick={offer}>
                    Offer to {(pick ?? []).length} {(pick ?? []).length === 1 ? "lawyer" : "lawyers"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className={s.meta}>
                {data.offers.length ? "Every lawyer who fits has been offered this work." : `No active lawyer licensed in ${data.countryName} takes ${data.areaLabel.toLowerCase()} work yet. Check Lawyers, Coverage.`}
              </p>
            )}
          </>
        )}
      </Loadable>
      {error && <ErrorText>{error}</ErrorText>}
    </section>
  );
}
