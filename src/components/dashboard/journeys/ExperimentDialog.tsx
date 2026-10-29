"use client";

import { useEffect, useState } from "react";
import { type Experiment, type ExperimentInput, FUNNEL_STEPS, type FunnelStepId, LAWYER_STEPS } from "@/lib/contracts";
import { Button, ChipSelect, Dialog, Notice, RadioGroup, Select, TextArea, TextInput } from "@/components/ui";
import { saveExperiment } from "./journeysApi";
import { SURFACES, slugify, validateExperiment } from "./model";
import s from "./journeys.module.scss";

const STEP_OPTIONS = [...FUNNEL_STEPS, ...LAWYER_STEPS].map((x) => ({ value: x.id, label: x.label }));

const blank = (): ExperimentInput => ({
  key: "",
  name: "",
  hypothesis: "",
  surface: "home.hero",
  variants: [
    { key: "A", name: "Current version", weight: 50 },
    { key: "B", name: "", weight: 50 },
  ],
  primaryStep: "check_start",
  guardrailSteps: ["activation_paid"],
  audience: "all",
});

/**
 * Create or edit an experiment (admins). Versions and their shares can only
 * change while the test is a draft or paused; the server refuses changes to
 * a running test.
 */
export default function ExperimentDialog({ open, experiment, onClose, onSaved }: { open: boolean; experiment?: Experiment | null; onClose: () => void; onSaved: (e: Experiment) => void }) {
  const [d, setD] = useState<ExperimentInput>(blank);
  const [keyTouched, setKeyTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const locked = experiment?.status === "running" || experiment?.status === "ended";

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFailed(null);
    setKeyTouched(!!experiment);
    setD(
      experiment
        ? { key: experiment.key, name: experiment.name, hypothesis: experiment.hypothesis, surface: experiment.surface, variants: experiment.variants.map((v) => ({ ...v })), primaryStep: experiment.primaryStep, guardrailSteps: experiment.guardrailSteps ?? [], audience: experiment.audience }
        : blank(),
    );
  }, [open, experiment]);

  const set = <K extends keyof ExperimentInput>(k: K, v: ExperimentInput[K]) => setD((p) => ({ ...p, [k]: v }));
  const setVariant = (i: number, patch: Partial<ExperimentInput["variants"][number]>) => setD((p) => ({ ...p, variants: p.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)) }));
  const even = () => setD((p) => {
    const n = p.variants.length;
    const base = Math.floor(1000 / n) / 10;
    return { ...p, variants: p.variants.map((v, i) => ({ ...v, weight: i === 0 ? Math.round((100 - base * (n - 1)) * 10) / 10 : base })) };
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateExperiment(d);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setFailed(null);
    try {
      onSaved(await saveExperiment(d, experiment?.id));
    } catch (err) {
      setFailed(err instanceof Error ? err.message : "The test was not saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={experiment ? `Edit ${experiment.name}` : "New experiment"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="experiment-form" busy={busy}>
            {experiment ? "Save changes" : "Save as draft"}
          </Button>
        </>
      }
    >
      <form id="experiment-form" className={s.formGrid} onSubmit={submit} noValidate>
        <TextInput
          label="Name"
          value={d.name}
          onChange={(e) => {
            set("name", e.target.value);
            if (!keyTouched) set("key", slugify(e.target.value));
          }}
          error={errors.name}
          required
        />
        <TextInput label="Key used in the code" value={d.key} onChange={(e) => { setKeyTouched(true); set("key", e.target.value.toLowerCase()); }} error={errors.key} hint="A developer uses this key to show the versions. It cannot change once the test has run." disabled={!!experiment && experiment.status !== "draft"} required />
        <TextArea label="Hypothesis" value={d.hypothesis} onChange={(e) => set("hypothesis", e.target.value)} error={errors.hypothesis} hint="What you change, what you expect to happen and why. For example: a headline that names legal dates will get more people to start the free check." required />
        <Select label="Where it runs" value={d.surface} onChange={(e) => set("surface", e.target.value)} options={[...SURFACES.map((x) => ({ value: x.value, label: x.label })), ...(SURFACES.some((x) => x.value === d.surface) ? [] : [{ value: d.surface, label: d.surface }])]} error={errors.surface} required />
        <fieldset className={s.formGrid} disabled={locked}>
          <legend className={s.panelHead}>Versions</legend>
          <p className={s.panelSub}>
            The first version is the control: what visitors see today. Shares are the percentage of visitors who get each version.
            {locked ? " Versions cannot change while the test runs." : ""}
          </p>
          {d.variants.map((v, i) => (
            <div key={i} className={s.variantRow}>
              <TextInput label={i === 0 ? "Key (control)" : "Key"} value={v.key} onChange={(e) => setVariant(i, { key: e.target.value })} error={errors[`variants.${i}.key`]} />
              <TextInput label="Name" value={v.name} onChange={(e) => setVariant(i, { name: e.target.value })} error={errors[`variants.${i}.name`]} />
              <TextInput label="Share %" type="number" inputMode="decimal" value={String(v.weight)} onChange={(e) => setVariant(i, { weight: Number(e.target.value) })} error={errors[`variants.${i}.weight`]} />
              {i >= 2 ? (
                <Button variant="ghost" size="sm" onClick={() => setD((p) => ({ ...p, variants: p.variants.filter((_, j) => j !== i) }))}>
                  Remove
                </Button>
              ) : (
                <span />
              )}
            </div>
          ))}
          {errors.variants && <p className={s.formError}>{errors.variants}</p>}
          {errors.weights && <p className={s.formError}>{errors.weights}</p>}
          <div className={s.actions}>
            {d.variants.length < 4 && (
              <Button variant="secondary" size="sm" onClick={() => setD((p) => ({ ...p, variants: [...p.variants, { key: String.fromCharCode(65 + p.variants.length), name: "", weight: 0 }] }))}>
                Add a version
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={even}>
              Split evenly
            </Button>
          </div>
        </fieldset>
        <Select label="Success step" value={d.primaryStep} onChange={(e) => set("primaryStep", e.target.value as FunnelStepId)} options={STEP_OPTIONS} error={errors.primaryStep} hint="The step that counts as a conversion. Pick the first step the change can affect." required />
        <ChipSelect
          label="Guardrail steps"
          hint="Steps that must not get worse, such as paying. They are shown next to the result."
          options={STEP_OPTIONS.filter((o) => o.value !== d.primaryStep)}
          value={d.guardrailSteps ?? []}
          onChange={(v) => set("guardrailSteps", v as FunnelStepId[])}
          max={3}
          error={errors.guardrailSteps}
        />
        <RadioGroup
          label="Who sees the test"
          name="audience"
          value={d.audience}
          onChange={(v) => set("audience", v as ExperimentInput["audience"])}
          inline
          options={[
            { value: "all", label: "Everyone" },
            { value: "inbound", label: "Inbound only" },
            { value: "outbound", label: "Outbound only" },
          ]}
        />
        {failed && (
          <Notice tone="danger" variant="inline" title="The test was not saved" fix={{ steps: ["Check the fields marked in red.", "Press Save again.", "If it keeps failing, copy the message below and send it to an ILP admin."] }}>
            {failed}
          </Notice>
        )}
      </form>
    </Dialog>
  );
}
