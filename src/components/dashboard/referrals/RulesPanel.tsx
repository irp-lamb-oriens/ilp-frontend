"use client";

import { useCallback, useEffect, useState } from "react";
import { BRAND_LABEL, BRANDS, type Brand, type CommissionRule, money, refStaff, ruleSummary, type RulePreset } from "@/lib/referral";
import { Button, DataTable, Dialog, MoneyInput, Select, StatusPill, TextInput, Toast } from "@/components/ui";
import { errorText } from "./ReferralsView";
import s from "./referrals.module.scss";

type Form = {
  name: string;
  brand: Brand;
  base: CommissionRule["base"];
  mode: "amount" | "percent";
  amountCents: number | null | undefined;
  percent: string;
  include: CommissionRule["include"];
  durationMonths: string;
  holdDays: string;
};

const fromPreset = (p: RulePreset): Form => ({
  name: p.name,
  brand: p.brand,
  base: p.base,
  mode: p.amountCents !== undefined ? "amount" : "percent",
  amountCents: p.amountCents ?? null,
  percent: p.percent !== undefined ? String(p.percent) : "",
  include: p.include,
  durationMonths: p.durationMonths ? String(p.durationMonths) : "",
  holdDays: String(p.holdDays),
});

/** The agreements partners are paid by. A partner points at one rule per brand. Rules are never edited, only retired, so past commissions keep their meaning. */
export default function RulesPanel({ isAdmin }: { isAdmin: boolean }) {
  const [rules, setRules] = useState<CommissionRule[] | null>(null);
  const [presets, setPresets] = useState<RulePreset[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await refStaff.rules();
      setRules(r.rules);
      setPresets(r.presets);
    } catch (e) {
      setError(errorText(e));
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!form) return;
    setBusy(true);
    setError(null);
    try {
      await refStaff.createRule({
        name: form.name,
        brand: form.brand,
        base: form.base,
        include: form.include,
        holdDays: Number(form.holdDays || 0),
        ...(form.mode === "amount" ? { amountCents: form.amountCents ?? undefined } : { percent: Number(form.percent) }),
        ...(form.durationMonths ? { durationMonths: Number(form.durationMonths) } : {}),
      });
      setToast("Rule created. Pick it on a partner to use it.");
      setForm(null);
      load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={s.stack}>
      {error && <p className={s.error} role="alert">{error}</p>}
      {isAdmin && (
        <div className={s.row}>
          {presets.map((p) => (
            <Button key={p.key} variant="secondary" size="sm" onClick={() => setForm(fromPreset(p))}>{p.name}</Button>
          ))}
          <Button size="sm" onClick={() => setForm({ name: "", brand: "ilp", base: "payment", mode: "percent", amountCents: null, percent: "50", include: "all", durationMonths: "", holdDays: "30" })}>Blank rule</Button>
        </div>
      )}
      <DataTable<CommissionRule>
        caption="Commission rules"
        rows={rules ?? []}
        rowKey={(r) => r.id}
        loading={!rules && !error}
        empty={<p className={s.muted}>No rules yet. {isAdmin ? "Start from one of the buttons above." : "An admin adds them."}</p>}
        columns={[
          { key: "name", header: "Rule", width: "wide", render: (r) => <span><strong>{r.name}</strong><br /><span className={s.muted}>{ruleSummary(r)}</span></span> },
          { key: "brand", header: "Brand", render: (r) => BRAND_LABEL[r.brand] },
          { key: "state", header: "State", render: (r) => <StatusPill size="sm" label={r.archived ? "Retired" : "In use"} tone={r.archived ? "neutral" : "success"} /> },
          {
            key: "act",
            header: "",
            align: "end",
            render: (r) =>
              isAdmin ? (
                <Button size="sm" variant="ghost" onClick={async () => {
                  try {
                    await refStaff.archiveRule(r.id, !r.archived);
                    load();
                  } catch (e) {
                    setError(errorText(e));
                  }
                }}>{r.archived ? "Use again" : "Retire"}</Button>
              ) : null,
          },
        ]}
      />
      <Dialog
        open={!!form}
        onClose={() => setForm(null)}
        title="New commission rule"
        footer={<><Button variant="ghost" onClick={() => setForm(null)}>Cancel</Button><Button onClick={save} busy={busy}>Create rule</Button></>}
      >
        {form && (
          <div className={s.stack}>
            <TextInput label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <div className={s.grid2}>
              <Select label="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value as Brand })} options={BRANDS.map((b) => ({ value: b, label: BRAND_LABEL[b] }))} />
              <Select
                label="Paid on"
                value={form.base}
                onChange={(e) => setForm({ ...form, base: e.target.value as Form["base"] })}
                options={[
                  { value: "active_member", label: "Each paid membership month" },
                  { value: "payment", label: "Every payment" },
                  { value: "first_sale", label: "The first payment only" },
                ]}
              />
              <Select label="Commission is" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as Form["mode"] })} options={[{ value: "amount", label: "A fixed amount" }, { value: "percent", label: "A percent of the payment" }]} />
              {form.mode === "amount" ? (
                <MoneyInput label="Amount" valueCents={form.amountCents} onChangeCents={(c) => setForm({ ...form, amountCents: c })} />
              ) : (
                <TextInput label="Percent" type="number" value={form.percent} onChange={(e) => setForm({ ...form, percent: e.target.value })} />
              )}
              <Select label="Activation fee" value={form.include} onChange={(e) => setForm({ ...form, include: e.target.value as Form["include"] })} options={[{ value: "exclude_activation", label: "Not counted" }, { value: "all", label: "Counted" }]} />
              <TextInput label="Stops after (months)" type="number" value={form.durationMonths} onChange={(e) => setForm({ ...form, durationMonths: e.target.value })} optional hint="Empty: pays for as long as the customer pays." />
              <TextInput label="Hold days" type="number" value={form.holdDays} onChange={(e) => setForm({ ...form, holdDays: e.target.value })} hint="Days before a commission can be paid, to cover refunds." />
            </div>
            <p className={s.muted}>
              Example: on a US$79.99 month, {form.mode === "amount" ? money(form.amountCents ?? 0) : money(Math.floor((7999 * Number(form.percent || 0)) / 100))} goes to the partner.
            </p>
          </div>
        )}
      </Dialog>
      <Toast message={toast} tone="success" onDismiss={() => setToast(null)} />
    </div>
  );
}
