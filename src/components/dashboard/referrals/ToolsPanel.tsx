"use client";

import { useState } from "react";
import { BRAND_LABEL, BRANDS, type Brand, money, type PartnerRow, parseHistoryCsv, refStaff } from "@/lib/referral";
import { Button, Card, MoneyInput, Select, TextInput, Toast } from "@/components/ui";
import { errorText } from "./ReferralsView";
import s from "./referrals.module.scss";

const brandOptions = BRANDS.map((b) => ({ value: b, label: BRAND_LABEL[b] }));

const SALE_REASON: Record<string, string> = {
  earned: "Commission added.",
  duplicate: "This sale was already recorded.",
  no_referral: "No partner brought this customer. Assign one first, or add the partner's code.",
  no_rule: "The partner has no rule for this brand.",
  partner_closed: "The partner is closed.",
  not_membership: "This partner is paid on membership months only, not one-off sales.",
  not_first_sale: "This partner is paid on the first sale only.",
  duration_ended: "The partner's agreement for this customer has ended.",
  zero_after_rule: "Nothing to pay on this amount.",
};

/**
 * Hand tools for brands that close sales by hand (IRP, AIVA, El Censo; ILP
 * records its own), for "me mandó Sara" assignments, refunds and importing
 * the payments made before this system existed.
 */
