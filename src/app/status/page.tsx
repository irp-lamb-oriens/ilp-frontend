"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  statusFetch,
  setClientToken,
  emailToProjectId,
  projectIdToEmail,
} from "@/lib/status";
import AuthShell from "@/components/auth/AuthShell";
import AuthField from "@/components/auth/AuthField";

type Step = "lookup" | "verify";

export default function StatusLookupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("lookup");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // When the URL already carries a project id (e.g. /status?project=...),
  // prefill the email field with the reconstructed bare email.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("project") ?? params.get("id");
    if (fromUrl) {
      setEmail(projectIdToEmail(fromUrl));
    }
  }, []);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const projectId = emailToProjectId(email);
      await statusFetch("/api/client-status/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ email, projectId }),
      });
      setNotice("Verification code sent to your email.");
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const projectId = emailToProjectId(email);
      const res = await statusFetch<{ token: string }>(
        "/api/client-status/auth/verify-otp",
        { method: "POST", body: JSON.stringify({ email, projectId, code }) },
      );
      setClientToken(res.token);
      router.push(`/status/${encodeURIComponent(projectId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Track your matter"
      sub={
        step === "lookup"
          ? "Enter your email to receive a secure login code."
          : `Enter the 6-digit code sent to ${email}.`
      }
      notice={notice}
      error={error}
      busy={busy}
      primaryLabel={step === "lookup" ? "Send code" : "Verify"}
      onSubmit={step === "lookup" ? requestOtp : verifyOtp}
      secondaryVisible={step === "verify"}
      secondaryLabel="Use different details"
      onSecondary={() => {
        setStep("lookup");
        setCode("");
        setError(null);
        setNotice(null);
      }}
    >
      {step === "lookup" ? (
        <AuthField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoFocus
        />
      ) : (
        <AuthField
          label="Verification code"
          type="text"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="000000"
          maxLength={6}
          required
          autoFocus
        />
      )}
    </AuthShell>
  );
}
