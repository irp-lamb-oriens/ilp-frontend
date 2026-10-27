"use client";

import { useState } from "react";
import { Button, ErrorNotice, Notice } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { recordConsent } from "./consentApi";
import { announceAiConsent, useAiConsent } from "./aiConsent";

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
    <Notice
      tone="info"
      headingLevel={2}
      title="Before you use the AI assistant"
      data-tour="client-ai-notice"
      terms={["aiAssistant", "ilpTeam"]}
      actions={
        <Button onClick={accept} busy={busy}>
          I understand
        </Button>
      }
      fix={{
        label: "What does this mean?",
        steps: [
          "Read the three points above. Press I understand to turn the AI assistant on. You only do this once.",
          "Use it for general questions, like what a word means or how a process usually works.",
          "For anything about your own situation, write to your ILP team instead. They confirm anything legal.",
          "Changed your mind? Open the menu under your name, choose Your data and privacy, and press Withdraw next to AI assistant.",
        ],
        tutorialId: "client.messages",
        tutorialStep: "notice",
        learnMoreHref: "/legal/recording",
        learnMoreLabel: "How ILP uses AI",
      }}
    >
      <ul>
        <li>It gives general information, not legal advice, and it can be wrong. It is not your lawyer.</li>
        <li>Its answers are labeled AI assistant. Your ILP team confirms anything legal.</li>
        <li>Your questions are kept with your account and sent to our AI provider to produce an answer. Share only what the question needs.</li>
      </ul>
      {error && <ErrorNotice audience="member">{error}</ErrorNotice>}
    </Notice>
  );
}
