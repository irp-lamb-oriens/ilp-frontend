"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Button,
  Checkbox,
  ChipSelect,
  ErrorNotice,
  IconCheck,
  MoneyInput,
  Notice,
  NumberStepper,
  SearchInput,
  Select,
  Skeleton,
  SkeletonRegion,
  StaggerItem,
  StatusPill,
  Switch,
  TextArea,
  TextInput,
  useSkeleton,
  useUnsavedChanges,
} from "@/components/ui";
import { ApiError } from "@/lib/api";
import {
  CALL_LANGUAGES,
  COUNTRIES,
  COUNTRY_CODES,
  type CountryCode,
  LANGUAGE_LEVELS,
  LAWYER_CLIENT_TYPES,
  type LanguageLevel,
  type LawyerRoutingStatus,
  type Specialty,
} from "@/lib/contracts";
import {
  CLIENT_TYPE_LABEL,
  groupSpecialties,
  LANGUAGE_LABEL,
  LEVEL_LABEL,
  type ProfileAdapter,
  type ProfileForm,
} from "@/lib/routing";
import s from "./ProfileView.module.scss";

const RESPONSE_OPTIONS = [4, 8, 24, 48, 72].map((h) => ({ value: String(h), label: h < 24 ? `Within ${h} hours` : h === 24 ? "Within a day" : `Within ${h / 24} days` }));

/** Comparable snapshot of the editable parts. */
const fingerprint = (p: ProfileForm) => JSON.stringify({ ...p, specialties: [...p.specialties].sort(), languages: [...p.languages].sort() });

const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);
const fieldErrors = (err: unknown): Record<string, string> =>
  err instanceof ApiError && err.body && typeof err.body === "object" && "errors" in err.body ? ((err.body as { errors: Record<string, string> }).errors ?? {}) : {};

/**
 * ROUTING: the lawyer's profile the router reads. Lawyers edit their own on
 * /lawyer/profile; staff open any lawyer from Lawyers → Capacity with the
 * staff adapter, which also unlocks countries, licence verification, notary
 * status and the onboarding state. Ratings are never shown here.
 */
