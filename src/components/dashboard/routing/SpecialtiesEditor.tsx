"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, ChipSelect, ErrorNotice, Notice, SearchInput, Select, Skeleton, SkeletonRegion, StatusPill, TextInput, useSkeleton } from "@/components/ui";
import { AREA_GROUPS, type AreaGroupId, COUNTRIES, COUNTRY_CODES, type CountryCode } from "@/lib/contracts";
import { groupSpecialties, routingApi, type SpecialtyRow } from "@/lib/routing";
import s from "./routing.module.scss";

const COUNTRY_OPTIONS = COUNTRY_CODES.map((c) => ({ value: c, label: COUNTRIES[c].name }));
const errText = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

/**
 * Settings → Specialties: the list lawyers pick from and matters are routed
 * by. Add, rename, limit to countries, deactivate, or merge one into another
 * (lawyers and matters move to the kept one). Every change is audited.
 */
export function SpecialtiesEditor() {
  const [rows, setRows] = useState<SpecialtyRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = useCallback(() => {
    setError(null);
    routingApi.specialties().then((r) => setRows(r.items)).catch((e) => setError(errText(e, "Specialties could not be loaded.")));
  }, []);
  useEffect(load, [load]);

  const visible = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => !r.mergedInto && (!t || r.label.toLowerCase().includes(t)));
  }, [rows, q]);

  const sk = useSkeleton(!rows && !error);
  if (error && !rows) return <ErrorNotice audience="staff" variant="block" title="Specialties did not load" onRetry={load}>{error}</ErrorNotice>;
  if (sk.showSkeleton || !rows) {
    return (
      <SkeletonRegion label="Loading specialties" visible={sk.skeletonVisible}>
        <Skeleton shape="block" size="lg" />
      </SkeletonRegion>
    );
  }
  const active = rows.filter((r) => r.active && !r.mergedInto);

  return (
    <div className={s.stack}>
      <p className={s.note}>
        Lawyers choose their specialties from this list, and each member&apos;s question is matched to one. Renaming keeps every lawyer and matter on it. Turn a specialty off to hide it from lawyers; merge two that mean the same thing.
      </p>
      {msg && <p className={s.ok} role="status">{msg}</p>}
      {error && <ErrorNotice audience="staff">{error}</ErrorNotice>}
      <AddSpecialty onAdded={(label) => { setMsg(`Added "${label}".`); load(); }} />
      <SearchInput label="Find a specialty" value={q} onValueChange={setQ} placeholder="Name" />
      {groupSpecialties(visible).map((g) => (
        <section key={g.group} className={s.specGroup} aria-label={g.label}>
          <h3 className={s.h3}>{g.label}</h3>
          <ul className={s.specList}>
            {g.items.map((r) => (
              <SpecialtyItem key={r.id} row={r as SpecialtyRow} others={active.filter((x) => x.id !== r.id)} onChanged={(text) => { setMsg(text); load(); }} onError={setError} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function AddSpecialty({ onAdded }: { onAdded: (label: string) => void }) {
  const [label, setLabel] = useState("");
  const [group, setGroup] = useState<AreaGroupId>("immigration");
  const [countries, setCountries] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function add() {
    setBusy(true);
    setError(null);
    try {
      await routingApi.createSpecialty({ label, group, countries: countries as CountryCode[] });
      onAdded(label);
      setLabel("");
      setCountries([]);
    } catch (e) {
      setError(errText(e, "The specialty could not be added."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className={s.details}>
      <summary>Add a specialty</summary>
      <div className={s.addForm}>
        <TextInput label="Name" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={80} hint="Plain words a member would understand, like Condominiums and owners' associations." error={error ?? undefined} />
        <Select label="Area" value={group} onChange={(e) => setGroup(e.target.value as AreaGroupId)} options={AREA_GROUPS.map((g) => ({ value: g.id, label: g.label }))} />
        <ChipSelect label="Only in these countries" hint="Leave all off when it applies everywhere." options={COUNTRY_OPTIONS} value={countries} onChange={setCountries} id="new-spec-c" />
        <div>
          <Button onClick={add} busy={busy} disabled={busy || label.trim().length < 3}>Add specialty</Button>
        </div>
      </div>
    </details>
  );
}

function SpecialtyItem({ row, others, onChanged, onError }: { row: SpecialtyRow; others: SpecialtyRow[]; onChanged: (msg: string) => void; onError: (e: string) => void }) {
  const [label, setLabel] = useState(row.label);
  const [into, setInto] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (what: string, fn: () => Promise<unknown>, done: string) => {
    setBusy(what);
    try {
      await fn();
      onChanged(done);
    } catch (e) {
      onError(errText(e, "The change was not saved."));
    } finally {
      setBusy(null);
    }
  };
  const target = others.find((o) => o.id === into);
  return (
    <li className={s.specItem}>
      <div className={s.specMain}>
        <TextInput label="Name" hideLabel value={label} onChange={(e) => setLabel(e.target.value)} maxLength={80} />
        <span className={s.meta}>
          {row.lawyers} lawyer{row.lawyers === 1 ? "" : "s"}
          {row.countries.length ? ` · only ${row.countries.map((c) => COUNTRIES[c].name).join(", ")}` : ""}
        </span>
        {!row.active && <StatusPill size="sm" tone="neutral" label="Off: hidden from lawyers" />}
      </div>
      <div className={s.specActions}>
        <Button size="sm" variant="secondary" disabled={label.trim() === row.label || label.trim().length < 3} busy={busy === "rename"} onClick={() => run("rename", () => routingApi.updateSpecialty(row.id, { label: label.trim() }), `Renamed to "${label.trim()}".`)}>
          Rename
        </Button>
        <Button size="sm" variant="secondary" busy={busy === "toggle"} onClick={() => run("toggle", () => routingApi.updateSpecialty(row.id, { active: !row.active }), row.active ? `"${row.label}" is off.` : `"${row.label}" is on again.`)}>
          {row.active ? "Turn off" : "Turn on"}
        </Button>
        <details className={s.merge}>
          <summary>Merge</summary>
          <Select label={`Merge "${row.label}" into`} value={into} onChange={(e) => setInto(e.target.value)} options={[{ value: "", label: "Choose the specialty to keep" }, ...others.map((o) => ({ value: o.id, label: o.label }))]} />
          {target && (
            <Notice tone="info" title="What merging does">
              The {row.lawyers} lawyer{row.lawyers === 1 ? "" : "s"} with &quot;{row.label}&quot; get &quot;{target.label}&quot; instead, and so do open matters. &quot;{row.label}&quot; is then turned off for good.
            </Notice>
          )}
          <Button size="sm" variant="secondary" disabled={!into} busy={busy === "merge"} onClick={() => run("merge", () => routingApi.mergeSpecialty(row.id, into), `Merged "${row.label}" into "${target?.label}".`)}>
            Merge
          </Button>
        </details>
      </div>
    </li>
  );
}
