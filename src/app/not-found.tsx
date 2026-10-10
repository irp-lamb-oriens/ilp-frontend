import Link from "next/link";
import s from "./not-found.module.scss";

export default function NotFound() {
  return (
    <main className={s.main}>
      <p className={s.eyebrow}>404</p>
      <h1 className={s.title}>This page never made it to the docket.</h1>
      <p className={s.body}>
        The link is broken or the page moved. Your deadlines are still safe.
      </p>
      <Link href="/" className={s.cta}>
        Back home
      </Link>
    </main>
  );
}