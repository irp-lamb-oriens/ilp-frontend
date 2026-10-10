import Link from "next/link";
import NavCta from "./NavCta";
import styles from "./Nav.module.scss";

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.brand}>
        International Legal Partner
      </Link>
      <div className={styles.links}>
        <Link href="/costa-rica" className={styles.link}>
          Costa Rica
        </Link>
        <Link href="/panama" className={styles.link}>
          Panama
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