"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ApiError, createApiClient, setRoleToken } from "@/lib/api";
import type { PortalRole } from "@/lib/auth";
import { emailToProjectId } from "@/lib/status";
import AuthButton from "./AuthButton";
import AuthField from "./AuthField";
import AuthShell from "./AuthShell";
import styles from "./authShell.module.scss";

/** Seconds before another code can be requested (server: OTP_RESEND_COOLDOWN_MS). */
export const RESEND_COOLDOWN_S = 30;

const ENDPOINTS: Record<PortalRole, string> = {
  staff: "/api/dashboard/auth",
  lawyer: "/api/provider/auth",
  client: "/api/client-status/auth",
};

const COPY: Record<PortalRole, { title: string; sub: string }> = {
  staff: { title: "ILP staff sign in", sub: "Enter your ILP work email to receive a sign-in code." },
  lawyer: { title: "Lawyer sign in", sub: "Enter the email ILP has on file for you to receive a sign-in code." },
  client: { title: "Sign in to ILP", sub: "Enter your email to receive a secure sign-in code." },
};

export interface PortalLoginResult {
  email: string;
  /** Client role only: the email-derived project id. */
  projectId?: string;
  /** Staff role only: staff | csm | admin, as returned by verify-otp. */
  staffRole?: string;
}

export interface PortalLoginProps {
  role: PortalRole;
  /** Called after the code is verified and the session is stored. */
  onSuccess: (result: PortalLoginResult) => void;
  title?: string;
  sub?: ReactNode;
  initialEmail?: string;
  brand?: { src: string; name: string; sub: string };
  /** Send the code to initialEmail as soon as the form mounts (e.g. right after a lawyer applies). */
  autoSend?: boolean;
  /** Shown between the title and the form. */
  lead?: ReactNode;
}

type Step = "email" | "code";

function describe(err: unknown, step: Step): string {
  if (err instanceof ApiError) {
    if (err.status === 429) {
      return step === "email"
        ? "Please wait a moment before requesting another code."
        : "Too many attempts. Request a new code to try again.";
    }
    if (err.status === 401) return err.message || "That code is not right. Check it and try again.";
    if (err.status >= 500) return "Something went wrong on our side. Try again in a minute.";
    return err.message;
  }
  return "Could not reach ILP. Check your connection and try again.";
}

/**
 * Email → 6-digit code login shared by the three portals. Handles the
 * server's 401 (wrong or expired code), 429 (too many attempts / resend too
 * soon) and a 30-second resend cooldown. On success the session token from
 * verify-otp is stored for the role (ilp_<role>_token, see lib/api.ts).
 */
export default function PortalLogin({ role, onSuccess, title, sub, initialEmail = "", brand, autoSend = false, lead }: PortalLoginProps) {
  const api = useRef(createApiClient(role)).current;
  const base = ENDPOINTS[role];
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [locked, setLocked] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);
  const autoSent = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  // Once per mount: send the code to the email handed over by the page.
  useEffect(() => {
    if (!autoSend || autoSent.current || !/^\S+@\S+\.\S+$/.test(initialEmail.trim())) return;
    autoSent.current = true;
    void sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSend, initialEmail]);

  function bodyFor(extra: Record<string, string> = {}) {
    const clean = email.trim().toLowerCase();
    return role === "client" ? { email: clean, projectId: emailToProjectId(clean), ...extra } : { email: clean, ...extra };
  }

  async function sendCode() {
    setError(null);
    setNotice(null);
    setFieldError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setFieldError("Enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      await api.post(`${base}/request-otp`, bodyFor(), { on401: "throw" });
      setNotice(`We sent a 6-digit code to ${email.trim()}. It expires in 10 minutes.`);
      setStep("code");
      setCode("");
      setLocked(false);
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      setError(describe(err, "email"));
      if (err instanceof ApiError && err.status === 429) setCooldown(RESEND_COOLDOWN_S);
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setError(null);
    setFieldError(null);
    if (!/^\d{6}$/.test(code)) {
      setFieldError("Enter the 6-digit code from the email.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post<{ token?: string; role?: string; expiresAt?: string } | undefined>(
        `${base}/verify-otp`,
        bodyFor({ code }),
        { on401: "throw" },
      );
      if (!res?.token) throw new ApiError("Sign-in did not complete. Request a new code and try again.", 500);
      // Kept per role in localStorage and sent as `Authorization: Bearer` (lib/api.ts).
      setRoleToken(role, res.token);
      const clean = email.trim().toLowerCase();
      onSuccess({
        email: clean,
        projectId: role === "client" ? emailToProjectId(clean) : undefined,
        staffRole: role === "staff" ? res?.role : undefined,
      });
    } catch (err) {
      setError(describe(err, "code"));
      if (err instanceof ApiError && err.status === 429) {
        setLocked(true);
        setNotice(null);
      }
      setCode("");
      codeRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (step === "email") void sendCode();
    else if (locked) void sendCode();
    else void verify();
  }

  const copy = COPY[role];
  const primaryLabel = step === "email" ? "Send code" : locked ? "Send a new code" : "Sign in";

  return (
    <AuthShell
      title={title ?? copy.title}
      sub={step === "email" ? (sub ?? copy.sub) : `Enter the 6-digit code sent to ${email.trim()}.`}
      notice={notice}
      error={error}
      busy={busy}
      busyLabel={step === "email" || locked ? "Sending code…" : "Checking code…"}
      primaryLabel={primaryLabel}
      onSubmit={onSubmit}
      secondaryVisible={step === "code"}
      secondaryLabel="Use a different email"
      onSecondary={() => {
        setStep("email");
        setCode("");
        setError(null);
        setNotice(null);
        setFieldError(null);
        setLocked(false);
      }}
      brand={brand}
      lead={lead}
    >
      {step === "email" ? (
        <AuthField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          error={fieldError}
          required
          autoFocus
        />
      ) : (
        <>
          <AuthField
            label="Sign-in code"
            type="text"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit code"
            hint="Check spam if it has not arrived within a minute."
            error={fieldError}
            disabled={locked}
            inputRef={codeRef}
            required={!locked}
          />
          {!locked && (
            <AuthButton
              type="button"
              variant="ghost"
              onClick={() => void sendCode()}
              disabled={busy || cooldown > 0}
              aria-live="polite"
              className={styles.resend}
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </AuthButton>
          )}
        </>
      )}
    </AuthShell>
  );
}
