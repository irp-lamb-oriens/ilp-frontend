"use client";

import { useState } from "react";
import {
  Button,
  Checkbox,
  DateInput,
  MoneyInput,
  RadioGroup,
  SearchInput,
  Select,
  TextArea,
  TextInput,
  formatCentsPlain,
  useForm,
  validators,
} from "@/components/ui";
import s from "./FormsGallery.module.scss";

const AREAS = [
  { value: "corporate", label: "Corporate" },
  { value: "property", label: "Property" },
  { value: "immigration", label: "Immigration" },
  { value: "vehicle", label: "Vehicle" },
];

/** Form-field primitives in every state: default, filled, error, disabled, plus a live validated form. */
export default function FormsGallery() {
  const [query, setQuery] = useState("Alvarez");
  const [cents, setCents] = useState<number | null | undefined>(185000);
  const [who, setWho] = useState("client");
  const [saved, setSaved] = useState<string | null>(null);

  const form = useForm({
    initial: { title: "", area: "", valueCents: null as number | null | undefined, dueOn: "", notes: "", consent: false },
    rules: {
      title: [validators.required("Give the opportunity a short title.")],
      area: [validators.required("Choose a legal area.")],
      valueCents: [validators.money(), validators.minCents(1, "Enter an estimated fee above zero.")],
      consent: [(v) => (v ? null : "Confirm the member asked for a quote.")],
    },
    onSubmit: async (v) => {
      await new Promise((r) => window.setTimeout(r, 600));
      setSaved(`Saved "${v.title}" (${v.valueCents != null ? `US$${formatCentsPlain(v.valueCents)}` : "no value"}).`);
    },
  });

  return (
    <div className={s.wrap}>
      <p className={s.note}>
        Tab into any field to see the focus ring. Labels always render (hideLabel keeps them for screen readers);
        hints and errors are linked with <code>aria-describedby</code>, errors set <code>aria-invalid</code>, and
        &ldquo;Required&rdquo; is written out, never a bare asterisk.
      </p>

      <div className={s.grid}>
        <div className={s.col}>
          <h3 className={s.h3}>TextInput</h3>
          <TextInput label="Full name" placeholder="María Fernanda Solano" />
          <TextInput label="Email" type="email" required defaultValue="m.solano@correo.cr" hint="We send sign-in codes here." />
          <TextInput label="Cédula number" required defaultValue="1-123" error="A Costa Rican cédula has 9 digits, like 1-1234-0567." />
          <TextInput label="Member ID" disabled defaultValue="cli_8f2a41" />
        </div>

        <div className={s.col}>
          <h3 className={s.h3}>Select and DateInput</h3>
          <Select label="Legal area" placeholder="Choose an area" options={AREAS} defaultValue="" required />
          <Select label="Legal area" options={AREAS} defaultValue="property" error="Property matters need a lawyer with a notary licence." />
          <DateInput label="Due by" defaultValue="2026-11-14" hint="Costa Rica time." />
          <DateInput label="Renewal date" disabled defaultValue="2027-01-31" />
        </div>

        <div className={s.col}>
          <h3 className={s.h3}>MoneyInput and SearchInput</h3>
          <MoneyInput
            label="Estimated legal fee"
            hint={`Stored as integer cents: ${cents === undefined ? "invalid" : cents === null ? "empty" : cents}`}
            valueCents={cents}
            onChangeCents={setCents}
          />
          <MoneyInput label="Activation fee" valueCents={10000} onChangeCents={() => undefined} disabled />
          <SearchInput label="Search members" value={query} onValueChange={setQuery} placeholder="Name or email" />
          <SearchInput label="Search opportunities" hideLabel value="" onValueChange={() => undefined} placeholder="Search opportunities" />
        </div>

        <div className={s.col}>
          <h3 className={s.h3}>TextArea, Checkbox and RadioGroup</h3>
          <TextArea label="Next action" autoGrow defaultValue={"Send the S.A. clean-up quote.\nThe type grows with the text."} hint="autoGrow: no inner scroll bar." />
          <TextArea label="Outcome" required error="Say why the opportunity was lost." rows={2} />
          <Checkbox label="Recording consent given" hint="Asked at the start of the call." defaultChecked />
          <Checkbox label="Member accepted the terms" required error="The member must accept the terms first." />
          <Checkbox label="Archived" disabled />
          <RadioGroup label="Who acts next" name="who" value={who} onChange={setWho} inline options={[
            { value: "client", label: "Member" },
            { value: "lawyer", label: "Lawyer" },
            { value: "ilp", label: "ILP" },
          ]} />
          <RadioGroup label="Close as" name="close" value={null} onChange={() => undefined} required error="Choose won or lost." options={[
            { value: "won", label: "Won", hint: "The member accepted the quote." },
            { value: "lost", label: "Lost", hint: "The member declined or went quiet." },
          ]} />
        </div>
      </div>

      <h3 className={s.h3}>useForm: validate on blur and submit</h3>
      <form className={s.form} onSubmit={form.handleSubmit} noValidate>
        <TextInput label="Title" required {...form.text("title")} placeholder="S.A. clean-up" />
        <Select label="Legal area" required placeholder="Choose an area" options={AREAS} {...form.text("area")} />
        <MoneyInput label="Estimated legal fee" optional {...form.money("valueCents")} />
        <DateInput label="Next action due" optional {...form.text("dueOn")} />
        <TextArea label="Notes" optional autoGrow rows={2} {...form.text("notes")} />
        <Checkbox label="The member asked for a quote" required {...form.checkbox("consent")} />
        <div className={s.actions}>
          <Button type="submit" busy={form.submitting}>
            Save opportunity
          </Button>
          <Button variant="ghost" onClick={() => { form.reset(); setSaved(null); }}>
            Reset
          </Button>
        </div>
        {saved && <p className={s.saved} role="status">{saved}</p>}
      </form>
    </div>
  );
}
