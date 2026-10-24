"use client";

import Nav from "@/components/Nav";
import DeadlineConfig from "@/components/deadlines/DeadlineConfig";
import { Reveal, RevealTitle } from "@/components/motion/Motion";
import styles from "./page.module.scss";

export default function DeadlinesPage() {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        <RevealTitle
          as="h1"
          text="Your legal deadlines"
          className={styles.headline}
        />
        <p className={styles.sub}>
          Pick a country and record the dates that matter to you. ILP turns
          each one into reminders before it is due.
        </p>
        <Reveal>
          <DeadlineConfig />
        </Reveal>
      </main>
    </>
  );
}