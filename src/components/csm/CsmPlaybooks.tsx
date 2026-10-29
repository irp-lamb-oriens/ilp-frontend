"use client";

import { useState } from "react";
import { csmApi } from "@/lib/api";
import { EMAIL_CLASS_LABEL, type Playbook } from "@/lib/csm";
import { Button, Dialog, Notice, SkeletonRegion, Stagger, StaggerItem, StatusPill, TextArea, TextInput, useUnsavedChanges } from "@/components/ui";
import { ErrorText, PageHeader } from "../dashboard/staff/PageHeader";
import { shortDate } from "../dashboard/staff/format";
import { PlaybooksSkeleton } from "./CsmSkeletons";
import { useCsmData } from "./useCsmData";
import s from "./csm.module.scss";

/** Playbooks: steps for recurring moments and the email each one sends (editable by CSMs and admins). */
export default function CsmPlaybooks() {
  const { data, error, reload, showSkeleton, skeletonVisible } = useCsmData<{ items: Playbook[]; canEdit: boolean }>("/api/csm/playbooks");
  const [editing, setEditing] = useState<Playbook | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  if (error) return <ErrorText onRetry={reload}>{error}</ErrorText>;
  if (showSkeleton || !data) return <SkeletonRegion label="Loading playbooks" visible={skeletonVisible}><PlaybooksSkeleton /></SkeletonRegion>;
  return (
    <Stagger>
      <PageHeader title="Playbooks" sub="Send these emails from a member's page, under Your actions." />
      {saved && <Notice tone="success" variant="inline" title={saved} />}
      <div className={s.playbooks} data-tour="csm-playbooks">
        {data.items.map((p, i) => (
          <StaggerItem as="article" index={i} key={p.id} className={s.block} aria-labelledby={`pb-${p.id}`}>
            <div className={s.blockHead}>
              <h2 id={`pb-${p.id}`} className={s.h2}>{p.title}</h2>
              <StatusPill size="sm" label={EMAIL_CLASS_LABEL[p.emailClass]} tone={p.emailClass === "transactional" ? "info" : "neutral"} />
            </div>
            <p className={s.lede}>{p.when}</p>
            <ol className={s.steps}>
              {p.steps.map((st) => (
                <li key={st}>{st}</li>
              ))}
            </ol>
            <div className={s.emailPreview}>
              <p className={s.label}>Email subject</p>
              <p className={s.subject}>{p.email.subject}</p>
              {p.email.paragraphs.map((x) => (
                <p key={x} className={s.para}>{x}</p>
              ))}
              {p.email.cta && <p className={s.meta}>Button: {p.email.cta.label}</p>}
              <p className={s.meta}>{p.edited ? `Edited${p.updatedBy ? ` by ${p.updatedBy}` : ""}${p.updatedAt ? ` on ${shortDate(p.updatedAt)}` : ""}.` : "ILP default wording."}</p>
            </div>
            {data.canEdit && (
              <div className={s.row}>
                <Button size="sm" variant="secondary" onClick={() => setEditing(p)}>
                  Edit the email
                </Button>
              </div>
            )}
          </StaggerItem>
        ))}
      </div>
      {editing && (
        <EditPlaybook
          playbook={editing}
          onClose={() => setEditing(null)}
          onSaved={(title) => {
            setEditing(null);
            setSaved(title);
            reload();
          }}
        />
      )}
    </Stagger>
  );
}

function EditPlaybook({ playbook, onClose, onSaved }: { playbook: Playbook; onClose: () => void; onSaved: (msg: string) => void }) {
  const [subject, setSubject] = useState(playbook.email.subject);
  const [body, setBody] = useState(playbook.email.paragraphs.join("\n\n"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = subject !== playbook.email.subject || body !== playbook.email.paragraphs.join("\n\n");
  useUnsavedChanges(dirty, "Your changes to this email are not saved yet.");

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const paragraphs = body.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
      await csmApi.put(`/api/csm/playbooks/${playbook.id}`, { subject: subject.trim(), paragraphs });
      onSaved(`Saved the ${playbook.title} email. Every CSM now sends this wording.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The email could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setBusy(true);
    try {
      await csmApi.post(`/api/csm/playbooks/${playbook.id}/reset`, {});
      onSaved(`The ${playbook.title} email is back to the ILP default.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The email could not be reset.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Edit the ${playbook.title} email`}
      closeLabel="Close without saving"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          {playbook.edited && <Button variant="secondary" onClick={reset} busy={busy}>Back to the default</Button>}
          <Button onClick={save} busy={busy}>Save for every CSM</Button>
        </>
      }
    >
      <div className={s.form}>
        <TextInput label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={140} required />
        <TextArea
          label="Paragraphs"
          hint="Leave an empty line between paragraphs. {{firstName}}, {{csmName}} and {{periodEnd}} are filled in for each member. Your name and the legal footer are added at the end."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          error={error ?? undefined}
        />
      </div>
    </Dialog>
  );
}
