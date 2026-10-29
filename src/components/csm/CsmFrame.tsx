"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PortalLogin from "@/components/auth/PortalLogin";
import { LEGAL_MENU_LINKS, RoleShell, type NavItem } from "@/components/shell";
import {
  IconNavCalendar,
  IconNavChart,
  IconNavList,
  IconNavMoney,
  IconNavPeople,
  IconNavShield,
  IconNavTag,
  IconNavToday,
} from "@/components/shell/navIcons";
import { IconChat, IconDeadlines } from "@/components/status/navIcons";
import { NotificationCenter } from "@/components/shell/NotificationCenter";
import { ApiError, csmApi, getRoleToken } from "@/lib/api";
import { scopeQuery, type CsmMe } from "@/lib/csm";
import { bellSource } from "@/lib/notifications";
import { Button, Notice, Select, SkeletonRegion, useSkeleton } from "@/components/ui";
import { StaffSessionProvider } from "../dashboard/staff/StaffSession";
import CsmRouteSkeleton from "./CsmSkeletons";
import s from "./csm.module.scss";

export interface CsmSession extends CsmMe {
  /** ?csm= and ?unassigned= of this page, sent with every CSM call. */
  scope: Record<string, string>;
  /** True when staff or an admin is looking at another CSM's book. */
  viewingOther: boolean;
}

const Ctx = createContext<CsmSession | null>(null);

/** The signed-in CSM (or staff viewing a CSM's book). Only inside /csm. */
export function useCsm(): CsmSession {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCsm() used outside the CSM frame");
  return v;
}

/** The CSM portal navigation (COMMS-P3). */
export function csmNav(): NavItem[] {
  return [
    { href: "/csm", label: "Today", icon: <IconNavToday />, match: "exact" },
    { href: "/csm/book", label: "My book", icon: <IconNavPeople /> },
    { href: "/csm/onboarding", label: "Onboarding", icon: <IconNavList /> },
    { href: "/csm/calls", label: "Calls", icon: <IconNavCalendar /> },
    { href: "/csm/risk", label: "Renewals and risk", icon: <IconNavShield /> },
    { href: "/csm/deadlines", label: "Deadlines", icon: <IconDeadlines /> },
    { href: "/csm/quotes", label: "Quotes and opportunities", icon: <IconNavMoney /> },
    { href: "/csm/messages", label: "Messages", icon: <IconChat /> },
    { href: "/csm/playbooks", label: "Playbooks", icon: <IconNavTag /> },
    { href: "/csm/kpis", label: "My KPIs", icon: <IconNavChart /> },
  ];
}

const BELL = bellSource(csmApi, "/api/notifications");

const TITLE: Record<CsmMe["role"], string> = {
  csm: "Customer success manager",
  staff: "ILP staff (viewing the CSM portal)",
  admin: "Administrator (viewing the CSM portal)",
};

function safeNext(): string | null {
  if (typeof window === "undefined") return null;
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/csm") ? next : null;
}

/**
 * The CSM portal frame: checks the CSM session (ilp_csm_token), shows the
 * email-code login when there is none, and renders the CSM shell with its
 * own navigation and bell. Staff and admins may sign in here too and pick a
 * CSM's book (?csm=); the server decides what each person may read.
 */