export default function ToolsPanel({ isAdmin, partners, onChange }: { isAdmin: boolean; partners: PartnerRow[]; onChange: () => void }) {
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [sale, setSale] = useState({ brand: "irp" as Brand, customer: "", cents: null as number | null | undefined, kind: "one_time", saleRef: "", refCode: "" });
  const [assign, setAssign] = useState({ brand: "ilp" as Brand, customer: "", partnerId: "", reason: "" });
  const [refund, setRefund] = useState({ brand: "irp" as Brand, saleRef: "", reason: "" });
  const [csv, setCsv] = useState("");
  const [importResult, setImportResult] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<string>) => {
    setBusy(key);
    setError(null);
    try {
      setToast(await fn());
      onChange();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  const customer = (v: string) => (v.includes("@") ? { email: v.trim() } : { clientId: v.trim() });

  return (
    <div className={s.stack}>
      {error && <p className={s.error} role="alert">{error}</p>}

      <Card title="Record a sale" padding="md">
        <p className={s.muted}>For IRP, AIVA and El Censo sales closed by hand. ILP memberships are recorded on their own when the member pays.</p>
        <div className={s.grid2}>
          <Select label="Brand" value={sale.brand} onChange={(e) => setSale({ ...sale, brand: e.target.value as Brand })} options={brandOptions} />
          <TextInput label="Customer email or id" value={sale.customer} onChange={(e) => setSale({ ...sale, customer: e.target.value })} required />
          <MoneyInput label="Amount paid" valueCents={sale.cents} onChangeCents={(c) => setSale({ ...sale, cents: c })} />
          <Select label="Kind" value={sale.kind} onChange={(e) => setSale({ ...sale, kind: e.target.value })} options={[{ value: "one_time", label: "One-off sale" }, { value: "initial", label: "First payment of a subscription" }, { value: "renewal", label: "Subscription renewal" }]} />
          <TextInput label="Sale or invoice number" value={sale.saleRef} onChange={(e) => setSale({ ...sale, saleRef: e.target.value })} optional hint="Recording the same number twice never pays twice." />
          <TextInput label="Partner code" value={sale.refCode} onChange={(e) => setSale({ ...sale, refCode: e.target.value })} optional hint="Only when the customer is not assigned to a partner yet." />
        </div>
        <Button
          busy={busy === "sale"}
          disabled={!sale.customer.trim() || !sale.cents}
          onClick={() => run("sale", async () => {
            const out = await refStaff.sale({ brand: sale.brand, ...customer(sale.customer), amountCents: sale.cents, kind: sale.kind, saleRef: sale.saleRef || undefined, refCode: sale.refCode || undefined });
            setSale({ ...sale, customer: "", cents: null, saleRef: "", refCode: "" });
            return out.commission && out.reason === "earned" ? `Commission of ${money(out.commission.amountCents)} added.` : SALE_REASON[out.reason] ?? out.reason;
          })}
        >
          Record sale
        </Button>
      </Card>

      <Card title="Assign a customer to a partner" padding="md">
        <p className={s.muted}>When a customer says a partner sent them but did not use the link. Replaces any earlier partner for that customer; the change is logged.</p>
        <div className={s.grid2}>
          <Select label="Brand" value={assign.brand} onChange={(e) => setAssign({ ...assign, brand: e.target.value as Brand })} options={brandOptions} />
          <TextInput label="Customer email or id" value={assign.customer} onChange={(e) => setAssign({ ...assign, customer: e.target.value })} required />
          <Select label="Partner" value={assign.partnerId} onChange={(e) => setAssign({ ...assign, partnerId: e.target.value })} placeholder="Choose a partner" options={partners.filter((p) => p.brands.includes(assign.brand)).map((p) => ({ value: p.id, label: p.name }))} />
          <TextInput label="Why" value={assign.reason} onChange={(e) => setAssign({ ...assign, reason: e.target.value })} required hint="For example: said on the call that Sara sent her." />
        </div>
        <Button
          busy={busy === "assign"}
          disabled={!assign.customer.trim() || !assign.partnerId || !assign.reason.trim()}
          onClick={() => run("assign", async () => {
            await refStaff.assign({ brand: assign.brand, ...customer(assign.customer), partnerId: assign.partnerId, reason: assign.reason });
            setAssign({ ...assign, customer: "", reason: "" });
            return "Customer assigned. Their next payments earn the partner's commission.";
          })}
        >
          Assign
        </Button>
      </Card>

      {isAdmin && (
        <Card title="Refund or chargeback" padding="md">
          <p className={s.muted}>A commission not paid yet is cancelled. One already paid is taken off the partner&apos;s next payment.</p>
          <div className={s.grid2}>
            <Select label="Brand" value={refund.brand} onChange={(e) => setRefund({ ...refund, brand: e.target.value as Brand })} options={brandOptions} />
            <TextInput label="Sale or invoice number" value={refund.saleRef} onChange={(e) => setRefund({ ...refund, saleRef: e.target.value })} required hint="ILP memberships: ilp:mem:<membership id>:initial for the first payment." />
            <TextInput label="Reason" value={refund.reason} onChange={(e) => setRefund({ ...refund, reason: e.target.value })} />
          </div>
          <Button
            variant="danger"
            busy={busy === "refund"}
            disabled={!refund.saleRef.trim()}
            onClick={() => run("refund", async () => {
              const out = await refStaff.refund(refund);
              setRefund({ ...refund, saleRef: "", reason: "" });
              return out.lines.length ? "Commission cancelled." : "No commission found for that sale.";
            })}
          >
            Cancel the commission
          </Button>
        </Card>
      )}

      {isAdmin && (
        <Card title="Import past payments" padding="md">
          <p className={s.muted}>
            For what you paid partners before this system, so their total since the start is right. One payment per line: partner email, brand (ilp, irp, aiva, censo), date (YYYY-MM-DD), amount in dollars, transfer reference, customer. Importing the same lines again changes nothing.
          </p>
          <label className={s.muted} htmlFor="ref-import">Lines to import</label>
          <textarea
            id="ref-import"
            className={s.textarea}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder={"sara@gmail.com,irp,2023-11-15,1500,BN-4471,Cliente Pérez\nsara@gmail.com,irp,2024-03-02,1600,BN-5120,Cliente Mora"}
          />
          <Button
            busy={busy === "import"}
            disabled={!csv.trim()}
            onClick={() => run("import", async () => {
              const { rows, errors } = parseHistoryCsv(csv);
              if (!rows.length) throw new Error(errors[0] ?? "No lines to import.");
              const out = await refStaff.importRows(rows);
              const skipped = [...errors, ...out.skipped.map((x) => `Line ${x.row}: ${x.why}`)];
              setImportResult(skipped.length ? `Skipped: ${skipped.join("; ")}` : null);
              if (!skipped.length) setCsv("");
              return `${out.lines} payment line(s) imported in ${out.payouts} transfer(s).`;
            })}
          >
            Import
          </Button>
          {importResult && <p className={s.error}>{importResult}</p>}
        </Card>
      )}
      <Toast message={toast} tone="success" onDismiss={() => setToast(null)} />
    </div>
  );
}
