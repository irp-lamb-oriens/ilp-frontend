"use client";

import { useEffect, useState } from "react";
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

function Flag({ code, name }: { code: string; name: string }) {
  return (
    <Image
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt={`${name} flag`}
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
            aria-label={c.name}
            aria-current={isCountry(c.href) ? "page" : undefined}
          >
            <Flag code={c.code} name={c.name} />
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
      <NavCta className={styles.cta} />
    </nav>
  );
}