export function CsmFrame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/csm";
  const params = useSearchParams();
  const search = params?.toString() ?? "";
  const scope = useMemo(() => scopeQuery(search), [search]);
  const [me, setMe] = useState<CsmMe | null>(null);
  const [state, setState] = useState<"loading" | "login" | "ready" | "error" | "denied">("loading");
  const [hasToken, setHasToken] = useState(false);
  const boot = useSkeleton(state === "loading" && hasToken);

  const check = useCallback(async () => {
    try {
      const r = await csmApi.get<CsmMe>("/api/csm/me", { on401: "throw", query: scope.csm ? { csm: scope.csm } : {} });
      setMe(r);
      setState("ready");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setState("login");
      else if (e instanceof ApiError && e.status === 403) setState("denied");
      else setState("error");
    }
  }, [scope.csm]);

  useEffect(() => {
    setHasToken(!!getRoleToken("csm"));
    check();
  }, [check]);

  const session = useMemo<CsmSession | null>(
    () => (me ? { ...me, scope, viewingOther: me.canSwitch && me.csm !== me.viewer } : null),
    [me, scope],
  );
  // The reused staff member page reads the staff session.
  const staffSession = useMemo(() => (me ? { email: me.viewer, role: me.role, isAdmin: me.role === "admin" } : null), [me]);

  function pickCsm(email: string) {
    const p = new URLSearchParams(search);
    if (email && me && email !== me.viewer) p.set("csm", email);
    else p.delete("csm");
    const q = p.toString();
    router.push(`${pathname}${q ? `?${q}` : ""}`);
  }

  const shell = (body: ReactNode) => (
    <Ctx.Provider value={session}>
      <StaffSessionProvider value={staffSession}>
        <RoleShell
          role="staff"
          roleLabel="Customer success"
          homeHref="/csm"
          nav={csmNav()}
          user={me ? { email: me.viewer, title: TITLE[me.role] } : null}
          menuLinks={LEGAL_MENU_LINKS}
          onLogout={() => {
            csmApi.logout().then(() => {
              setMe(null);
              setState("login");
              router.push("/csm");
            });
          }}
          onSearch={(q) => router.push(`/csm/book?q=${encodeURIComponent(q)}`)}
          searchPlaceholder="Search your members by name or email"
          bell={me ? <NotificationCenter source={BELL} portal="csm" emptyText="Nothing new. Payment problems, privacy requests, new members and low ratings for your members appear here." /> : null}
        >
          {me?.canSwitch && (
            <div className={s.viewing} data-tour="csm-switch">
              <Select
                label="Whose book"
                value={me.csm}
                onChange={(e) => pickCsm(e.target.value)}
                options={[...new Set([me.viewer, ...me.csms])].map((c) => ({ value: c, label: c === me.viewer ? `${c} (you)` : c }))}
              />
              <p className={s.meta}>You are signed in as {me.role === "admin" ? "an admin" : "staff"}. Pick a CSM to see their day, book and figures.</p>
            </div>
          )}
          {body}
        </RoleShell>
      </StaffSessionProvider>
    </Ctx.Provider>
  );

  if (state === "loading") {
    if (hasToken) {
      return shell(
        <SkeletonRegion label="Loading your workspace" visible={boot.skeletonVisible}>
          <CsmRouteSkeleton pathname={pathname} />
        </SkeletonRegion>,
      );
    }
    return (
      <div className={s.boot}>
        <p className={s.sr} role="status">
          Checking your session
        </p>
      </div>
    );
  }

  if (state === "error" || state === "denied") {
    return (
      <div className={s.boot}>
        <Notice
          tone="danger"
          urgent
          headingLevel={1}
          title={state === "denied" ? "This book belongs to another CSM" : "The ILP server did not answer"}
          actions={
            state === "denied" ? (
              <Button variant="secondary" onClick={() => router.replace("/csm")}>
                Open my own day
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => { setState("loading"); check(); }}>
                Try again
              </Button>
            )
          }
          fix={{
            steps:
              state === "denied"
                ? [
                    "Press Open my own day to go back to your members.",
                    "If you are covering for a colleague, ask an ILP admin to move their members to you for that time.",
                  ]
                : [
                    "Press Try again. The server sometimes needs up to a minute to wake up.",
                    "Check that you are connected to the internet: open any other website.",
                    "If other websites work but this keeps failing, tell an ILP admin.",
                  ],
          }}
        >
          {state === "denied" ? "CSMs see only their own members." : "Your workspace could not be opened. Nothing you saved is lost."}
        </Notice>
      </div>
    );
  }

  if (state === "login" || !me) {
    return (
      <PortalLogin
        role="csm"
        title="Customer success at ILP"
        sub="Enter your ILP work email to get a sign-in code. This portal is for Customer Success Managers."
        onSuccess={() => {
          setState("loading");
          check().then(() => {
            const next = safeNext();
            if (next && next !== pathname) router.replace(next);
          });
        }}
      />
    );
  }

  return shell(children);
}

/** True when an error is the server's "another CSM's member" answer. */
export function isScopeDenied(e: unknown): boolean {
  return e instanceof ApiError && e.status === 403;
}

