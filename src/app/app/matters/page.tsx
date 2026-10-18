"use client";

import { useEffect, useState } from "react";
import PortalShell from "@/components/PortalShell";
import { statusFetch } from "@/lib/status";
import s from "../portal.module.scss";

interface Matter {
  id: string;
  name: string | null;
  surname: string | null;
  legalArea: string | null;
  legalMatter: string | null;
  jurisdiction: string | null;
  stage: string;
  lastUpdated: string | null;
  archived: boolean;
}

export default function MattersPage() {
  const [matters, setMatters] = useState<Matter[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    statusFetch<{ matters: Matter[] }>("/api/portal/matters")
      .then((r) => setMatters(r.matters ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load matters."));
  }, []);

  return (
    <PortalShell title="Active matters & document vault">
      {error && <p className={s.empty} style={{ color: "#c0392b" }}>{error}</p>}
      {matters === null && !error && <p className={s.empty}>Loading…</p>}
      {matters !== null && matters.length === 0 && (
        <p className={s.empty}>No matters on file yet.</p>
      )}
      {matters !== null && matters.length > 0 && (
        <div className={s.list}>
          {matters.map((m) => (
            <div key={m.id} className={s.row}>
              <div>
                <div className={s.rowTitle}>
                  {[m.name, m.surname].filter(Boolean).join(" ") || m.id}
                </div>
                <div className={s.rowMeta}>
                  {[m.legalArea, m.jurisdiction].filter(Boolean).join(" · ") || "No details yet"}
                </div>
              </div>
              <span className={s.badge}>{m.stage}</span>
            </div>
          ))}
        </div>
      )}
    </PortalShell>
  );
}