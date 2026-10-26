import Image from "next/image";
import Link from "next/link";
import s from "./funnel.module.scss";

/** Quiet header for the funnel: logo home link and one reassurance line. */
export default function FunnelHeader({ note }: { note?: string }) {
  return (
    <header className={s.header}>
      <Link href="/" className={s.brand} aria-label="International Legal Partner home">
        <Image src="/logo.png" alt="" width={32} height={32} className={s.logo} />
        ILP
      </Link>
      {note && <span className={s.headerNote}>{note}</span>}
    </header>
  );
}
