"use client";

import { useEffect, useState } from "react";
import PortalShell from "@/components/PortalShell";
import { statusFetch } from "@/lib/status";
import s from "../portal.module.scss";

interface Consultation {
  clientId: string;
  timestamp: string | null;
  legalArea: string | null;
  legalMatter: string | null;
  jurisdiction: string | null;
  source: string | null;
}

export default function ConsultationsPage() {
  const [items, setItems] = useState<Consultation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    statusFetch<{ consultations: Consultation[] }>("/api/portal/consultations")
      .then((r) => setItems(r.consultations ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load consultations."));
  }, []);

  return (
    <PortalShell title="Consultation history">
      {error && <p className={s.empty} style={{ color: "#c0392b" }}>{error}</p>}
      {items === null && !error && <p className={s.empty}>Loading…</p>}
      {items !== null && items.length === 0 && (
        <p className={s.empty}>No consultations yet.</p>
      )}
      {items !== null && items.length > 0 && (
        <div className={s.list}>
          {items.map((item, i) => (
            <div key={`${item.clientId}-${i}`} className={s.row}>
              <div>
                <div className={s.rowTitle}>
                  {item.legalMatter ?? item.legalArea ?? "Consultation"}
                </div>
                <div className={s.rowMeta}>
                  {[
                    item.jurisdiction,
                    item.timestamp ? new Date(item.timestamp).toLocaleDateString() : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "No details"}
                </div>
              </div>
              <span className={s.badge}>{item.source ?? "consultation"}</span>
            </div>
          ))}
        </div>
      )}
    </PortalShell>
  );
}