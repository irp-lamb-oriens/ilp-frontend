"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BRAND_LABEL, BRANDS, type Brand, type CommissionRule, PARTNER_TYPES, type PartnerType, refStaff, ruleSummary } from "@/lib/referral";
import { Button, Checkbox, Dialog, Select, TextArea, TextInput } from "@/components/ui";
import { errorText } from "./ReferralsView";
import s from "./referrals.module.scss";

/** Landing pages offered for the first link, per brand (the server checks the host). */
export function landingOptions(brand: Brand, hosts: string[]): Array<{ value: string; label: string }> {
  const host = hosts[0];
  if (!host) return [];
  const base = `https://${host}`;
  if (brand === "ilp") {
    return [
      { value: `${base}/check`, label: "Free deadline check" },
      { value: `${base}/`, label: "Home page" },
      { value: `${base}/pricing`, label: "Pricing" },
      { value: `${base}/join`, label: "Join" },
      { value: `${base}/costa-rica`, label: "Costa Rica" },
    ];
  }
  return [{ value: `${base}/`, label: "Home page" }];
}

export default function NewPartnerDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string, message: string) => void }) {
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [hosts, setHosts] = useState<Record<Brand, string[]>>({ ilp: [], irp: [], aiva: [], censo: [] });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState<PartnerType>("teacher");
  const [brands, setBrands] = useState<Brand[]>(["ilp"]);
  const [ruleIds, setRuleIds] = useState<Partial<Record<Brand, string>>>({});
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [notes, setNotes] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [linkBrand, setLinkBrand] = useState<Brand>("ilp");
  const [destination, setDestination] = useState("");
  const [campaign, setCampaign] = useState("");
  const [code, setCode] = useState("");
  const [invite, setInvite] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    refStaff.rules().then((r) => {
      setRules(r.rules.filter((x) => !x.archived));
      setHosts(r.hosts);
    }).catch(() => {});
  }, [open]);

  const pages = useMemo(() => landingOptions(linkBrand, hosts[linkBrand] ?? []), [linkBrand, hosts]);
  useEffect(() => {
    setDestination(pages[0]?.value ?? "");
  }, [pages]);
  useEffect(() => {
    if (!brands.includes(linkBrand) && brands[0]) setLinkBrand(brands[0]);
  }, [brands, linkBrand]);

  const toggleBrand = (b: Brand, on: boolean) => setBrands((cur) => (on ? [...new Set([...cur, b])] : cur.filter((x) => x !== b)));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const out = await refStaff.createPartner({
        name,
        email,
        type,
        brands,
        ruleIds: Object.fromEntries(Object.entries(ruleIds).filter(([b, id]) => id && brands.includes(b as Brand))),
        language,
        notes,
        ...(startedAt ? { startedAt } : {}),
        sendInvite: invite,
        ...(destination ? { link: { brand: linkBrand, destination, campaign, code: code || undefined } } : {}),
      });
      onCreated(out.partner.id, invite ? `${out.partner.name} added. The invitation email is on its way.` : `${out.partner.name} added.`);
      setName("");
      setEmail("");
      setNotes("");
      setCode("");
      setCampaign("");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New partner"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="new-partner" busy={busy}>Add partner</Button>
        </>
      }
    >
      <form id="new-partner" onSubmit={submit} className={s.stack}>
        {error && <p className={s.error} role="alert">{error}</p>}
        <div className={s.grid2}>
          <TextInput label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <TextInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required hint="They sign in to the partner portal with this email." />
          <Select label="Type" value={type} onChange={(e) => setType(e.target.value as PartnerType)} options={PARTNER_TYPES} />
          <Select label="Emails in" value={language} onChange={(e) => setLanguage(e.target.value as "es" | "en")} options={[{ value: "es", label: "Spanish" }, { value: "en", label: "English" }]} />
        </div>
        <fieldset className={s.stack}>
          <legend className={s.muted}>Brands and commission</legend>
          <div className={s.checks}>
            {BRANDS.map((b) => (
              <Checkbox key={b} label={BRAND_LABEL[b]} checked={brands.includes(b)} onChange={(e) => toggleBrand(b, e.target.checked)} />
            ))}
          </div>
          {brands.map((b) => {
            const opts = rules.filter((r) => r.brand === b);
            return (
              <Select
                key={b}
                label={`Rule for ${BRAND_LABEL[b]}`}
                value={ruleIds[b] ?? ""}
                onChange={(e) => setRuleIds((cur) => ({ ...cur, [b]: e.target.value }))}
                placeholder={opts.length ? "No commission yet" : "No rule for this brand yet (add one under Commission rules)"}
                optional
                options={opts.map((r) => ({ value: r.id, label: `${r.name}: ${ruleSummary(r)}` }))}
              />
            );
          })}
        </fieldset>
        <fieldset className={s.stack}>
          <legend className={s.muted}>First link (optional)</legend>
          <div className={s.grid2}>
            <Select label="Brand" value={linkBrand} onChange={(e) => setLinkBrand(e.target.value as Brand)} options={brands.map((b) => ({ value: b, label: BRAND_LABEL[b] }))} />
            <Select label="Page" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder={pages.length ? undefined : "No website set for this brand"} options={pages} optional />
            <TextInput label="Campaign" value={campaign} onChange={(e) => setCampaign(e.target.value)} optional hint="Goes in utm_campaign, for example maestros-2026." />
            <TextInput label="Custom code" value={code} onChange={(e) => setCode(e.target.value)} optional hint="Leave empty to use the name, for example sara." />
          </div>
        </fieldset>
        <div className={s.grid2}>
          <TextInput label="Relationship started" type="text" placeholder="YYYY-MM-DD" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} optional hint="For a partner who already sent you clients. Importing past payments sets it too." />
          <TextArea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} optional hint="The agreement in a line, for example 50% of revenue, agreed on 10 Nov." />
        </div>
        <Checkbox label="Email them the portal invitation now" checked={invite} onChange={(e) => setInvite(e.target.checked)} />
      </form>
    </Dialog>
  );
}
