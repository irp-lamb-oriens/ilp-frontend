"use client";

import type { HealthScore } from "@/lib/contracts";
import { HEALTH_TONE, healthLabel } from "@/lib/csm";
import { StatusPill } from "@/components/ui";
import s from "./csm.module.scss";

/**
 * The health score as a labeled pill ("At risk · 42"), never a bare colored
 * dot, with its reasons: the first one inline, or all of them with `full`.
 */
export function HealthPill({ health, full = false, reasons = true }: { health: HealthScore | null | undefined; full?: boolean; reasons?: boolean }) {
  const list = health?.reasons ?? [];
  return (
    <span className={full ? s.healthFull : s.health}>
      <StatusPill size="sm" label={healthLabel(health)} tone={health ? HEALTH_TONE[health.band] : "neutral"} srPrefix="Health" />
      {reasons && !full && list.length > 0 && (
        <span className={s.reason}>
          {list[0].text}
          {list.length > 1 ? `, and ${list.length - 1} more` : ""}
        </span>
      )}
      {reasons && full && (
        list.length ? (
          <ul className={s.reasons} aria-label="Why this score">
            {list.map((r) => (
              <li key={r.code}>
                <span>{r.text}</span>
                <span className={s.points}>minus {r.points}</span>
              </li>
            ))}
          </ul>
        ) : (
          <span className={s.reason}>{health?.band === "ended" ? "The membership has ended." : "Nothing is taking points off."}</span>
        )
      )}
    </span>
  );
}