export default function ProfileView({ adapter, intro, title }: { adapter: ProfileAdapter; intro?: ReactNode; title?: string }) {
  const staff = adapter.audience === "staff";
  const [specialties, setSpecialties] = useState<Specialty[] | null>(null);
  const [base, setBase] = useState<ProfileForm | null>(null);
  const [draft, setDraft] = useState<ProfileForm | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [query, setQuery] = useState("");
  const [regionsText, setRegionsText] = useState("");
  const [conflictsText, setConflictsText] = useState("");

  async function load() {
    setLoadError(null);
    try {
      const r = await adapter.load();
      setSpecialties(r.specialties.filter((x) => x.active));
      setBase(r.profile);
      setDraft(r.profile);
      setRegionsText((r.profile.regions ?? []).join(", "));
      setConflictsText((r.profile.conflicts ?? []).join("\n"));
    } catch (err) {
      setLoadError(errorText(err, "The profile could not be loaded."));
    }
  }

  useEffect(() => {
    load();
    // Load once per adapter (the staff drawer remounts per lawyer).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const withLists = (d: ProfileForm): ProfileForm => ({
    ...d,
    regions: regionsText.split(",").map((x) => x.trim()).filter(Boolean),
    conflicts: conflictsText.split("\n").map((x) => x.trim()).filter(Boolean),
  });
  const dirty = useMemo(() => !!base && !!draft && fingerprint(withLists(draft)) !== fingerprint(base), [base, draft, regionsText, conflictsText]); // eslint-disable-line react-hooks/exhaustive-deps
  useUnsavedChanges(dirty, staff ? "This lawyer's profile has changes that are not saved yet." : "Your profile has changes that are not saved yet. If you leave now, they will be lost.");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (specialties ?? []).filter((x) => !q || x.label.toLowerCase().includes(q) || (x.description ?? "").toLowerCase().includes(q));
    return groupSpecialties(list);
  }, [specialties, query]);

  const { showSkeleton, skeletonVisible } = useSkeleton(!draft && !loadError);
  if (loadError) {
    return (
      <ErrorNotice audience={staff ? "staff" : "lawyer"} variant="block" title="The profile did not load" onRetry={load}>
        {loadError}
      </ErrorNotice>
    );
  }
  if (showSkeleton || !draft || !specialties) {
    return (
      <SkeletonRegion label="Loading the profile" visible={skeletonVisible}>
        <ProfileSkeleton />
      </SkeletonRegion>
    );
  }

  const patch = (p: Partial<ProfileForm>) => {
    setSaved(false);
    setError(null);
    setDraft((d) => (d ? { ...d, ...p } : d));
  };
  const labelOf = new Map(specialties.map((x) => [x.id, x.label]));
  const you = staff ? "the lawyer" : "you";

  async function save() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    setErrors({});
    setSaved(false);
    const d = withLists(draft);
    const body: Partial<ProfileForm> = {
      specialties: d.specialties,
      specialtyNotes: Object.fromEntries(Object.entries(d.specialtyNotes ?? {}).filter(([k, v]) => d.specialties.includes(k) && v.trim())),
      languages: d.languages,
      languageLevels: Object.fromEntries(Object.entries(d.languageLevels ?? {}).filter(([k]) => d.languages.includes(k))),
      emailLanguage: d.emailLanguage,
      regions: d.regions,
      clientTypes: d.clientTypes,
      maxCallsPerWeek: d.maxCallsPerWeek,
      responseHours: d.responseHours,
      yearsInPractice: d.yearsInPractice,
      feeRangeCents: d.feeRangeCents && (d.feeRangeCents.min || d.feeRangeCents.max) ? d.feeRangeCents : null,
      conflicts: d.conflicts,
      routingStatus: d.routingStatus,
      bio: d.bio,
      ...(staff ? { jurisdictions: d.jurisdictions, licences: d.licences, notary: d.notary } : {}),
    };
    try {
      const out = await adapter.save(body);
      setBase(out.profile);
      setDraft(out.profile);
      setRegionsText((out.profile.regions ?? []).join(", "));
      setConflictsText((out.profile.conflicts ?? []).join("\n"));
      setSaved(true);
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorText(err, "The profile could not be saved. Check the fields marked below and try again."));
    } finally {
      setBusy(false);
    }
  }

  const setGroupSelection = (visibleIds: string[], next: string[]) => {
    const keep = draft.specialties.filter((id) => !visibleIds.includes(id));
    patch({ specialties: [...keep, ...next] });
  };

  const status: LawyerRoutingStatus = draft.routingStatus ?? "active";

  return (
    <StaggerItem className={s.page}>
      {intro}
      <header className={s.head}>
        <h2 className={s.h}>{title ?? (staff ? "Routing profile" : "Your profile")}</h2>
        <p className={s.sub}>
          ILP gives each member a lawyer automatically. Members never choose: the system matches the country, the specialty, the language and free time. Keep this page accurate so {you} only {staff ? "gets" : "get"} members {staff ? "the lawyer" : "you"} can help.
        </p>
      </header>

      <section className={s.block} aria-labelledby="p-status">
        <h3 id="p-status" className={s.sectionH}>New members</h3>
        {staff ? (
          <Select
            label="Routing"
            value={status}
            onChange={(e) => patch({ routingStatus: e.target.value as LawyerRoutingStatus })}
            options={[
              { value: "active", label: "Takes new members" },
              { value: "paused", label: "Paused: keeps current members, gets no new ones" },
              { value: "onboarding", label: "Onboarding: not routed yet" },
            ]}
            error={errors.routingStatus}
          />
        ) : (
          <Switch
            checked={status === "active"}
            onChange={(on) => patch({ routingStatus: on ? "active" : "paused" })}
            label="Take new members"
            hint="Turn this off while you are on leave or full. Members you already have keep you, and their calls stay."
            labelFirst
          />
        )}
      </section>

      <div className={s.cols}>
        <section className={s.block} aria-labelledby="p-spec">
          <h3 id="p-spec" className={s.sectionH}>Specialties</h3>
          <p className={s.note}>
            {draft.specialties.length
              ? `${draft.specialties.length} chosen. Members are matched to ${you} by these first, then by their area.`
              : "None chosen yet. Choose every kind of work you take, so members with those questions reach you."}
          </p>
          {errors.specialties && <p className={s.err} role="alert">{errors.specialties}</p>}
          <SearchInput label="Find a specialty" value={query} onValueChange={setQuery} placeholder="For example residency, condominium or wills" />
          {groups.length === 0 && <p className={s.note}>No specialty matches “{query}”. ILP staff can add one in Settings.</p>}
          <div className={s.groups}>
            {groups.map((g) => {
              const ids = g.items.map((x) => x.id);
              return (
                <ChipSelect
                  key={g.group}
                  label={g.label}
                  options={g.items.map((x) => ({ value: x.id, label: x.countries.length ? `${x.label} (${x.countries.map((c) => COUNTRIES[c].name).join(", ")})` : x.label }))}
                  value={draft.specialties.filter((id) => ids.includes(id))}
                  onChange={(next) => setGroupSelection(ids, next)}
                  id={`spec-${g.group}`}
                />
              );
            })}
          </div>
          {draft.specialties.length > 0 && (
            <details className={s.details}>
              <summary>Add a short note to a specialty (optional)</summary>
              <p className={s.note}>For example the kind of client or region you focus on. ILP staff read it when they match members by hand.</p>
              <div className={s.stack}>
                {draft.specialties.map((id) => (
                  <TextInput
                    key={id}
                    label={labelOf.get(id) ?? id}
                    optional
                    maxLength={200}
                    value={draft.specialtyNotes?.[id] ?? ""}
                    onChange={(e) => patch({ specialtyNotes: { ...(draft.specialtyNotes ?? {}), [id]: e.target.value } })}
                  />
                ))}
              </div>
            </details>
          )}
        </section>

        <div className={s.side}>
          <section className={s.block} aria-labelledby="p-lic">
            <h3 id="p-lic" className={s.sectionH}>Where {staff ? "the lawyer is" : "you are"} licensed</h3>
            {staff ? (
              <StaffLicences draft={draft} patch={patch} errors={errors} />
            ) : (
              <ul className={s.list}>
                {(draft.licences ?? []).map((l) => (
                  <li key={l.country} className={s.licence}>
                    <span>
                      {COUNTRIES[l.country].name}
                      {l.number ? `, ${COUNTRIES[l.country].lawyerBody.numberLabel.toLowerCase()} ${l.number}` : ""}
                    </span>
                    <StatusPill size="sm" tone={l.verified ? "success" : "warning"} label={l.verified ? "Verified by ILP" : "Not verified yet"} />
                  </li>
                ))}
                {draft.notary?.isNotary && <li className={s.licence}><span>Notary public{draft.notary.countries?.length ? ` in ${draft.notary.countries.map((c) => COUNTRIES[c].name).join(", ")}` : ""}</span></li>}
              </ul>
            )}
            {!staff && <p className={s.note}>ILP staff check licences with each country&apos;s register. To add a country or correct a number, write to your ILP contact.</p>}
          </section>

          <section className={s.block} aria-labelledby="p-lang">
            <h3 id="p-lang" className={s.sectionH}>Languages</h3>
            <ChipSelect
              label="Languages you can hold a call in"
              options={CALL_LANGUAGES.map((l) => ({ value: l, label: LANGUAGE_LABEL[l] ?? l }))}
              value={draft.languages}
              onChange={(languages) => patch({ languages })}
              error={errors.languages}
              id="langs"
            />
            {draft.languages.map((l) => (
              <Select
                key={l}
                label={`${LANGUAGE_LABEL[l] ?? l}: level`}
                value={draft.languageLevels?.[l] ?? ""}
                onChange={(e) => patch({ languageLevels: { ...(draft.languageLevels ?? {}), [l]: e.target.value as LanguageLevel } })}
                options={[{ value: "", label: "Choose a level" }, ...LANGUAGE_LEVELS.map((v) => ({ value: v, label: LEVEL_LABEL[v] }))]}
              />
            ))}
            <p className={s.note}>ILP emails to {staff ? "the lawyer" : "you"}, including call briefs and reminders, are in English.</p>
          </section>
        </div>
      </div>

      <div className={s.cols}>
        <section className={s.block} aria-labelledby="p-who">
          <h3 id="p-who" className={s.sectionH}>Who {staff ? "the lawyer takes" : "you take"}</h3>
          <ChipSelect
            label="Kinds of clients"
            options={LAWYER_CLIENT_TYPES.map((v) => ({ value: v, label: CLIENT_TYPE_LABEL[v] }))}
            value={draft.clientTypes ?? []}
            onChange={(next) => patch({ clientTypes: next as ProfileForm["clientTypes"] })}
            id="ctypes"
          />
          <TextInput
            label="Regions you cover"
            optional
            hint="Separate them with commas, for example Guanacaste, Puntarenas. Members with property or a home there get a small preference."
            value={regionsText}
            onChange={(e) => {
              setSaved(false);
              setRegionsText(e.target.value);
            }}
          />
          <TextArea
            label="People or companies you cannot act for or against"
            optional
            hint="One per line. ILP never assigns you a member whose matter names one of them."
            rows={3}
            value={conflictsText}
            onChange={(e) => {
              setSaved(false);
              setConflictsText(e.target.value);
            }}
          />
        </section>

        <section className={s.block} aria-labelledby="p-cap">
          <h3 id="p-cap" className={s.sectionH}>Capacity and fees</h3>
          <NumberStepper
            label="Most member calls in one week"
            id="perweek"
            value={draft.maxCallsPerWeek ?? 10}
            onChange={(v) => patch({ maxCallsPerWeek: v })}
            min={1}
            max={40}
            unit={["call", "calls"]}
            hint="When the week is full, new members go to another lawyer."
            error={errors.maxCallsPerWeek}
          />
          <Select
            label="Usual reply time to ILP"
            value={draft.responseHours ? String(draft.responseHours) : ""}
            onChange={(e) => patch({ responseHours: e.target.value ? Number(e.target.value) : undefined })}
            options={[{ value: "", label: "Choose" }, ...RESPONSE_OPTIONS]}
            error={errors.responseHours}
          />
          <NumberStepper
            label="Years in practice"
            id="years"
            value={draft.yearsInPractice ?? 0}
            onChange={(v) => patch({ yearsInPractice: v })}
            min={0}
            max={70}
            unit={["year", "years"]}
            error={errors.yearsInPractice}
          />
          <div className={s.pair}>
            <MoneyInput
              label="Usual quoted work from"
              optional
              valueCents={draft.feeRangeCents?.min ?? null}
              onChangeCents={(c) => patch({ feeRangeCents: { min: c ?? 0, max: draft.feeRangeCents?.max ?? 0 } })}
            />
            <MoneyInput
              label="Up to"
              optional
              valueCents={draft.feeRangeCents?.max ?? null}
              onChangeCents={(c) => patch({ feeRangeCents: { min: draft.feeRangeCents?.min ?? 0, max: c ?? 0 } })}
              error={errors.feeRangeCents}
            />
          </div>
        </section>
      </div>

      <section className={s.block} aria-labelledby="p-bio">
        <h3 id="p-bio" className={s.sectionH}>About {staff ? "the lawyer" : "you"}</h3>
        <TextArea
          label="Short bio"
          hint="Members see this before the first call. Up to 800 characters."
          rows={5}
          maxLength={800}
          value={draft.bio ?? ""}
          onChange={(e) => patch({ bio: e.target.value })}
          error={errors.bio}
        />
      </section>

      <div className={s.saveBar}>
        <div className={s.saveMsg}>
          {error ? (
            <ErrorNotice audience={staff ? "staff" : "lawyer"}>{error}</ErrorNotice>
          ) : saved && !dirty ? (
            <p className={s.saved} role="status">
              <IconCheck /> Saved. New members are matched with this profile from now on.
            </p>
          ) : (
            <p className={s.pending}>{dirty ? "Unsaved changes" : "No changes yet."}</p>
          )}
        </div>
        <Button onClick={save} busy={busy} disabled={busy || !dirty}>
          Save profile
        </Button>
      </div>
    </StaggerItem>
  );
}

