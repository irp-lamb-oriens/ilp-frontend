"use client";

import { useEffect, useState } from "react";
import { Button, ButtonLink } from "@/components/ui";
import { joinState } from "./callsApi";
import { fmtTime } from "./lawyerApi";

/** Re-render every 30 s so time-gated buttons switch on by themselves. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/**
 * "Join call" for a lawyer: opens the Google Meet link in a new tab, active
 * from 10 minutes before the start. Without a link it says it is on its way.
 */
export default function JoinCall({
  meetUrl,
  scheduledAt,
  durationMin,
  size = "sm",
}: {
  meetUrl: string | null | undefined;
  scheduledAt: string;
  durationMin: number;
  size?: "sm" | "md";
}) {
  const now = useNow();
  const state = joinState(scheduledAt, durationMin, now);
  if (state === "over") return null;
  if (!meetUrl) {
    return (
      <Button size={size} variant="ghost" disabled title="The ILP team is sending the Meet link by email">
        Link coming by email
      </Button>
    );
  }
  if (state === "early") {
    const opens = new Date(Date.parse(scheduledAt) - 10 * 60_000).toISOString();
    return (
      <Button size={size} variant="secondary" disabled title={`Join opens at ${fmtTime(opens)}`}>
        Join opens {fmtTime(opens)}
      </Button>
    );
  }
  return (
    <ButtonLink size={size} href={meetUrl} target="_blank" rel="noopener noreferrer">
      Join call
    </ButtonLink>
  );
}
