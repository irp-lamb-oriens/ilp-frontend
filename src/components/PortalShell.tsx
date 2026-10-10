"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUser } from "@/lib/auth";
import s from "./PortalShell.module.scss";

const NAV = [
  { href: "/app/profile", label: "Profile" },
  { href: "/app/book", label: "Book" },
  { href: "/app/consultations", label: "Consultations" },
  { href: "/app/matters", label: "Matters" },
  { href: "/app/reminders", label: "Reminders" },
];

/**
 * Protected client-portal shell. Shows a sign-in prompt when no customer
 * session exists; otherwise renders the sidebar + content.
 */
export default function PortalShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const user = getUser();

  if (!user || user.role !== "customer") {
    return (
      <main className={s.gate}>
        <div className={s.gateCard}>
          <h1 className={s.gateTitle}>Sign in to your portal</h1>
          <p className={s.gateBody}>
            Your legal profile, consultations, matters, and reminders live here.
            Sign in with the email code we send you.
          </p>
          <Link href="/" className={s.gateCta}>Back to home</Link>
        </div>
      </main>
    );
  }

  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>
        <Link href="/" className={s.brand}>ILP</Link>
        <nav className={s.nav}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? `${s.link} ${s.active}` : s.link}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={s.user}>
          <span className={s.userEmail}>{user.email}</span>
        </div>
      </aside>
      <main className={s.content}>
        <h1 className={s.title}>{title}</h1>
        {children}
      </main>
    </div>
  );
}