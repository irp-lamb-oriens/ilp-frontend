"use client";

import type { Consultation, Handoff, Obligation, Opportunity } from "@/lib/contracts";
import { Button, DateInput, MoneyInput, Select, TextInput, isoFromDateInput, useForm, validators } from "@/components/ui";
import { ErrorText } from "../staff/PageHeader";
import { shortDate } from "../staff/format";
import { AREAS, areaOptions, oppApi, type OpportunityRow } from "./oppApi";
import s from "./opportunities.module.scss";

interface Props {
  clientId: string;
  handoffs?: Handoff[];
  consultations?: Consultation[];
  obligations?: Obligation[];
  matters?: Array<{ id: string; title: string; area?: string }>;
  onCreated: (row: OpportunityRow) => void;
  onCancel?: () => void;
}

/**
 * New opportunity for one member. The source is required (no orphan
 * opportunities): a handoff, a call or an obligation on this member, or
 * "added by staff".
 */
export function NewOpportunity({ clientId, handoffs = [], consultations = [], obligations = [], matters = [], onCreated, onCancel }: Props) {
  const sources = [
    ...handoffs.map((h) => ({ value: `handoff:${h.id}`, label: `Handoff ${shortDate(h.approvedAt)}${h.commercialNotes ? `: ${h.commercialNotes.slice(0, 50)}` : ""}` })),
    ...consultations
      .filter((c) => c.status === "completed")
      .map((c) => ({ value: `consultation:${c.id}`, label: `Call ${shortDate(c.scheduledAt)}` })),
    ...obligations.map((o) => ({ value: `obligation:${o.id}`, label: `Obligation: ${o.title.slice(0, 60)}` })),
    { value: "manual:", label: "Added by staff (no linked record)" },
  ];
  const f = useForm({
    initial: {
      title: "",
      source: sources.length > 1 ? sources[0].value : "manual:",
      area: areaOptions(matters[0]?.area).some((a) => a.value === matters[0]?.area) ? (matters[0]?.area ?? "") : "",
      matterId: "",
      valueCents: null as number | null | undefined,
      nextWhat: "Prepare proposal",
      nextDue: "",
    },
    rules: {
      title: [validators.required("Give the opportunity a short title, e.g. “S.A. clean-up”."), validators.maxLength(160)],
      source: [validators.required("Choose where this opportunity came from.")],
      area: [validators.required("Choose a legal area.")],
      valueCents: [validators.money()],
    },
    onSubmit: async (v) => {
      const [kind, id] = v.source.split(":") as [Opportunity["source"]["kind"], string];
      const row = await oppApi.create({
        clientId,
        source: id ? { kind, id } : { kind },
        title: v.title.trim(),
        area: v.area,
        matterId: v.matterId || undefined,
        valueCents: v.valueCents ?? undefined,
        nextAction: v.nextWhat.trim() ? { what: v.nextWhat.trim(), dueAt: isoFromDateInput(v.nextDue) } : undefined,
      });
      onCreated(row);
    },
  });

  return (
    <form className={s.form} onSubmit={f.handleSubmit} noValidate>
      <TextInput label="Title" required placeholder="S.A. clean-up" {...f.text("title")} />
      <Select label="Source" required options={sources} hint="Every opportunity links back to where it came from." {...f.text("source")} />
      <div className={s.pair}>
        <Select label="Legal area" required placeholder="Choose an area" options={AREAS} {...f.text("area")} />
        <MoneyInput label="Estimated legal fees" optional {...f.money("valueCents")} />
      </div>
      {matters.length > 0 && (
        <Select label="Matter" optional placeholder="No matter" options={matters.map((m) => ({ value: m.id, label: m.title }))} {...f.text("matterId")} />
      )}
      <div className={s.pair}>
        <TextInput label="Next action" optional {...f.text("nextWhat")} />
        <DateInput label="Due" optional {...f.text("nextDue")} />
      </div>
      {f.submitError && <ErrorText>{f.submitError}</ErrorText>}
      <div className={s.actionsRow}>
        <Button type="submit" busy={f.submitting}>
          Create opportunity
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
