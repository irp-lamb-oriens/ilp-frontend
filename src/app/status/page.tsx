"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { statusFetch, setClientToken } from "@/lib/status";
import s from "./status.module.scss";

type Step = "lookup" | "verify";

export default function StatusLookupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("lookup");
  const [email, setEmail] = useState("");
  const [projectId, setProjectId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
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
    <main className={s.main}>
      <form
        className={s.login}
        onSubmit={step === "lookup" ? requestOtp : verifyOtp}
      >
        <h1 className={s.title}>Track your matter</h1>
        <p className={s.sub}>
          {step === "lookup"
            ? "Enter your email and project ID to receive a secure login code."
            : `Enter the 6-digit code sent to ${email}.`}
        </p>

        {step === "lookup" ? (
          <>
            <label className={s.field}>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </label>
            <label className={s.field}>
              <span>Project ID</span>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="your_project_id"
                required
              />
            </label>
          </>
        ) : (
          <label className={s.field}>
            <span>Verification code</span>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              required
              autoFocus
            />
          </label>
        )}

        {notice && <p className={s.notice}>{notice}</p>}
        {error && <p className={s.error}>{error}</p>}

        <button type="submit" className={s.primary} disabled={busy}>
          {busy ? "Please wait…" : step === "lookup" ? "Send code" : "Verify"}
        </button>

        {step === "verify" && (
          <button
            type="button"
            className={s.secondary}
            onClick={() => {
              setStep("lookup");
              setCode("");
              setError(null);
              setNotice(null);
            }}
          >
            Use different details
          </button>
        )}
      </form>
    </main>
  );
}