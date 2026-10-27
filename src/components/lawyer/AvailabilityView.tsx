"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  ChipSelect,
  DateListInput,
  EmptyState,
  IconCheck,
  NumberStepper,
  SkeletonRegion,
  StaggerItem,
  TextInput,
  WeeklyHoursEditor,
  useUnsavedChanges,
  timeToMinutes,
  useSkeleton,
  validateWindows,
} from "@/components/ui";
import { AREA_LABEL, errorText } from "./lawyerApi";
import { callsApi, type AvailabilitySettings, type WeeklyWindow } from "./callsApi";
import { LawyerAvailabilitySkeleton } from "./LawyerSkeletons";
import s from "./AvailabilityView.module.scss";

const SPECIALTIES = ["real_estate", "corporate", "immigration", "tax", "vehicle", "notary"];
const SPECIALTY_OPTIONS = SPECIALTIES.map((k) => ({ value: k, label: AREA_LABEL[k] ?? k }));
const LEAD_PRESETS = [0, 2, 4, 12, 18, 24, 48, 72, 168] as const;
const todayCr = () => new Date(Date.now() - 6 * 3_600_000).toISOString().slice(0, 10);

/** Where the settings come from: the lawyer's own routes, or staff editing any lawyer. */
export interface AvailabilityAdapter {
  load(): Promise<AvailabilitySettings>;
  save(input: Parameters<typeof callsApi.saveAvailability>[0]): Promise<AvailabilitySettings>;
}

const ownAdapter: AvailabilityAdapter = {
  load: () => callsApi.availability(),
  save: (input) => callsApi.saveAvailability(input),
};

interface Draft {
  weekly: WeeklyWindow[];
  blackout: string[];
  lead: number;
  maxPerDay: number;
  specialties: string[];
  calendarId: string;
}

const draftFrom = (a: AvailabilitySettings): Draft => ({
  weekly: a.weekly,
  blackout: a.blackoutDates,
  lead: a.minLeadHours,
  maxPerDay: a.maxCallsPerDay,
  specialties: a.specialties,
  calendarId: a.calendarId ?? "",
});

/** Order-independent fingerprint, so reordering or re-adding the same hours is not a change. */
const fingerprint = (d: Draft) =>
  JSON.stringify({
    weekly: [...d.weekly]
      .map((w) => `${w.day}|${w.start}|${w.end}`)
      .sort(),
    blackout: d.blackout.filter((x) => x >= todayCr()).sort(),
    lead: d.lead,
    maxPerDay: d.maxPerDay,
    specialties: [...d.specialties].sort(),
    calendarId: d.calendarId.trim().toLowerCase(),
  });

/**
 * Lawyer availability: weekly hours in Costa Rica time, days off, notice,
 * calls per day, specialties and an optional Google Calendar for busy times.
 * Booking slots for members are built from exactly these settings.
 *
 * Staff reuse it on /dashboard/lawyers with an adapter over
 * GET|PUT /api/dashboard/availability/:providerId (remount with `key` per
 * lawyer). Unsaved edits register with useUnsavedChanges, so the staff page
 * asks through confirmLeave before switching lawyer.
 */
