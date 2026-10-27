"use client";

import { useEffect, useState } from "react";
import { Button, DateInput, ProgressBar, Select, Stagger, StaggerItem, StatusPill, TextInput, useUnsavedChanges } from "@/components/ui";
import { ApiError } from "@/lib/api";
import type { ProfileSection } from "@/lib/contracts";
import { memberApi } from "./api";
import { useMember } from "./MemberContext";
import DocumentsPanel from "./DocumentsPanel";
import {
  FIELD_META,
  PROFILE_SECTIONS,
  SECTION_COPY,
  fromInput,
  isFilled,
  sectionFields,
  toInput,
} from "./profileFields";
import s from "./ProfileAndDocuments.module.scss";

export default function ProfileAndDocuments() {
  const { home } = useMember();
  const pct = Math.round(home.completeness.score * 100);

  useEffect(() => {
    if (window.location.hash === "#documents") {
      document.getElementById("documents")?.scrollIntoView({ block: "start" });
    }
  }, []);

  return (
    <Stagger>
    <div className={s.page}>
      <StaggerItem as="section" index={0} className={s.summary} aria-labelledby="completion-title">
        <div className={s.summaryHead}>
          <h2 className={s.summaryTitle} id="completion-title">
            Your profile is {pct}% complete
          </h2>
          {home.completeness.consultationReady ? (
            <StatusPill label="Ready for your lawyer" tone="success" size="sm" />
          ) : (
            <StatusPill label="Not ready yet" tone="warning" size="sm" />
          )}
        </div>
        <ProgressBar label="Profile completion" value={home.completeness.score} valueText={`${pct}% complete`} />
        <p className={s.summaryBody}>
          {home.completeness.consultationReady
            ? "Your lawyer has what they need before a call. Keep it up to date when something changes."
            : "Fill in at least 70% so your lawyer can prepare before your call. Your ILP team sees the same number."}
        </p>
      </StaggerItem>

      <div className={s.sections}>
        {PROFILE_SECTIONS.map((sec, i) => (
          <StaggerItem key={sec} index={i + 1}>
            <SectionForm section={sec} />
          </StaggerItem>
        ))}
      </div>

      <StaggerItem index={PROFILE_SECTIONS.length + 1}>
        <DocumentsPanel />
      </StaggerItem>
    </div>
    </Stagger>
  );
}

function SectionForm({ section }: { section: ProfileSection }) {
  const { home, refresh } = useMember();
  const keys = sectionFields(section);
  const initial = () => Object.fromEntries(keys.map((k) => [k, toInput(home.profile[k], FIELD_META[k]?.kind ?? "text")]));
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const dirty = keys.some((k) => values[k] !== toInput(home.profile[k], FIELD_META[k]?.kind ?? "text"));
  const filled = keys.filter((k) => isFilled(home.profile[k])).length;
  const copy = SECTION_COPY[section];
  useUnsavedChanges(dirty, `Your ${copy.title.toLowerCase()} changes are not saved yet. If you leave now, they will be lost.`);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const k of keys) {
        const meta = FIELD_META[k];
        if (!meta || meta.readOnly) continue;
        payload[k] = fromInput(values[k] ?? "", meta.kind);
      }
      await memberApi.saveProfile(payload);
      await refresh();
      setMsg({ ok: true, text: "Saved." });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof ApiError ? err.message : "Could not save. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={s.section} aria-labelledby={`sec-${section}`}>
      <div className={s.sectionHead}>
        <h2 className={s.sectionTitle} id={`sec-${section}`}>
          {copy.title}
        </h2>
        <span className={s.count}>
          {filled} of {keys.length} filled
        </span>
      </div>
      <p className={s.why}>{copy.why}</p>
      <div className={s.fields}>
        {keys.map((k) => {
          const meta = FIELD_META[k] ?? { label: k, kind: "text" as const };
          const id = `pf-${k}`;
          const v = values[k] ?? "";
          const set = (x: string) => setValues((cur) => ({ ...cur, [k]: x }));
          return (
            <div key={k} className={s.field}>
              {meta.kind === "yesno" ? (
                <fieldset className={s.yesno}>
                  <legend className={s.label}>{meta.label}</legend>
                  <div className={s.choices}>
                    {(["yes", "no"] as const).map((opt) => (
                      <label key={opt} className={`${s.choice} ${v === opt ? s.chosen : ""}`}>
                        <input type="radio" name={id} value={opt} checked={v === opt} onChange={() => set(opt)} />
                        {opt === "yes" ? "Yes" : "No"}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : (
                meta.kind === "select" ? (
                  <Select id={id} label={meta.label} hint={meta.hint} value={v} onChange={(e) => set(e.target.value)}>
                    <option value="">Choose…</option>
                    {meta.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                    {v && !meta.options?.some((o) => o.value === v) && <option value={v}>{v}</option>}
                  </Select>
                ) : meta.kind === "date" ? (
                  <DateInput
                    id={id}
                    label={meta.label}
                    hint={meta.hint}
                    value={v}
                    readOnly={meta.readOnly}
                    onChange={(e) => set(e.target.value)}
                    autoComplete={k === "dateOfBirth" ? "bday" : undefined}
                  />
                ) : (
                  <TextInput
                    id={id}
                    label={meta.label}
                    hint={meta.hint}
                    type={meta.kind === "number" ? "number" : meta.kind}
                    inputMode={meta.kind === "number" ? "numeric" : undefined}
                    min={meta.kind === "number" ? 0 : undefined}
                    value={v}
                    readOnly={meta.readOnly}
                    onChange={(e) => set(e.target.value)}
                    autoComplete={k === "fullName" ? "name" : k === "phone" ? "tel" : undefined}
                  />
                )
              )}
              {meta.kind === "yesno" && meta.hint && <p className={s.hint}>{meta.hint}</p>}
            </div>
          );
        })}
      </div>
      <div className={s.actions}>
        <Button onClick={save} busy={busy} disabled={!dirty} variant={dirty ? "primary" : "secondary"}>
          Save {copy.title.toLowerCase()}
        </Button>
        {msg && (
          <p className={msg.ok ? s.ok : s.err} role={msg.ok ? "status" : "alert"}>
            {msg.text}
          </p>
        )}
      </div>
    </section>
  );
}
