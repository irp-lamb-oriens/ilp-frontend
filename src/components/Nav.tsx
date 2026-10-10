import Link from "next/link";
import Image from "next/image";
import NavCta from "./NavCta";
import styles from "./Nav.module.scss";

export default function Nav() {
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
        <Link href="/costa-rica" className={styles.link}>
          Costa Rica
        </Link>
        <Link href="/panama" className={styles.link}>
          Panama
        </Link>
        <Link href="/mexico" className={styles.link}>
          Mexico
        </Link>
        <Link href="/lawyers" className={styles.link}>
          For lawyers
        </Link>
        <Link href="/alerts" className={styles.link}>
          My alerts
        </Link>
      </div>
      <NavCta className={styles.cta} />
    </nav>
  );
}