/** Staff only: licensed countries, licence numbers and their verification, notary status. */
function StaffLicences({ draft, patch, errors }: { draft: ProfileForm; patch: (p: Partial<ProfileForm>) => void; errors: Record<string, string> }) {
  const licences = draft.licences ?? [];
  const setCountries = (next: string[]) => {
    const cs = next as CountryCode[];
    patch({
      jurisdictions: cs,
      licences: cs.map((c) => licences.find((l) => l.country === c) ?? { country: c, body: COUNTRIES[c].lawyerBody.name, number: "", verified: false }),
    });
  };
  const edit = (c: CountryCode, p: Partial<(typeof licences)[number]>) =>
    patch({ licences: licences.map((l) => (l.country === c ? { ...l, ...p } : l)) });
  const notary = draft.notary ?? { isNotary: false, countries: [] };
  return (
    <div className={s.stack}>
      <ChipSelect
        label="Countries"
        options={COUNTRY_CODES.map((c) => ({ value: c, label: COUNTRIES[c].name }))}
        value={draft.jurisdictions}
        onChange={setCountries}
        error={errors.jurisdictions}
        id="juris"
      />
      {licences.map((l) => (
        <div key={l.country} className={s.licenceEdit}>
          <TextInput
            label={`${COUNTRIES[l.country].name}: ${COUNTRIES[l.country].lawyerBody.numberLabel.toLowerCase()}`}
            value={l.number}
            onChange={(e) => edit(l.country, { number: e.target.value })}
            error={errors[`licence_${l.country}`]}
            hint={COUNTRIES[l.country].lawyerBody.name}
          />
          <Checkbox
            label="Checked in the register: verified"
            checked={l.verified}
            onChange={(e) => edit(l.country, { verified: e.target.checked })}
            hint={l.verified && l.verifiedBy ? `Verified by ${l.verifiedBy}${l.verifiedAt ? ` on ${l.verifiedAt.slice(0, 10)}` : ""}` : "Unverified licences are never routed members in that country."}
          />
        </div>
      ))}
      <Switch checked={notary.isNotary} onChange={(on) => patch({ notary: { ...notary, isNotary: on, countries: on ? (notary.countries.length ? notary.countries : draft.jurisdictions.slice(0, 1)) : [] } })} label="Also a notary public" labelFirst />
      {notary.isNotary && (
        <>
          <ChipSelect
            label="Notary in"
            options={draft.jurisdictions.map((c) => ({ value: c, label: COUNTRIES[c].name }))}
            value={notary.countries}
            onChange={(next) => patch({ notary: { ...notary, countries: next as CountryCode[] } })}
            id="notary-c"
          />
          <TextInput label="Notary number" optional value={notary.number ?? ""} onChange={(e) => patch({ notary: { ...notary, number: e.target.value } })} />
          <Checkbox label="Notary appointment verified" checked={!!notary.verified} onChange={(e) => patch({ notary: { ...notary, verified: e.target.checked } })} />
        </>
      )}
      <Notice tone="info" title="Only staff can change this part">
        Lawyers see their countries and whether each licence is verified, but cannot edit them.
      </Notice>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className={s.page} aria-hidden="true">
      <Skeleton shape="line" size="lg" width="40" />
      <Skeleton shape="line" size="sm" width="90" />
      <div className={s.cols}>
        <div className={s.block}>
          <Skeleton shape="block" size="md" />
          <Skeleton shape="block" size="lg" />
        </div>
        <div className={s.block}>
          <Skeleton shape="block" size="md" />
          <Skeleton shape="block" size="md" />
        </div>
      </div>
    </div>
  );
}
