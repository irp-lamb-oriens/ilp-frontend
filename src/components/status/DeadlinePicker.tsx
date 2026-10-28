"use client";

import { useEffect, useState } from "react";
import { Button, Drawer, EmptyState, ErrorNotice, Select, SkeletonList } from "@/components/ui";
import { DeadlineCards } from "@/components/deadlines/DeadlineCards";
import { ApiError } from "@/lib/api";
import { COUNTRIES, COUNTRY_CODES, type CountryCode, isCountryCode } from "@/lib/contracts";
import type { DeadlineCardItem } from "@/lib/deadlines";
import { deadlinesApi, type PickerPayload } from "./deadlinesApi";
import s from "./DeadlinesView.module.scss";

/**
 * DEADLINES: "Add more deadlines". The same cards as the free check, listing
 * the rules of the person's country (or another one they choose) that are not
 * on their list yet. Saving adds them with source "picker".
 */
export default function DeadlinePicker({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (n: number) => void }) {
  // The country the person picked; null = their own (the server answers with it).
  const [asked, setAsked] = useState<CountryCode | null>(null);
  const [data, setData] = useState<PickerPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!open) return;
    let live = true;
    setData(null);
    setError(null);
    deadlinesApi
      .available(asked ?? undefined)
      .then((d) => {
        if (!live) return;
        setData(d);
        // Rules that match the person's answers start included.
        setSelected(new Set(d.items.filter((i) => i.matches).map((i) => i.ruleId)));
      })
      .catch((err) => live && setError(err instanceof ApiError ? err.message : "The list did not load."));
    return () => {
      live = false;
    };
  }, [open, asked, attempt]);

  const items: DeadlineCardItem[] = (data?.items ?? []).map((i) => ({ ...i, id: i.ruleId }));
  const n = items.filter((i) => selected.has(i.id)).length;
  const country = asked ?? data?.country ?? null;
  const name = country ? COUNTRIES[country].name : "your country";

  async function save() {
    if (!data || !n) return;
    setBusy(true);
    setError(null);
    try {
      const r = await deadlinesApi.add({ country: data.country, ruleIds: items.filter((i) => selected.has(i.id)).map((i) => i.id) });
      onAdded(r.created + r.restored);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Your deadlines were not added. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="lg"
      title="Add more deadlines"
      subtitle={`Legal dates and duties in ${name} that are not on your list yet. Each one may require review.`}
      confirmClose={false}
      footer={
        <div className={s.pickerFooter}>
          <span className={s.pickerCount} aria-live="polite">
            {n} selected
          </span>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} busy={busy} disabled={!n}>
            {n === 1 ? "Add 1 deadline" : `Add ${n} deadlines`}
          </Button>
        </div>
      }
    >
      <div className={s.picker}>
        <Select
          label="Country"
          value={country ?? ""}
          onChange={(e) => isCountryCode(e.target.value) && setAsked(e.target.value)}
          hint={data && data.country !== data.homeCountry ? "Dates for another country are general: your answers are for your own country." : undefined}
          options={COUNTRY_CODES.map((c) => ({ value: c, label: COUNTRIES[c].name }))}
        />
        {error ? (
          <ErrorNotice audience="member" onRetry={() => setAttempt((a) => a + 1)}>
            {error}
          </ErrorNotice>
        ) : !data ? (
          <SkeletonList rows={3} />
        ) : items.length === 0 ? (
          <EmptyState compact title={`Every item for ${name} is on your list`} body="Choose another country above, or close this panel." />
        ) : (
          <DeadlineCards
            items={items}
            selected={selected}
            onChange={setSelected}
            headingLevel={3}
            bar="none"
            noun={["deadline", "deadlines"]}
            intro="Items marked Matches your answers start included. Include any other item that applies to you."
          />
        )}
      </div>
    </Drawer>
  );
}
