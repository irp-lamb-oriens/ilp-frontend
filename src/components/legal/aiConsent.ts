"use client";

/**
 * Shared state of the member's AI assistant consent (P7). AiNotice records it;
 * MessagesThread keeps "Ask the AI assistant" disabled until it is granted.
 * The server refuses member assistant questions without it (403
 * ai_consent_required), so this only keeps the UI honest.
 */
import { useEffect, useState } from "react";
import { privacyApi } from "./consentApi";

export const AI_CONSENT_EVENT = "ilp:ai-consent";

let cached: Promise<boolean> | null = null;

function load(): Promise<boolean> {
  cached =
    cached ??
    privacyApi
      .me()
      .then((me) => me.consents.ai_assistant?.granted === true)
      .catch(() => {
        cached = null;
        return false;
      });
  return cached;
}

/** Tell every listener the consent changed (after accept or withdraw). */
export function announceAiConsent(granted: boolean): void {
  cached = Promise.resolve(granted);
  try {
    window.dispatchEvent(new CustomEvent<boolean>(AI_CONSENT_EVENT, { detail: granted }));
  } catch {
    // no window (server render)
  }
}

/** null while loading, then whether the AI assistant notice is accepted. */
export function useAiConsent(): boolean | null {
  const [granted, setGranted] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    void load().then((g) => live && setGranted(g));
    const on = (e: Event) => setGranted((e as CustomEvent<boolean>).detail === true);
    window.addEventListener(AI_CONSENT_EVENT, on);
    return () => {
      live = false;
      window.removeEventListener(AI_CONSENT_EVENT, on);
    };
  }, []);
  return granted;
}
