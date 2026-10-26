"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RoleShell } from "@/components/shell";
import type { NavItem } from "@/components/shell";
import PortalLogin from "@/components/auth/PortalLogin";
import { Button, EmptyState } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { projectIdToEmail } from "@/lib/status";
import { memberApi, type MemberHome } from "./api";
import { MemberContext } from "./MemberContext";
import MatterSwitcher from "./MatterSwitcher";
import s from "./StatusApp.module.scss";

const MATTER_KEY = "ilp_status_matter";

export const CLIENT_NAV: NavItem[] = [
  { href: "/status", label: "Overview", icon: "◧", match: "exact" },
  { href: "/status/profile", label: "Profile", icon: "◔" },
  { href: "/status/money", label: "Money", icon: "$" },
  { href: "/status/messages", label: "Messages", icon: "✉" },
];

const TITLES: Array<[RegExp, string]> = [
  [/^\/status\/profile/, "Profile and documents"],
  [/^\/status\/money/, "Money"],
  [/^\/status\/messages/, "Messages"],
  [/^\/status\/book/, "Book a call"],
];

type Phase = "loading" | "signedOut" | "ready" | "error";

function readMatter(): string | null {
  try {
    return window.sessionStorage.getItem(MATTER_KEY);
  } catch {
    return null;
  }
}

/** Auth gate + client RoleShell + member data for every /status route. */
export default function StatusApp({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/status";
  const params = useSearchParams();
  const welcome = params?.get("welcome") === "1";
  const project = params?.get("project");

  const [phase, setPhase] = useState<Phase>("loading");
  const [home, setHome] = useState<MemberHome | null>(null);
  const [matterId, setMatterIdState] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const h = await memberApi.home();
      setHome(h);
      setPhase("ready");
      setMatterIdState((cur) => {
        const want = cur ?? readMatter();
        if (want && h.matters.some((m) => m.id === want)) return want;
        return h.matters.find((m) => !m.closedAt)?.id ?? h.matters[0]?.id ?? null;
      });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) setPhase("signedOut");
      else setPhase("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setMatterId = useCallback((id: string) => {
    setMatterIdState(id);
    try {
      window.sessionStorage.setItem(MATTER_KEY, id);
    } catch {
      // per-tab convenience only
    }
  }, []);

  const value = useMemo(() => {
    if (!home) return null;
    return {
      home,
      refresh: load,
      matterId,
      setMatterId,
      matter: home.matters.find((m) => m.id === matterId) ?? null,
      welcome,
    };
  }, [home, load, matterId, setMatterId, welcome]);

  if (phase === "loading") {
    return (
      <div className={s.center} role="status">
        <p className={s.loading}>Opening your ILP home…</p>
      </div>
    );
  }

  if (phase === "signedOut") {
    const next = params?.get("next");
    return (
      <PortalLogin
        role="client"
        initialEmail={project ? projectIdToEmail(project) : undefined}
        title={welcome || project ? "Sign in to open your new membership" : undefined}
        sub={
          welcome || project
            ? "Your payment went through. Enter your email to get a sign-in code, and your membership opens with your first steps ready."
            : undefined
        }
        onSuccess={() => {
          setPhase("loading");
          if (next && next.startsWith("/status")) router.replace(next);
          void load();
        }}
      />
    );
  }

  if (phase === "error" || !value) {
    return (
      <div className={s.center}>
        <EmptyState
          title="We could not open your home right now"
          body="This is on our side. Try again in a minute; if it keeps happening, email your ILP team."
          action={<Button onClick={() => { setPhase("loading"); void load(); }}>Try again</Button>}
        />
      </div>
    );
  }

  const title = TITLES.find(([re]) => re.test(pathname))?.[1];
  // Matter-scoped screens only: Overview and booking.
  const showSwitcher = value.home.matters.length > 1 && (pathname === "/status" || pathname.startsWith("/status/book"));

  return (
    <MemberContext.Provider value={value}>
      <RoleShell
        role="client"
        nav={CLIENT_NAV}
        title={title}
        actions={showSwitcher ? <MatterSwitcher /> : undefined}
        user={{ name: value.home.member.name, email: value.home.member.email ?? "", title: "ILP member" }}
        onLogout={() => {
          void memberApi.logout().then(() => {
            setHome(null);
            setPhase("signedOut");
            router.replace("/status");
          });
        }}
        showCountry={false}
        bell={null}
        homeHref="/status"
      >
        <div className={s.root}>{children}</div>
      </RoleShell>
    </MemberContext.Provider>
  );
}
