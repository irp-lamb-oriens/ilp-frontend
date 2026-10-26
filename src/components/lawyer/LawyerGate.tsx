"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import PortalLogin from "@/components/auth/PortalLogin";
import { RoleShell } from "@/components/shell";
import { ApiError } from "@/lib/provider";
import { EmptyState, Button } from "@/components/ui";
import { lawyerApi, type LawyerMe, USING_MOCKS } from "./lawyerApi";
import { LawyerContext } from "./LawyerContext";
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

/**
 * Lawyer portal gate: one session check, then W2's <PortalLogin role="lawyer">
 * or the lawyer RoleShell around Today / Board / Clients / Finance.
 */
export default function LawyerGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/lawyer";
  const [state, setState] = useState<State>({ kind: "loading" });

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
    check();
  }, [check]);

  if (state.kind === "loading") {
    return <main className={s.center} aria-busy="true"><p className={s.muted}>Loading your day…</p></main>;
  }

  if (state.kind === "error") {
    return (
      <main className={s.center}>
        <EmptyState title="We could not load your workspace" body={state.message} action={<Button onClick={check}>Try again</Button>} />
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
          onSuccess={() => {
            setState({ kind: "loading" });
            check();
          }}
        />
      </main>
    );
  }

  const title = TITLES.find(([re]) => re.test(pathname))?.[1] ?? "Lawyer";

  return (
    <LawyerContext.Provider value={state.me}>
      <RoleShell
        role="lawyer"
        title={title}
        user={{ name: state.me.name ?? undefined, email: state.me.email, title: USING_MOCKS ? "Partner lawyer (demo data)" : "Partner lawyer" }}
        onLogout={() => {
          lawyerApi.logout().finally(() => {
            setState({ kind: "login" });
            router.push("/lawyer");
          });
        }}
        onSearch={(q) => router.push(`/lawyer/clients?q=${encodeURIComponent(q)}`)}
        bell={null}
      >
        {children}
      </RoleShell>
    </LawyerContext.Provider>
  );
}
