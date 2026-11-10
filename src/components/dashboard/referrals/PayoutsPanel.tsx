"use client";

import { useCallback, useEffect, useState } from "react";
import { money, PAYOUT_METHODS, type PayoutMethod, refStaff } from "@/lib/referral";
import { Button, DataTable, Dialog, Select, TextInput, Toast } from "@/components/ui";
import { errorText } from "./ReferralsView";
import s from "./referrals.module.scss";

type Data = Awaited<ReturnType<typeof refStaff.payouts>>;
type Ready = Data["ready"][number];
type Held = Data["held"][number];
type Hist = Data["history"][number];

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

/**
 * Month-end payouts: who is ready (approved balance at or over the minimum,
 * bank details on file), who is on hold and why, and every transfer sent.
 * Recording a payout marks the partner's approved lines paid and emails them.
 */
export default function PayoutsPanel({ isAdmin, onChange, onOpenPartner }: { isAdmin: boolean; onChange: () => void; onOpenPartner: (id: string) => void }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState<Ready | null>(null);
  const [reference, setReference] = useState("");
  const [method, setMethod] = useState<PayoutMethod>("wire");
  const [paidAt, setPaidAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await refStaff.payouts());
      setError(null);
    } catch (e) {
      setError(errorText(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function pay() {
    if (!paying) return;
    setBusy(true);
    setError(null);
    try {
      await refStaff.recordPayout({ partnerId: paying.partner.id, reference, method, ...(paidAt ? { paidAt } : {}) });
      setToast(`${money(paying.totalCents)} to ${paying.partner.name} recorded. They get an email.`);
      setPaying(null);
      setReference("");
      setPaidAt("");
      await load();
      onChange();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={s.stack}>
      {error && <p className={s.error} role="alert">{error}</p>}
      <p className={s.status}>
        Each commission waits for its rule&apos;s hold days (the refund window), then it is ready. A partner is paid once their ready balance reaches {money(data?.minPayoutCents ?? 2500)}.
      </p>
      <DataTable<Ready>
        caption="Ready to pay"
        showCaption
        rows={data?.ready ?? []}
        rowKey={(r) => r.partner.id}
        loading={!data && !error}
        onRowActivate={(r) => onOpenPartner(r.partner.id)}
        empty={<p className={s.muted}>Nobody is ready to be paid.</p>}
        columns={[
          { key: "name", header: "Partner", width: "wide", render: (r) => r.partner.name },
          { key: "bank", header: "Pay to", render: (r) => r.partner.payout ? `${PAYOUT_METHODS.find((m) => m.value === r.partner.payout!.method)?.label} ${r.partner.payout.mask}` : "" },
          { key: "lines", header: "Lines", align: "end", render: (r) => r.lines },
          { key: "total", header: "Amount", align: "end", render: (r) => money(r.totalCents) },
          {
            key: "act",
            header: "",
            align: "end",
            render: (r) =>
              isAdmin ? (
                <Button size="sm" onClick={() => { setPaying(r); setMethod(r.partner.payout?.method ?? "wire"); }}>Record payment</Button>
              ) : null,
          },
        ]}
      />
      <DataTable<Held>
        caption="On hold"
        showCaption
        rows={data?.held ?? []}
        rowKey={(r) => r.partner.id}
        onRowActivate={(r) => onOpenPartner(r.partner.id)}
        empty={<p className={s.muted}>Nothing on hold.</p>}
        columns={[
          { key: "name", header: "Partner", width: "wide", render: (r) => r.partner.name },
          { key: "why", header: "Why", render: (r) => r.why },
          { key: "total", header: "Balance", align: "end", render: (r) => money(r.totalCents) },
        ]}
      />
      <DataTable<Hist>
        caption="Payments sent"
        showCaption
        rows={data?.history ?? []}
        rowKey={(r) => r.id}
        onRowActivate={(r) => onOpenPartner(r.partnerId)}
        empty={<p className={s.muted}>No payments recorded yet.</p>}
        columns={[
          { key: "date", header: "Date", sortValue: (r) => r.paidAt, render: (r) => shortDate(r.paidAt) },
          { key: "name", header: "Partner", width: "wide", render: (r) => r.partnerName },
          { key: "ref", header: "Reference", render: (r) => `${r.reference}${r.source === "import" ? " (imported)" : ""}` },
          { key: "total", header: "Amount", align: "end", sortValue: (r) => r.totalCents, render: (r) => money(r.totalCents) },
        ]}
      />

      <Dialog
        open={!!paying}
        onClose={() => setPaying(null)}
        title={paying ? `Pay ${paying.partner.name} ${money(paying.totalCents)}` : "Record payment"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPaying(null)}>Cancel</Button>
            <Button onClick={pay} busy={busy} disabled={!reference.trim()}>I sent it</Button>
          </>
        }
      >
        <div className={s.stack}>
          <p className={s.muted}>Send the transfer from the bank first (open the partner to see the full account), then record it here with the bank reference.</p>
          <Select label="Method" value={method} onChange={(e) => setMethod(e.target.value as PayoutMethod)} options={PAYOUT_METHODS} />
          <TextInput label="Transfer reference" value={reference} onChange={(e) => setReference(e.target.value)} required />
          <TextInput label="Date sent" placeholder="YYYY-MM-DD" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} optional hint="Empty means today." />
        </div>
      </Dialog>
      <Toast message={toast} tone="success" onDismiss={() => setToast(null)} />
    </div>
  );
}
