"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { fetchTemplates, type PublicTemplate } from "@/lib/public";
import styles from "./page.module.scss";

const FALLBACK_TEMPLATES = [
  "Costa Rica vehicle import checklist",
  "Residency renewal tracker",
  "Corporation annual filing guide",
  "Panama property due diligence checklist",
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<string[] | null>(null);

  useEffect(() => {
    let active = true;
    fetchTemplates().then((rows) => {
      if (active && rows && rows.length > 0) {
        setTemplates(
          rows
            .map((t: PublicTemplate) => t.title)
            .filter((t): t is string => Boolean(t)),
        );
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const items = templates ?? FALLBACK_TEMPLATES;

  return (
    <>
      <Nav />
      <main className={styles.main}>
        <h1 className={styles.headline}>Legal templates</h1>
        <p className={styles.sub}>
          Checklists and guides for common legal tasks abroad, each one for a
          specific country. They help you see what a task needs before you
          talk to a lawyer.
        </p>
        <ul className={styles.list}>
          {items.map((t) => (
            <li key={t} className={styles.item}>
              <span>{t}</span>
              <a href="#download" className={styles.download}>
                Download
              </a>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}