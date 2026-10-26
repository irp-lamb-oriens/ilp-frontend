"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, EmptyState, Select, StatusPill } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { memberApi, type MemberDocument } from "./api";
import { DOCUMENT_ACCEPT, DOCUMENT_MAX_BYTES, uploadMemberDocument } from "./documentUpload";
import { useMember } from "./MemberContext";
import { dateShort } from "./format";
import s from "./DocumentsPanel.module.scss";

const CATEGORY_LABEL: Record<string, string> = {
  identity: "Identity",
  residency: "Residency",
  property: "Property",
  company: "Company",
  vehicle: "Vehicle",
  tax: "Tax",
  other: "Other",
};
function size(n: number): string {
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}

/** Upload per matter with a category tag; list what is on file. */
export default function DocumentsPanel() {
  const { home, matter } = useMember();
  const [items, setItems] = useState<MemberDocument[] | null>(null);
  const [categories, setCategories] = useState<string[]>(Object.keys(CATEGORY_LABEL));
  const [matterId, setMatterId] = useState<string>(matter?.id ?? "");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    memberApi
      .documents()
      .then((d) => {
        setItems(d.items);
        if (d.categories?.length) setCategories(d.categories);
      })
      .catch(() => setItems([]));
  }, []);

  useEffect(load, [load]);
  useEffect(() => setMatterId(matter?.id ?? ""), [matter?.id]);

  async function upload() {
    if (!file) return setMsg({ ok: false, text: "Choose a file first." });
    if (!category) return setMsg({ ok: false, text: "Choose what kind of document it is." });
    if (file.size > DOCUMENT_MAX_BYTES) {
      return setMsg({ ok: false, text: "That file is larger than 15 MB. Try a smaller scan, or email it to your ILP team." });
    }
    setBusy(true);
    setMsg(null);
    try {
      await uploadMemberDocument(file, { matterId: matterId || undefined, category });
      setMsg({ ok: true, text: `${file.name} is uploaded and on file for your lawyer.` });
      setFile(null);
      setCategory("");
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof ApiError ? err.message : "Upload failed. Try again." });
    } finally {
      setBusy(false);
    }
  }

  const matterTitle = (id?: string) => home.matters.find((m) => m.id === id)?.title;

  return (
    <section className={s.wrap} id="documents" aria-labelledby="documents-title">
      <h2 className={s.title} id="documents-title">
        Documents
      </h2>
      <p className={s.intro}>Upload scans or photos your lawyer asked for. PDF, JPG, PNG, HEIC or Word, up to 15 MB each. Only you, your ILP team and your lawyer can open them.</p>

      <div className={s.form}>
        {home.matters.length > 1 && (
          <div className={s.field}>
            <Select label="Which matter is it for?" id="doc-matter" value={matterId} onChange={(e) => setMatterId(e.target.value)}>
              <option value="">General (not one matter)</option>
              {home.matters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </Select>
          </div>
        )}
        <div className={s.field}>
          <Select
            label="What kind of document is it?"
            id="doc-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Choose…</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c] ?? c}
              </option>
            ))}
          </Select>
        </div>
        <div className={s.field}>
          <label htmlFor="doc-file" className={s.label}>
            File
          </label>
          <input
            id="doc-file"
            ref={fileRef}
            type="file"
            className={s.file}
            accept={DOCUMENT_ACCEPT}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className={s.submit}>
          <Button onClick={upload} busy={busy} disabled={!file}>
            Upload document
          </Button>
        </div>
        {msg && (
          <p className={msg.ok ? s.ok : s.err} role={msg.ok ? "status" : "alert"}>
            {msg.text}
          </p>
        )}
      </div>

      {items === null ? (
        <p className={s.muted}>Loading your documents…</p>
      ) : items.length === 0 ? (
        <EmptyState compact title="No documents yet" body="Documents you upload appear here, tagged by type and matter." />
      ) : (
        <ul className={s.list}>
          {items.map((d) => (
            <li key={d.id} className={s.item}>
              <div className={s.itemMain}>
                <a className={s.link} href={memberApi.documentUrl(d.id)} rel="noopener">
                  {d.fileName}
                </a>
                <p className={s.meta}>
                  {[matterTitle(d.matterId) ?? "General", dateShort(d.uploadedAt), size(d.size)].join(" · ")}
                </p>
              </div>
              <StatusPill label={CATEGORY_LABEL[d.category] ?? d.category} size="sm" srPrefix="Category" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
