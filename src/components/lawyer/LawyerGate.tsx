"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import PortalLogin from "@/components/auth/PortalLogin";
import { LEGAL_MENU_LINKS, RoleShell } from "@/components/shell";
import { ApiError } from "@/lib/provider";
import { SkeletonRegion, useSkeleton, ErrorNotice, Notice } from "@/components/ui";
import { APPLIED_EMAIL_KEY } from "@/components/lawyers/applyModel";
import { getRoleToken } from "@/lib/api";
import { lawyerApi, type LawyerMe, USING_MOCKS } from "./lawyerApi";
import { LawyerContext } from "./LawyerContext";
import LawyerRouteSkeleton from "./LawyerSkeletons";
import s from "./LawyerGate.module.scss";

const TITLES: Array<[RegExp, string]> = [
  [/^\/lawyer\/board/, "Board"],
  [/^\/lawyer\/clients/, "Clients"],
  [/^\/lawyer\/finance/, "Finance"],
  [/^\/lawyer\/availability/, "Availability"],
  [/^\/lawyer\/calls\//, "Call"],
  [/^\/lawyer\/?$/, "Today"],
];

type State = { kind: "loading" } | { kind: "login" } | { kind: "error"; message: string } | { kind: "ready"; me: LawyerMe };

/** Arrived from the application form (/lawyer?applied=1, or =existing when the email was already known). */
type Applied = { email: string; mode: "new" | "existing" } | null;

/** Read once: the email the lawyer just applied with (sessionStorage, removed after reading). */
function readApplied(): Applied {
  try {
    const flag = new URLSearchParams(window.location.search).get("applied");
    if (!flag) return null;
    const email = window.sessionStorage.getItem(APPLIED_EMAIL_KEY) ?? "";
    window.sessionStorage.removeItem(APPLIED_EMAIL_KEY);
    return { email, mode: flag === "existing" ? "existing" : "new" };
  } catch {
    return null;
  }
}

/**
 * Lawyer portal gate: one session check, then W2's <PortalLogin role="lawyer">
 * or the lawyer RoleShell around Today / Board / Clients / Finance.
 */
export default function LawyerGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/lawyer";
  const [state, setState] = useState<State>({ kind: "loading" });
  // With a stored token, show the shell and the page skeleton at once (read
  // after mount so server render and hydration agree).
  const [hasToken, setHasToken] = useState(false);
  const [applied, setApplied] = useState<Applied>(null);
  const boot = useSkeleton(state.kind === "loading" && hasToken);

  const check = useCallback(async () => {
    try {
      const me = await lawyerApi.me();
      setState({ kind: "ready", me });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) setState({ kind: "login" });
      else setState({ kind: "error", message: "Could not reach ILP. Check your connection and try again." });
    }
  }, []);

  useEffect(() => {
    setHasToken(!!getRoleToken("lawyer"));
    setApplied(readApplied());
    check();
  }, [check]);

  const title = TITLES.find(([re]) => re.test(pathname))?.[1] ?? "Lawyer";

  const shell = (me: LawyerMe | null, body: ReactNode) => (
    <LawyerContext.Provider value={me}>
      <RoleShell
        role="lawyer"
        title={title}
        user={me ? { name: me.name ?? undefined, email: me.email, title: USING_MOCKS ? "Partner lawyer (demo data)" : "Partner lawyer" } : null}
        onLogout={() => {
          lawyerApi.logout().finally(() => {
            setState({ kind: "login" });
            router.push("/lawyer");
          });
        }}
        menuLinks={LEGAL_MENU_LINKS}
        onSearch={(q) => router.push(`/lawyer/clients?q=${encodeURIComponent(q)}`)}
        bell={null}
      >
        {body}
      </RoleShell>
    </LawyerContext.Provider>
  );

  if (state.kind === "loading") {
    if (hasToken) {
      return shell(
        null,
        <SkeletonRegion label="Loading your day" visible={boot.skeletonVisible}>
          <LawyerRouteSkeleton pathname={pathname} />
        </SkeletonRegion>,
      );
    }
    return (
      <main className={s.center} aria-busy="true">
        <p className={s.sr} role="status">Loading your day…</p>
      </main>
    );
  }

  if (state.kind === "error") {
    return (
      <main className={s.center}>
        <ErrorNotice audience="lawyer" variant="block" title="We could not load your workspace" onRetry={check}>{state.message}</ErrorNotice>
      </main>
    );
  }

  if (state.kind === "login") {
    return (
      <main className={s.login}>
        <PortalLogin
          role="lawyer"
          title="Partner lawyer sign in"
          sub="Your calls, briefs and matters with ILP members. We email you a one-time code."
          initialEmail={applied?.email ?? ""}
          autoSend={applied?.mode === "new" && !!applied.email}
          lead={
            applied?.mode === "new" ? (
              <Notice tone="success" title="Application sent. Check your email for a sign-in code.">
                Your profile is under review. You can sign in now to finish it: check your weekly hours and see what is left (a photo, then payout details after approval). We will email you when you can take calls.
              </Notice>
            ) : applied?.mode === "existing" ? (
              <Notice tone="info" title="Sign in to see your account">
                We already have a lawyer account or application for this email. Send yourself a sign-in code to see where it stands.
              </Notice>
            ) : null
          }
          onSuccess={() => {
            setHasToken(true);
            setState({ kind: "loading" });
            check();
          }}
        />
      </main>
    );
  }

  return shell(state.me, children);
}
