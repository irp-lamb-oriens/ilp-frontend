"use client";

import { useEffect, useMemo, useState } from "react";
import { Drawer, Skeleton, StatusPill } from "@/components/ui";
import ProfileView from "@/components/routing/ProfileView";
import { ratingText, routingApi, staffProfileAdapter, type StaffLawyerProfile } from "@/lib/routing";
import { RATING_MIN_REVIEWS } from "@/lib/contracts";
import s from "./routing.module.scss";

/**
 * Staff: one lawyer's routing profile in a drawer, with the hidden rating and
 * the latest member reviews above the editor. Ratings are staff-only and only
 * change the order in which the router offers lawyers.
 */
export function LawyerProfileDrawer({ providerId, name, onClose, onSaved }: { providerId: string | null; name?: string; onClose: () => void; onSaved?: () => void }) {
  const [info, setInfo] = useState<StaffLawyerProfile | null>(null);
  const adapter = useMemo(() => {
    if (!providerId) return null;
    const base = staffProfileAdapter(providerId);
    return { ...base, save: async (input: Parameters<typeof base.save>[0]) => { const r = await base.save(input); onSaved?.(); return r; } };
  }, [providerId, onSaved]);

  useEffect(() => {
    setInfo(null);
    if (providerId) routingApi.lawyerProfile(providerId).then(setInfo).catch(() => setInfo(null));
  }, [providerId]);

  return (
    <Drawer open={!!providerId} onClose={onClose} title={name ?? info?.name ?? "Lawyer"} subtitle={info?.email ?? undefined} size="lg">
      {providerId && adapter && (
        <div className={s.drawerBody}>
          <section className={s.rating} aria-label="Rating, staff only">
            <div className={s.ratingHead}>
              <h3 className={s.h3}>Rating (staff only)</h3>
              {info ? (
                <StatusPill size="sm" tone={info.rating.reviewCount ? "info" : "neutral"} label={ratingText(info.rating.ratingScore, info.rating.reviewCount)} />
              ) : (
                <Skeleton shape="line" size="sm" width="25" />
              )}
            </div>
            <p className={s.note}>
              From members&apos; 1 to 5 star reviews after each call, on a 0 to 100 scale. Every lawyer starts at 100. Until {RATING_MIN_REVIEWS} reviews the score is blended with that start, so one low review does not sink a new lawyer. It only changes the order in which lawyers are offered; members and lawyers never see it.
            </p>
            {info && info.reviews.length > 0 && (
              <ul className={s.reviews}>
                {info.reviews.map((r) => (
                  <li key={r.id}>
                    <span className={s.stars}>{r.stars} of 5</span> <span className={s.meta}>{r.at.slice(0, 10)}</span>
                    {r.comment && <p className={s.comment}>{r.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <ProfileView key={providerId} adapter={adapter} title="Routing profile" />
        </div>
      )}
    </Drawer>
  );
}
