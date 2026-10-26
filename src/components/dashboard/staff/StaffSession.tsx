"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import PortalLogin from "@/components/auth/PortalLogin";
import { RoleShell } from "@/components/shell";
import type { NavItem } from "@/components/shell";
import { ApiError, staffApi } from "@/lib/api";
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
    { href: "/dashboard", label: "Today", icon: "◷", match: "exact" },
    { href: "/dashboard/members", label: "Members", icon: "☰" },
    { href: "/dashboard/pipeline", label: "Pipeline", icon: "▦" },
    { href: "/dashboard/opportunities", label: "Opportunities", icon: "◇" },
    { href: "/dashboard/lawyers", label: "Lawyers", icon: "§" },
    { href: "/dashboard/finance", label: "Finance", icon: "$", admin: true },
    { href: "/dashboard/reports", label: "Reports", icon: "▤" },
    { href: "/dashboard/settings", label: "Settings", icon: "⚙", admin: true },
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
 * Staff frame: checks the session (cookie or legacy header token), shows the
 * email-code login when there is none, and otherwise renders the staff
 * RoleShell around the page.
 */
export function StaffFrame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<StaffSession | null>(null);
  const [state, setState] = useState<"loading" | "login" | "ready" | "error">("loading");

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
    check();
  }, [check]);

  if (state === "loading") {
    return (
      <p className={s.boot} role="status">
        Checking your session…
      </p>
    );
  }

  if (state === "error") {
    return (
      <div className={s.boot} role="alert">
        <p>The ILP server did not answer. Check your connection and try again.</p>
        <button type="button" className={s.retry} onClick={() => { setState("loading"); check(); }}>
          Try again
        </button>
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

  return (
    <Ctx.Provider value={session}>
      <RoleShell
        role="staff"
        nav={staffNav(session.role)}
        user={{ email: session.email, title: ROLE_TITLE[session.role] }}
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
        {children}
      </RoleShell>
    </Ctx.Provider>
  );
}

/** Wrap admin-only pages. Non-admins get a plain explanation, not a blank page. */
export function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin } = useStaff();
  if (isAdmin) return <>{children}</>;
  return (
    <div className={s.denied} role="status">
      <p className={s.deniedTitle}>This page is for administrators.</p>
      <p className={s.deniedBody}>Ask an ILP admin if you need finance figures or settings changed.</p>
    </div>
  );
}
