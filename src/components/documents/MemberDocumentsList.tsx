"use client";

import { useEffect, useMemo, useState } from "react";
import { downloadFile, staffApi } from "@/lib/api";
import { providerApi } from "@/lib/provider";
import { FilterBar, ListFooter, Loadable, Skeleton, StatusPill, ErrorNotice } from "@/components/ui";
import { LOCAL_SCHEMAS } from "@/lib/localListSchemas";
import { useSchemaList } from "@/lib/useSchemaList";
import { DownloadButton } from "./DownloadButton";
import s from "./MemberDocumentsList.module.scss";

/**
 * A member's documents for staff or the assigned lawyer (P1 routes):
 *   staff  GET /api/dashboard/members/:clientId/documents
 *   lawyer GET /api/provider/members/:clientId/documents
 * Each file is fetched from `.../documents/:docId/file` with the role's Bearer
 * token and saved as a blob (downloadFile); the server re-checks access and
 * audits the download.
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

  // FILTERS: kind, matter, date, size and file name, paged in the browser.
  const matterOf = (d: StaffDocument) => (d.matterId ? matterTitle?.(d.matterId) ?? "Matter" : "General");
  const dl = useSchemaList<StaffDocument>({
    schema: LOCAL_SCHEMAS.memberFiles,
    key: `${role}-member-files-${clientId}`,
    rows: items,
    pageSize: 8,
    defaultSort: { key: "uploadedAt", dir: "desc" },
    keyOf: (d) => d.id,
    local: { read: (d, f) => (f.key === "matter" ? matterOf(d) : undefined) },
  });
  const matterOptions = useMemo(
    () => ({ matter: [...new Set((items ?? []).map((d) => (d.matterId ? matterTitle?.(d.matterId) ?? "Matter" : "General")))].map((m) => ({ value: m, label: m })) }),
    [items, matterTitle],
  );

  return (
    <section className={s.block} aria-label={title}>
      <div className={s.head}>
        <h2 className={s.title}>{title}</h2>
        {items && <span className={s.meta}>{items.length}</span>}
      </div>
      {error && (
        <ErrorNotice audience={role}>{error}</ErrorNotice>
      )}
      <Loadable loading={!error && !items} label="Loading documents" skeleton={<DocumentsSkeleton />}>
        {null}
      </Loadable>
      {items && items.length === 0 && <p className={s.meta}>The member has not uploaded any documents yet.</p>}
      {items && items.length > 3 && <FilterBar list={dl} noun="documents" searchLabel="Search documents" placeholder="File name" sortOptions="schema" options={matterOptions} compact />}
      {items && items.length > 0 && dl.list.status === "done" && dl.list.items.length === 0 && <p className={s.meta}>No document matches these filters.</p>}
      {items && items.length > 0 && (
        <ul className={s.list}>
          {dl.list.items.map((d) => (
            <li key={d.id} className={s.item}>
              <div className={s.main}>
                <DownloadButton
                  className={s.link}
                  download={() => downloadFile(role, `${base}/${encodeURIComponent(d.id)}/file`, d.fileName || "document")}
                >
                  {d.fileName || "Document"}
                </DownloadButton>
                <span className={s.meta}>
                  {[d.matterId ? matterTitle?.(d.matterId) ?? "Matter" : "General", day(d.uploadedAt), size(d.size)].filter(Boolean).join(" · ")}
                </span>
              </div>
              {d.category && <StatusPill size="sm" label={CATEGORY_LABEL[d.category] ?? d.category} srPrefix="Category" />}
            </li>
          ))}
        </ul>
      )}
      {items && items.length > 0 && <ListFooter list={dl.list} audience={role} auto={false} endLabel={null} loadMoreLabel="Show more documents" />}
    </section>
  );
}

/** Three files: name, matter and date, category pill. */
function DocumentsSkeleton() {
  return (
    <ul className={s.list} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className={s.item}>
          <div className={s.mainSk}>
            <Skeleton shape="line" size="md" width={i % 2 ? "40" : "60"} />
            <Skeleton shape="line" size="xs" width="40" />
          </div>
          <Skeleton shape="pill" size="sm" />
        </li>
      ))}
    </ul>
  );
}

export default MemberDocumentsList;
