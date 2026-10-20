"use client";

import type { LawyerClient } from "./types";
import styles from "./overviewTab.module.scss";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}

export default function OverviewTab({ client }: { client: LawyerClient }) {
  const docs = Array.isArray(client.documents) ? client.documents : [];
  const customEntries = Object.entries(client.customFields ?? {});

  return (
    <div className={styles.overview}>
      <Row label="Email" value={client.email} />
      <Row label="Phone" value={client.phone ?? "—"} />
      <Row label="Legal area" value={client.legalArea ?? "—"} />
      <Row label="Legal matter" value={client.legalMatter ?? "—"} />
      <Row label="Jurisdiction" value={client.jurisdiction ?? "—"} />
      <Row label="Source" value={client.source ?? "—"} />
      <Row label="Created" value={fmtDate(client.createdAt)} />

      <div className={styles.block}>
        <span className={styles.blockLabel}>Documents</span>
        {docs.length === 0 ? (
          <span className={styles.muted}>—</span>
        ) : (
          <div className={styles.docList}>
            {docs.map((d, i) => (
              <span key={i} className={styles.docChip}>
                {d}
              </span>
            ))}
          </div>
        )}
      </div>

      {customEntries.length > 0 && (
        <div className={styles.block}>
          <span className={styles.blockLabel}>Custom fields</span>
          <div className={styles.customFields}>
            {customEntries.map(([k, v]) => (
              <div key={k} className={styles.customRow}>
                <span className={styles.customKey}>{k}</span>
                <span className={styles.customValue}>{String(v ?? "—")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
    </div>
  );
}