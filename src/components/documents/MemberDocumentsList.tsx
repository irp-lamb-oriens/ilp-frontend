"use client";

import { useEffect, useState } from "react";
import { staffApi } from "@/lib/api";
import { providerApi } from "@/lib/provider";
import { StatusPill } from "@/components/ui";
import s from "./MemberDocumentsList.module.scss";

/**
 * A member's documents for staff or the assigned lawyer (P1 routes):
 *   staff  GET /api/dashboard/members/:clientId/documents
 *   lawyer GET /api/provider/members/:clientId/documents
 * Each file link is a plain GET on `.../documents/:docId/file`: the session
 * cookie rides along, the server re-checks access and audits the download.
 */

export interface StaffDocument {
  id: string;
  matterId?: string;
  category?: string;
  fileName?: string;
  contentType?: string;
  size?: number;
  uploadedAt?: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  identity: "Identity",
  residency: "Residency",
  property: "Property",
  company: "Company",
  vehicle: "Vehicle",
  tax: "Tax",
  other: "Other",
};

function size(n?: number): string {
  if (!n) return "";
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}

function day(iso?: string): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  return Number.isNaN(t) ? "" : new Date(t).toLocaleDateString("en-US", { dateStyle: "medium" });
}

export function MemberDocumentsList({
  clientId,
  role,
  matterTitle,
  title = "Documents",
}: {
  clientId: string;
  role: "staff" | "lawyer";
  matterTitle?: (matterId: string) => string | undefined;
  title?: string;
}) {
  const api = role === "staff" ? staffApi : providerApi;
  const base = `/api/${role === "staff" ? "dashboard" : "provider"}/members/${encodeURIComponent(clientId)}/documents`;
  const [items, setItems] = useState<StaffDocument[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setItems(null);
    setError(null);
    api
      .get<{ items: StaffDocument[] }>(base)
      .then((r) => alive && setItems(r.items ?? []))
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Documents could not be loaded."));
    return () => {
      alive = false;
    };
  }, [api, base]);

  return (
    <section className={s.block} aria-label={title}>
      <div className={s.head}>
        <h2 className={s.title}>{title}</h2>
        {items && <span className={s.meta}>{items.length}</span>}
      </div>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      {!error && !items && <p className={s.meta}>Loading documents…</p>}
      {items && items.length === 0 && <p className={s.meta}>The member has not uploaded any documents yet.</p>}
      {items && items.length > 0 && (
        <ul className={s.list}>
          {items.map((d) => (
            <li key={d.id} className={s.item}>
              <div className={s.main}>
                <a className={s.link} href={api.url(`${base}/${encodeURIComponent(d.id)}/file`)} download>
                  {d.fileName || "Document"}
                </a>
                <span className={s.meta}>
                  {[d.matterId ? matterTitle?.(d.matterId) ?? "Matter" : "General", day(d.uploadedAt), size(d.size)].filter(Boolean).join(" · ")}
                </span>
              </div>
              {d.category && <StatusPill size="sm" label={CATEGORY_LABEL[d.category] ?? d.category} srPrefix="Category" />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default MemberDocumentsList;
