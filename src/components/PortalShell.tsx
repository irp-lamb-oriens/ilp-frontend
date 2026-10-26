"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RoleShell, type NavItem, type ShellRole } from "@/components/shell";
import { clearToken, getUser } from "@/lib/auth";
import { clearClientToken, getClientToken } from "@/lib/status";
import s from "./PortalShell.module.scss";

const NAV: NavItem[] = [
  { href: "/app/profile", label: "Profile", icon: "◔" },
  { href: "/app/book", label: "Book", icon: "◷" },
  { href: "/app/consultations", label: "Consultations", icon: "✉" },
  { href: "/app/matters", label: "Matters", icon: "▤" },
  { href: "/app/reminders", label: "Reminders", icon: "!" },
];

/**
 * Protected client-portal shell for the /app pages. Shows a sign-in prompt
 * when no customer session exists; otherwise renders the shared RoleShell
 * (role "client"). Kept as the default export so existing pages compile;
 * new pages should use <RoleShell> from "@/components/shell" directly.
 */
export default function PortalShell({
  title,
  children,
  role = "client",
  nav = NAV,
}: {
  title: string;
  children: React.ReactNode;
  role?: ShellRole;
  nav?: NavItem[];
}) {
  const router = useRouter();
  // Read browser sessions after mount so server and first client render match.
  const [session, setSession] = useState<{ ready: boolean; ok: boolean; email?: string }>({
    ready: false,
    ok: false,
  });

  useEffect(() => {
    const user = getUser();
    // The portal is also reachable via the OTP client-status session
    // (x-client-token). Accept either auth model so /app reflects the same
    // session established by the /status flow.
    const hasClientSession = !!getClientToken();
    const hasCustomerJwt = !!user && user.role === "customer";
    setSession({ ready: true, ok: hasCustomerJwt || hasClientSession, email: user?.email });
  }, []);

  if (!session.ready) return <div className={s.pending} aria-busy="true" />;

  if (!session.ok) {
    return (
      <main className={s.gate}>
        <div className={s.gateCard}>
          <h1 className={s.gateTitle}>Sign in to your portal</h1>
          <p className={s.gateBody}>
            Your legal profile, consultations, matters, and reminders live here.
            Sign in with the email code we send you.
          </p>
          <div className={s.gateActions}>
            <Link href="/status" className={s.gateCta}>Sign in</Link>
            <Link href="/" className={s.gateLink}>Back to home</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <RoleShell
      role={role}
      nav={nav}
      title={title}
      user={{ email: session.email ?? "Member" }}
      showCountry={false}
      homeHref="/app/profile"
      onLogout={() => {
        clearClientToken();
        clearToken();
        router.push("/status");
      }}
    >
      {children}
    </RoleShell>
  );
}