export default function AvailabilityView({
  adapter = ownAdapter,
  title = "Your hours",
  showBack = true,
  onDirtyChange,
  unsavedMessage = "Your hours have changes that are not saved yet. If you leave now, they will be lost.",
}: {
  adapter?: AvailabilityAdapter;
  title?: string;
  showBack?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  /** Text of the leave-without-saving dialog. */
  unsavedMessage?: string;
} = {}) {
  const [data, setData] = useState<AvailabilitySettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function apply(a: AvailabilitySettings) {
    setData(a);
    setDraft(draftFrom(a));
  }

  async function load() {
    setLoadError(null);
    try {
      apply(await adapter.load());
    } catch (err) {
      setLoadError(errorText(err, "Could not load your hours."));
    }
  }

  useEffect(() => {
    load();
    // Load once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty = useMemo(() => !!data && !!draft && fingerprint(draft) !== fingerprint(draftFrom(data)), [data, draft]);
  const windowErrors = useMemo(() => validateWindows(draft?.weekly ?? []), [draft?.weekly]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  // Ask before a reload, tab close, link, Back or logout loses edits.
  useUnsavedChanges(dirty, unsavedMessage);

  const { showSkeleton, skeletonVisible } = useSkeleton(!data && !loadError);
  if (loadError) {
    return (
      <StaggerItem>
        <EmptyState title="The hours did not load" body={loadError} action={<Button onClick={load}>Try again</Button>} />
      </StaggerItem>
    );
  }
  if (showSkeleton || !data || !draft) {
    return (
      <SkeletonRegion label="Loading your hours" visible={skeletonVisible}>
        <LawyerAvailabilitySkeleton />
      </SkeletonRegion>
    );
  }

  const patch = (p: Partial<Draft>) => {
    setSaved(false);
    setError(null);
    setDraft((d) => (d ? { ...d, ...p } : d));
  };

  async function save() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const out = await adapter.save({
        weekly: [...draft.weekly].sort((a, b) => a.day - b.day || timeToMinutes(a.start) - timeToMinutes(b.start)),
        blackoutDates: draft.blackout.filter((d) => d >= todayCr()),
        minLeadHours: draft.lead,
        maxCallsPerDay: draft.maxPerDay,
        specialties: draft.specialties,
        calendarId: draft.calendarId.trim() || null,
      });
      apply(out);
      setSaved(true);
    } catch (err) {
      setError(errorText(err, "Could not save. Check the times and try again."));
    } finally {
      setBusy(false);
    }
  }

  const today = todayCr();
  const hasErrors = windowErrors.size > 0;

  return (
    <StaggerItem className={s.page}>
      {showBack && (
        <nav aria-label="Breadcrumb">
          <Link href="/lawyer" className={s.back}>← Today</Link>
        </nav>
      )}
      <header className={s.head}>
        <h2 className={s.h}>{title}</h2>
        <p className={s.sub}>
          Members book 20-minute calls inside these hours, in Costa Rica time.
          {data.isDefault ? " Standard hours apply until hours are saved here." : ""}
        </p>
      </header>

      <div className={s.cols}>
        <section className={s.week} aria-labelledby="week-h" data-tour="lawyer-availability-weekly">
          <h3 id="week-h" className={s.sectionH}>Weekly hours</h3>
          <WeeklyHoursEditor
            value={draft.weekly}
            onChange={(weekly) => patch({ weekly })}
            maxPerDay={draft.maxPerDay}
            idPrefix="avail"
          />
        </section>

        <div className={s.side}>
          <section aria-labelledby="off-h" className={s.block}>
            <h3 id="off-h" className={s.sectionH}>Days off</h3>
            <DateListInput
              label="Add a day off"
              hint="No calls are offered on these dates."
              value={draft.blackout.filter((d) => d >= today)}
              onChange={(blackout) => patch({ blackout })}
              min={today}
              addLabel="Add day off"
              listLabel="Planned days off"
              emptyText="No days off planned."
              id="blackout"
            />
          </section>

          <section aria-labelledby="limits-h" className={s.block}>
            <h3 id="limits-h" className={s.sectionH}>Limits</h3>
            <div className={s.limits}>
              <NumberStepper
                label="Minimum notice before a call"
                hint="Members cannot book a call sooner than this."
                id="lead"
                value={draft.lead}
                onChange={(lead) => patch({ lead })}
                min={0}
                max={168}
                presets={LEAD_PRESETS}
                unit={["hour", "hours"]}
              />
              <NumberStepper
                label="Most calls in one day"
                id="max"
                value={draft.maxPerDay}
                onChange={(maxPerDay) => patch({ maxPerDay })}
                min={1}
                max={20}
                unit={["call", "calls"]}
              />
            </div>
          </section>

          <section aria-labelledby="spec-h" className={s.block}>
            <h3 id="spec-h" className={s.sectionH}>Specialties</h3>
            <ChipSelect
              label="Legal areas you take"
              hint="Members without an assigned lawyer are routed by these."
              options={SPECIALTY_OPTIONS}
              value={draft.specialties}
              onChange={(specialties) => patch({ specialties })}
              id="spec"
            />
          </section>

          <section aria-labelledby="cal-h" className={s.block}>
            <h3 id="cal-h" className={s.sectionH}>Google Calendar</h3>
            <TextInput
              label="Block times that are busy in this calendar"
              optional
              id="cal"
              type="email"
              placeholder="you@yourfirm.cr"
              value={draft.calendarId}
              onChange={(e) => patch({ calendarId: e.target.value })}
              hint="Share your free/busy with ILP in Google Calendar so we can read it. Event details stay private."
            />
          </section>
        </div>
      </div>

      <div className={s.saveBar}>
        <div className={s.saveMsg}>
          {error ? (
            <p className={s.error} role="alert">{error}</p>
          ) : saved && !dirty ? (
            <p className={s.saved} role="status">
              <IconCheck /> Saved. Members now see times from these hours.
            </p>
          ) : (
            <p id="save-why" className={s.pending}>{hasErrors ? "Fix the highlighted hours to save." : dirty ? "Unsaved changes" : "No changes yet."}</p>
          )}
        </div>
        <Button onClick={save} busy={busy} disabled={busy || !dirty || hasErrors} aria-describedby={!error && !(saved && !dirty) ? "save-why" : undefined}>
          Save hours
        </Button>
      </div>
    </StaggerItem>
  );
}
