"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import PortalLogin from "@/components/auth/PortalLogin";
import { RoleShell } from "@/components/shell";
import type { NavItem } from "@/components/shell";
import {
  IconNavBoard,
  IconNavBriefcase,
  IconNavChart,
  IconNavMoney,
  IconNavPeople,
  IconNavShield,
  IconNavSliders,
  IconNavTag,
  IconNavToday,
} from "@/components/shell/navIcons";
import { ApiError, getRoleToken, staffApi } from "@/lib/api";
import { Button, Notice, SkeletonRegion, useSkeleton } from "@/components/ui";
import StaffRouteSkeleton from "./StaffRouteSkeleton";
import type { StaffRole } from "./types";
import s from "./staff.module.scss";

export interface StaffSession {
  email: string;
  role: StaffRole;
  isAdmin: boolean;
}

const Ctx = createContext<StaffSession | null>(null);

/** The signed-in staff member. Only valid inside /dashboard (StaffFrame). */
export function useStaff(): StaffSession {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStaff() used outside the staff frame");
  return v;
}

const ROLE_TITLE: Record<StaffRole, string> = {
  staff: "ILP staff",
  csm: "Customer Success Manager",
  admin: "Administrator",
};

/** Staff nav. Finance and Settings are admin only (plan W6 deliverable 6). */
export function staffNav(role: StaffRole): NavItem[] {
  const all: Array<NavItem & { admin?: boolean }> = [
    { href: "/dashboard", label: "Today", icon: <IconNavToday />, match: "exact" },
    { href: "/dashboard/members", label: "Members", icon: <IconNavPeople /> },
    { href: "/dashboard/pipeline", label: "Pipeline", icon: <IconNavBoard /> },
    { href: "/dashboard/opportunities", label: "Opportunities", icon: <IconNavTag /> },
    { href: "/dashboard/lawyers", label: "Lawyers", icon: <IconNavBriefcase /> },
    { href: "/dashboard/finance", label: "Finance", icon: <IconNavMoney />, admin: true },
    { href: "/dashboard/reports", label: "Reports", icon: <IconNavChart /> },
    { href: "/dashboard/settings", label: "Settings", icon: <IconNavSliders />, admin: true },
    { href: "/dashboard/privacy", label: "Privacy", icon: <IconNavShield />, admin: true },
  ];
  return all.filter((i) => !i.admin || role === "admin").map(({ admin: _admin, ...rest }) => rest);
}

function normalizeRole(v: unknown): StaffRole {
  return v === "csm" || v === "admin" ? v : "staff";
}

function safeNext(): string | null {
  if (typeof window === "undefined") return null;
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/dashboard") ? next : null;
}

/**
 * Staff frame: checks the session (the staff Bearer token), shows the
 * email-code login when there is none, and otherwise renders the staff
 * RoleShell around the page.
 */
export function StaffFrame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<StaffSession | null>(null);
  const [state, setState] = useState<"loading" | "login" | "ready" | "error">("loading");
  // A stored token means the session check will most likely pass: show the
  // shell at once with the page skeleton instead of a blank screen. Read after
  // mount so the server render and hydration agree.
  const [hasToken, setHasToken] = useState(false);
  const boot = useSkeleton(state === "loading" && hasToken);

  const check = useCallback(async () => {
    try {
      const r = await staffApi.get<{ email: string; role?: string }>("/api/dashboard/auth/check", { on401: "throw" });
      const role = normalizeRole(r.role);
      setSession({ email: r.email, role, isAdmin: role === "admin" });
      setState("ready");
    } catch (e) {
      setState(e instanceof ApiError && (e.status === 401 || e.status === 403) ? "login" : "error");
    }
  }, []);

  useEffect(() => {
    setHasToken(!!getRoleToken("staff"));
    check();
  }, [check]);

  const shell = (current: StaffSession | null, body: ReactNode) => (
    <Ctx.Provider value={current}>
      <RoleShell
        role="staff"
        nav={staffNav(current?.role ?? "staff")}
        user={current ? { email: current.email, title: ROLE_TITLE[current.role] } : null}
        onLogout={() => {
          staffApi.logout().then(() => {
            setSession(null);
            setState("login");
            router.push("/dashboard");
          });
        }}
        onSearch={(q) => router.push(`/dashboard/members?q=${encodeURIComponent(q)}`)}
        searchPlaceholder="Search members by name or email"
      >
        {body}
      </RoleShell>
    </Ctx.Provider>
  );

  if (state === "loading") {
    if (hasToken) {
      return shell(
        null,
        <SkeletonRegion label="Loading your workspace" visible={boot.skeletonVisible}>
          <StaffRouteSkeleton pathname={pathname ?? "/dashboard"} />
        </SkeletonRegion>,
      );
    }
    return (
      <div className={s.boot}>
        <p className={s.sr} role="status">
          Checking your session…
        </p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className={s.boot}>
        <Notice
          tone="danger"
          urgent
          headingLevel={1}
          title="The ILP server did not answer"
          actions={
            <Button variant="secondary" onClick={() => { setState("loading"); check(); }}>
              Try again
            </Button>
          }
          fix={{
            steps: [
              "Press Try again. The server sometimes needs up to a minute to wake up.",
              "Check that you are connected to the internet: open any other website.",
              "If other websites work but this keeps failing, tell an ILP admin. They can check whether the server is running.",
            ],
          }}
        >
          Your workspace could not be opened. Nothing you saved is lost.
        </Notice>
      </div>
    );
  }

  if (state === "login" || !session) {
    return (
      <PortalLogin
        role="staff"
        title="ILP staff"
        sub="Enter your ILP team email to get a sign-in code."
        onSuccess={(r) => {
          const role = normalizeRole(r.staffRole);
          setSession({ email: r.email, role, isAdmin: role === "admin" });
          setState("ready");
          const next = safeNext();
          if (next && next !== pathname) router.replace(next);
        }}
      />
    );
  }

  return shell(session, children);
}

/** True for the server's role gate (403 "Your role does not allow this action."). */
export function isRoleDenied(e: unknown): boolean {
  return e instanceof ApiError && e.status === 403;
}

/**
 * The "Admins only" state, shown in place of a section the signed-in role
 * cannot open (finance, sales report), never the raw 403 text.
 */
export function AdminsOnlyNotice({ what }: { what?: string }) {
  return (
    <Notice
      tone="info"
      title="Admins only: ask an ILP admin"
      terms={["admin"]}
      fix={{
        summary: "Access is set on the server by email address, not in this screen.",
        steps: [
          "If you only need a figure or a file from here, ask an ILP admin to send it to you.",
          "If your work needs this section every day, ask an admin to add your ILP email to the admin list (ADMIN_EMAILS on the server).",
          "Once you are added, reload this page. You do not need to sign in again.",
        ],
      }}
    >
      {what ? `${what} is` : "This section is"} limited to ILP administrators. Your account is signed in as staff.
    </Notice>
  );
}

/** Wrap admin-only pages. Non-admins get a plain explanation, not a blank page. */
export function AdminOnly({ children, what }: { children: ReactNode; what?: string }) {
  const { isAdmin } = useStaff();
  if (isAdmin) return <>{children}</>;
  return <AdminsOnlyNotice what={what} />;
}
