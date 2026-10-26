import { StatusPill } from "@/components/ui";
import type { ConsentState } from "./lawyerApi";

const CONSENT: Record<ConsentState, { label: string; tone: "warning" | "success" | "danger" }> = {
  pending: { label: "Consent pending", tone: "warning" },
  granted: { label: "Recording allowed", tone: "success" },
  declined: { label: "No recording", tone: "danger" },
};

export function ConsentPill({ state, size = "sm" }: { state: ConsentState; size?: "sm" | "md" }) {
  const c = CONSENT[state] ?? CONSENT.pending;
  return <StatusPill label={c.label} tone={c.tone} size={size} srPrefix="Recording consent:" />;
}

export function SummaryPill({ status }: { status: "suggested" | "confirmed" | null }) {
  if (status === "suggested") return <StatusPill label="Suggested — confirm" tone="info" size="sm" />;
  if (status === "confirmed") return <StatusPill label="Summary confirmed" tone="success" size="sm" />;
  return null;
}
