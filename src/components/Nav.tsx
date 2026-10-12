"use client";

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
];

const COMING_SOON = [
  { code: "ES", name: "Spain" },
  { code: "PT", name: "Portugal" },
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

  return (
    <nav className={styles.nav}>
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
          className={`${styles.link} ${styles.audience} ${!isLawyers ? styles.active : ""}`}
          aria-current={!isLawyers ? "page" : undefined}
        >
          For Customers
        </Link>
        <Link
          href="/attorneys"
          className={`${styles.link} ${styles.audience} ${isLawyers ? styles.active : ""}`}
          aria-current={isLawyers ? "page" : undefined}
        >
          For Lawyers
        </Link>

        <span className={styles.divider} aria-hidden="true" />

        {COUNTRIES.map((c) => (
          <Link key={c.code} href={c.href} className={styles.link}>
            <Flag code={c.code} name={c.name} />
            {c.name}
          </Link>
        ))}

        <span className={styles.divider} aria-hidden="true" />

        {COMING_SOON.map((c) => (
          <span key={c.code} className={styles.soon}>
            <Flag code={c.code} name={c.name} />
            {c.name}
            <span className={styles.soonBadge}>Soon</span>
          </span>
        ))}
      </div>
      <NavCta className={styles.cta} />
    </nav>
  );
}