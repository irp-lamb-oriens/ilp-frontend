"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { recordConsent } from "./consentApi";
import { announceAiConsent, useAiConsent } from "./aiConsent";
import s from "./AiNotice.module.scss";

/**
 * One-time AI assistant notice above Messages (P6). Shown until the member
 * accepts it; the acceptance is a ConsentRecord (kind ai_assistant) with the
 * notice version. Withdrawing it on /status/privacy shows the notice again.
 * Team messages are never blocked by it.
 */
export default function AiNotice() {
  const granted = useAiConsent();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (granted !== false) return null;

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      await recordConsent("ai_assistant", true, "lily");
      announceAiConsent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={s.notice} aria-labelledby="ai-notice-title" data-tour="client-ai-notice">
      <h2 id="ai-notice-title" className={s.title}>Before you use the AI assistant</h2>
      <ul className={s.list}>
        <li>It gives general information, not legal advice, and it can be wrong. It is not your lawyer.</li>
        <li>Its answers are labeled AI assistant. Your ILP team confirms anything legal.</li>
        <li>Your questions are kept with your account and sent to our AI provider to produce an answer. Share only what the question needs.</li>
      </ul>
      <p className={s.more}>
        <Link href="/legal/recording">How ILP uses AI</Link>
      </p>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      <div>
        <Button onClick={accept} busy={busy}>
          I understand
        </Button>
      </div>
    </section>
  );
}
