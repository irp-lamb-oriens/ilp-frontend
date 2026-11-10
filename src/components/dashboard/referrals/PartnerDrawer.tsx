"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  BRAND_LABEL,
  BRANDS,
  type Brand,
  type CommissionRule,
  money,
  type Partner,
  PARTNER_TYPE_LABEL,
  PAYOUT_METHODS,
  type ReferralLink,
  refStaff,
  ruleSummary,
  type Statement,
} from "@/lib/referral";
import { Button, Checkbox, Drawer, MoneyInput, Select, StatTile, StatusPill, TextArea, TextInput, Toast } from "@/components/ui";
import { errorText, STATUS_LABEL, STATUS_TONE } from "./ReferralsView";
import { landingOptions } from "./NewPartnerDialog";
import s from "./referrals.module.scss";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://internationallegalpartner.com").replace(/\/$/, "");
const shortDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "");

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          window.prompt("Copy this:", text);
        }
      }}
    >
      {done ? "Copied" : label}
    </Button>
  );
}

export default function PartnerDrawer({ id, isAdmin, onClose, onChange }: { id: string | null; isAdmin: boolean; onClose: () => void; onChange: () => void }) {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [st, setSt] = useState<Statement | null>(null);
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [hosts, setHosts] = useState<Record<Brand, string[]>>({ ilp: [], irp: [], aiva: [], censo: [] });
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [edit, setEdit] = useState<Partial<Partner>>({});
  const [bank, setBank] = useState<Record<string, string> | null>(null);
  const [linkForm, setLinkForm] = useState({ brand: "ilp" as Brand, destination: "", campaign: "", code: "" });
  const [adj, setAdj] = useState<{ cents: number | null | undefined; note: string; brand: Brand }>({ cents: null, note: "", brand: "ilp" });
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [r, rr] = await Promise.all([refStaff.partner(id), refStaff.rules()]);
      setPartner(r.partner);
      setSt(r.statement);
      setLinks(r.links);
      setRules(r.rules.filter((x) => !x.archived));
      setHosts(rr.hosts);
      setEdit({});
      setError(null);
      setLinkForm((f) => ({ ...f, brand: r.partner.brands[0] ?? "ilp" }));
      setAdj((a) => ({ ...a, brand: r.partner.brands[0] ?? "ilp" }));
    } catch (e) {
      setError(errorText(e));
    }
  }, [id]);

  useEffect(() => {
    setPartner(null);
    setSt(null);
    setBank(null);
    load();
  }, [load]);

  const pages = useMemo(() => landingOptions(linkForm.brand, hosts[linkForm.brand] ?? []), [linkForm.brand, hosts]);
  useEffect(() => {
    setLinkForm((f) => ({ ...f, destination: pages[0]?.value ?? "" }));
  }, [pages]);

  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
      setToast(ok);
      await load();
      onChange();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  const merged = partner ? { ...partner, ...edit } : null;
  const dirty = Object.keys(edit).length > 0;
  const L = st?.lifetime;

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      size="lg"
      title={partner?.name ?? "Partner"}
      subtitle={partner ? `${PARTNER_TYPE_LABEL[partner.type]} · ${partner.email}` : undefined}
    >
      {error && <p className={s.error} role="alert">{error}</p>}
      {!partner || !merged ? (
        <p className={s.muted}>Loading…</p>
      ) : (
        <div className={s.stack}>
          <div className={s.row}>
            <StatusPill label={STATUS_LABEL[partner.status]} tone={STATUS_TONE[partner.status]} />
            <span className={s.muted}>Partner since {shortDate(partner.startedAt)}{st ? ` (${st.relationshipYears} years)` : ""}</span>
          </div>

          {L && (
            <div className={s.grid2}>
              <StatTile size="sm" label="Sent to them since the start" value={money(L.paidCents)} />
              <StatTile size="sm" label="Earned, not paid yet" value={money(L.pendingCents)} />
              <StatTile size="sm" label="People they brought" value={L.leads.toLocaleString("en-US")} />
              <StatTile size="sm" label="Became customers" value={L.customers.toLocaleString("en-US")} />
            </div>
          )}

          <section className={s.section} aria-labelledby="pd-links">
            <h3 id="pd-links">Links</h3>
            {links.length === 0 && <p className={s.muted}>No links yet.</p>}
            <ul className={s.links}>
              {links.map((l) => (
                <li key={l.id} className={s.link}>
                  <div className={s.linkHead}>
                    <span className={s.code}>{SITE}/r/{l.code}</span>
                    <span className={s.row}>
                      <StatusPill size="sm" label={l.active ? `${BRAND_LABEL[l.brand]} · ${l.clicks} clicks` : "Off"} tone={l.active ? "info" : "neutral"} />
                      <CopyButton text={`${SITE}/r/${l.code}`} label="Copy short link" />
                      <CopyButton text={l.url} label="Copy full link" />
                      <Button size="sm" variant="ghost" busy={busy === `link-${l.id}`} onClick={() => run(`link-${l.id}`, () => refStaff.setLinkActive(l.id, !l.active), l.active ? "Link turned off." : "Link turned on.")}>
                        {l.active ? "Turn off" : "Turn on"}
                      </Button>
                    </span>
                  </div>
                  <p className={s.url}>{l.url}</p>
                </li>
              ))}
            </ul>
            <div className={s.row}>
              <Select label="Brand" value={linkForm.brand} onChange={(e) => setLinkForm({ ...linkForm, brand: e.target.value as Brand })} options={partner.brands.map((b) => ({ value: b, label: BRAND_LABEL[b] }))} />
              <Select label="Page" value={linkForm.destination} onChange={(e) => setLinkForm({ ...linkForm, destination: e.target.value })} options={pages} placeholder={pages.length ? undefined : "No website set"} optional />
              <TextInput label="Campaign" value={linkForm.campaign} onChange={(e) => setLinkForm({ ...linkForm, campaign: e.target.value })} optional />
              <TextInput label="Custom code" value={linkForm.code} onChange={(e) => setLinkForm({ ...linkForm, code: e.target.value })} optional />
              <Button
                busy={busy === "newlink"}
                disabled={!linkForm.destination}
                onClick={() => run("newlink", () => refStaff.createLink({ partnerId: partner.id, ...linkForm, code: linkForm.code || undefined }), "Link created.")}
              >
                New link
              </Button>
            </div>
          </section>

          <section className={s.section} aria-labelledby="pd-settings">
            <h3 id="pd-settings">Agreement and settings</h3>
            <div className={s.grid2}>
              <Select
                label="Status"
                value={merged.status}
                onChange={(e) => setEdit({ ...edit, status: e.target.value as Partner["status"] })}
                options={(["invited", "active", "paused", "closed"] as const).map((v) => ({ value: v, label: STATUS_LABEL[v] }))}
                hint="Paused: links stop bringing new people; existing customers still earn. Closed: nothing more is earned."
              />
              <Select label="Emails in" value={merged.language} onChange={(e) => setEdit({ ...edit, language: e.target.value as "es" | "en" })} options={[{ value: "es", label: "Spanish" }, { value: "en", label: "English" }]} />
              <Select
                label="Tax form"
                value={merged.taxFormStatus}
                onChange={(e) => setEdit({ ...edit, taxFormStatus: e.target.value as Partner["taxFormStatus"] })}
                options={[
                  { value: "missing", label: "Missing" },
                  { value: "w9", label: "W-9 (US person)" },
                  { value: "w8ben", label: "W-8BEN (non-US)" },
                  { value: "cr_invoice", label: "Costa Rica invoice" },
                  { value: "other", label: "Other" },
                ]}
              />
            </div>
            <div className={s.checks}>
              {BRANDS.map((b) => (
                <Checkbox
                  key={b}
                  label={BRAND_LABEL[b]}
                  checked={merged.brands.includes(b)}
                  onChange={(e) => setEdit({ ...edit, brands: e.target.checked ? [...new Set([...merged.brands, b])] : merged.brands.filter((x) => x !== b) })}
                />
              ))}
              <Checkbox label="Monthly summary email" checked={merged.monthlyEmail} onChange={(e) => setEdit({ ...edit, monthlyEmail: e.target.checked })} />
            </div>
            {merged.brands.map((b) => (
              <Select
                key={b}
                label={`Rule for ${BRAND_LABEL[b]}`}
                value={merged.ruleIds[b] ?? ""}
                onChange={(e) => setEdit({ ...edit, ruleIds: { ...merged.ruleIds, [b]: e.target.value } })}
                placeholder="No commission"
                optional
                options={rules.filter((r) => r.brand === b).map((r) => ({ value: r.id, label: `${r.name}: ${ruleSummary(r)}` }))}
              />
            ))}
            <TextArea label="Notes" value={merged.notes ?? ""} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} optional />
            <div className={s.row}>
              <Button disabled={!dirty} busy={busy === "save"} onClick={() => run("save", () => refStaff.updatePartner(partner.id, edit), "Saved.")}>Save changes</Button>
              <Button variant="secondary" busy={busy === "invite"} onClick={() => run("invite", () => refStaff.invite(partner.id), "Invitation sent again.")}>Send portal invitation</Button>
            </div>
          </section>

          <section className={s.section} aria-labelledby="pd-bank">
            <h3 id="pd-bank">Payment details</h3>
            {partner.payout ? (
              <dl className={s.dl}>
                <dt>Method</dt>
                <dd>{PAYOUT_METHODS.find((m) => m.value === partner.payout!.method)?.label}</dd>
                <dt>Holder</dt>
                <dd>{partner.payout.holderName}</dd>
                {partner.payout.bankName && (
                  <>
                    <dt>Bank</dt>
                    <dd>{partner.payout.bankName}</dd>
                  </>
                )}
                <dt>Account</dt>
                <dd>{partner.payout.mask}</dd>
                <dt>Updated</dt>
                <dd>{shortDate(partner.payout.updatedAt)}</dd>
              </dl>
            ) : (
              <p className={s.muted}>The partner has not entered bank details yet. They do it in their portal; payouts wait until then.</p>
            )}
            {isAdmin && partner.payout && !bank && (
              <Button variant="secondary" busy={busy === "reveal"} onClick={async () => {
                setBusy("reveal");
                try {
                  setBank((await refStaff.revealPayout(partner.id)).details);
                } catch (e) {
                  setError(errorText(e));
                } finally {
                  setBusy(null);
                }
              }}>Show full details (logged)</Button>
            )}
            {bank && (
              <dl className={s.dl}>
                {Object.entries(bank).filter(([, v]) => v).map(([k, v]) => (
                  <Fragment key={k}><dt>{k}</dt><dd>{String(v)}</dd></Fragment>
                ))}
              </dl>
            )}
          </section>

          {isAdmin && (
            <section className={s.section} aria-labelledby="pd-adjust">
              <h3 id="pd-adjust">Bonus or correction</h3>
              <p className={s.muted}>Adds an amount to their next payment, for example a bonus. To take money back, refund the sale under Record and import.</p>
              <div className={s.row}>
                <Select label="Brand" value={adj.brand} onChange={(e) => setAdj({ ...adj, brand: e.target.value as Brand })} options={partner.brands.map((b) => ({ value: b, label: BRAND_LABEL[b] }))} />
                <MoneyInput label="Amount" valueCents={adj.cents} onChangeCents={(c) => setAdj({ ...adj, cents: c })} />
                <TextInput label="What for" value={adj.note} onChange={(e) => setAdj({ ...adj, note: e.target.value })} />
                <Button
                  busy={busy === "adj"}
                  disabled={!adj.cents || !adj.note.trim()}
                  onClick={() => run("adj", () => refStaff.adjust(partner.id, { brand: adj.brand, amountCents: adj.cents, note: adj.note }), "Added to the next payment.")}
                >
                  Add
                </Button>
              </div>
            </section>
          )}

          {st && (
            <section className={s.section} aria-labelledby="pd-paid">
              <h3 id="pd-paid">Payments sent</h3>
              {st.payouts.length === 0 ? (
                <p className={s.muted}>Nothing sent yet.</p>
              ) : (
                <dl className={s.dl}>
                  {st.payouts.map((p) => (
                    <Fragment key={p.id}><dt>{shortDate(p.paidAt)}</dt><dd>{money(p.totalCents)} · {p.reference}</dd></Fragment>
                  ))}
                </dl>
              )}
              {st.years.length > 0 && (
                <p className={s.muted}>
                  By year: {st.years.map((y) => `${y.year} ${money(y.paidCents)} sent, ${y.customers} customers`).join("; ")}.
                </p>
              )}
            </section>
          )}
        </div>
      )}
      <Toast message={toast} tone="success" onDismiss={() => setToast(null)} />
    </Drawer>
  );
}
