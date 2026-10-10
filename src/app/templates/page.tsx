"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { fetchTemplates, type PublicTemplate } from "@/lib/public";
import styles from "./page.module.scss";

const FALLBACK_TEMPLATES = [
  "Panama Property Due-Diligence Checklist",
  "Costa Rica Vehicle Import Checklist",
  "Residency Renewal Tracker",
  "Corporation Annual Filing Guide",
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
          Versioned, jurisdiction-specific downloads, reviewed by local
          professionals. Downloading shares your intent and enriches your
          profile.
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