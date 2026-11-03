"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import NavCta from "./NavCta";
import styles from "./Nav.module.scss";

const COUNTRIES = [
  { code: "CO", name: "Colombia", href: "/colombia" },
  { code: "CR", name: "Costa Rica", href: "/costa-rica" },
  { code: "PA", name: "Panama", href: "/panama" },
  { code: "MX", name: "Mexico", href: "/mexico" },
  { code: "ES", name: "Spain", href: "/spain" },
  { code: "PT", name: "Portugal", href: "/portugal" },
];

/** Decorative: every flag sits next to the country's name (visible or visually hidden). */
function Flag({ code }: { code: string }) {
  return (
    <Image
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt=""
      width={20}
      height={15}
      className={styles.flag}
      loading="lazy"
    />
  );
}

export default function Nav() {
  const pathname = usePathname();
  const isLawyers = pathname === "/attorneys" || pathname === "/lawyers";
  const isCsm = pathname === "/customer-success";
  const isMembers = !isLawyers && !isCsm;
  const isCountry = (href: string) => pathname === href;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const closeMenu = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) menuButtonRef.current?.focus();
  }, []);

  // Close on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Open: focus the first link; Escape closes and returns focus; wider than lg closes.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu(true);
    };
    const wide = window.matchMedia("(min-width: 1024px)");
    const onWide = () => wide.matches && closeMenu();
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open, closeMenu]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}>
      <Link href="/" className={styles.brand} aria-label="International Legal Partner">
        <Image
          src="/logo.png"
          alt="International Legal Partner"
          width={40}
          height={40}
          className={styles.logo}
          priority
        />
        <span className={styles.wordmark}>International Legal Partner</span>
      </Link>
      <div className={styles.links}>
        <Link
          href="/"
          className={`${styles.link} ${styles.audience} ${isMembers ? styles.active : ""}`}
          aria-current={isMembers ? "page" : undefined}
        >
          For members
        </Link>
        <Link
          href="/attorneys"
          className={`${styles.link} ${styles.audience} ${isLawyers ? styles.active : ""}`}
          aria-current={isLawyers ? "page" : undefined}
        >
          For lawyers
        </Link>
        <Link
          href="/customer-success"
          className={`${styles.link} ${styles.audience} ${isCsm ? styles.active : ""}`}
          aria-current={isCsm ? "page" : undefined}
        >
          Customer success
        </Link>

        <span className={styles.divider} aria-hidden="true" />

        {COUNTRIES.map((c) => (
          <Link
            key={c.code}
            href={c.href}
            className={`${styles.link} ${styles.countryLink} ${isCountry(c.href) ? styles.countryActive : ""}`}
            title={c.name}
            aria-current={isCountry(c.href) ? "page" : undefined}
          >
            <Flag code={c.code} />
            <span className={styles.srOnly}>{c.name}</span>
          </Link>
        ))}

        <span className={styles.divider} aria-hidden="true" />

        {isMembers && (
          <Link
            href="/status"
            className={`${styles.link} ${pathname.startsWith("/status") ? styles.active : ""}`}
          >
            Member sign in
          </Link>
        )}

        {isLawyers && (
          <Link
            href="/lawyer"
            className={`${styles.link} ${pathname.startsWith("/lawyer") ? styles.active : ""}`}
          >
            Lawyer portal
          </Link>
        )}

        {isCsm && (
          <Link href="/csm" className={styles.link}>
            CSM portal
          </Link>
        )}

      </div>
      <div className={styles.end}>
        <NavCta className={styles.cta} />
        <button
          ref={menuButtonRef}
          type="button"
          className={styles.menuButton}
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" focusable="false">
            {open ? <path d="M5 5l10 10M15 5 5 15" /> : <path d="M3.5 6h13M3.5 10h13M3.5 14h13" />}
          </svg>
          <span>{open ? "Close" : "Menu"}</span>
        </button>
      </div>

      {open && (
        <div id="site-menu" ref={panelRef} className={styles.panel}>
          <nav aria-label="Site menu">
            <ul className={styles.panelList}>
              <li>
                <Link href="/" className={styles.panelLink} aria-current={pathname === "/" ? "page" : undefined}>
                  For members
                </Link>
              </li>
              <li>
                <Link href="/attorneys" className={styles.panelLink} aria-current={isLawyers ? "page" : undefined}>
                  For lawyers
                </Link>
              </li>
              <li>
                <Link href="/customer-success" className={styles.panelLink} aria-current={isCsm ? "page" : undefined}>
                  Customer success
                </Link>
              </li>
              <li>
                <Link href="/pricing" className={styles.panelLink} aria-current={pathname === "/pricing" ? "page" : undefined}>
                  Pricing
                </Link>
              </li>
            </ul>
            <p className={styles.panelHeading}>Countries</p>
            <ul className={`${styles.panelList} ${styles.panelCountries}`}>
              {COUNTRIES.map((c) => (
                <li key={c.code}>
                  <Link href={c.href} className={styles.panelLink} aria-current={isCountry(c.href) ? "page" : undefined}>
                    <Flag code={c.code} />
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className={styles.panelList}>
              <li>
                <Link href="/status" className={styles.panelLink}>
                  Member sign in
                </Link>
              </li>
              <li>
                <Link href="/lawyer" className={styles.panelLink}>
                  Lawyer portal
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </nav>
  );
}