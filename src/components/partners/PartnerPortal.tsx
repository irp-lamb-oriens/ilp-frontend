"use client";

import { Fragment, useCallback, useEffect, useState, type FormEvent } from "react";
import PortalLogin from "@/components/auth/PortalLogin";
import { Button, Checkbox, DataTable, Select, StatTile, StatusPill, TextInput, Toast } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { BRAND_LABEL, money, monthShort, partnerApi, PAYOUT_METHODS, type PayoutMethod, refPartner, type Statement } from "@/lib/referral";
import s from "./partners.module.scss";

type Lang = "en" | "es";
type Links = Awaited<ReturnType<typeof refPartner.links>>["links"];

const T = {
  en: {
    loading: "Loading your portal",
    title: "Partner portal",
    signOut: "Sign out",
    since: (d: string, amount: string) => `Since ${d} we have sent you ${amount}.`,
    sinceNone: (d: string) => `You have been an ILP partner since ${d}.`,
    people: "People you brought",
    customers: "Became customers",
    earned: "Earned",
    pending: "On its way to you",
    pendingHint: "Paid at month end once the refund window passes",
    links: "Your links",
    linksHelp: "Share any of these. When someone comes through it and becomes a customer, you earn your commission. The short link is easiest to say out loud.",
    noLinks: "No links yet. Your ILP contact will add one.",
    copy: "Copy",
    copied: "Copied",
    clicks: (n: number) => `${n} ${n === 1 ? "click" : "clicks"}`,
    month: "Month",
    year: "Year",
    byMonth: "Month by month",
    payments: "Payments we sent you",
    noPayments: "No payments yet.",
    date: "Date",
    amount: "Amount",
    reference: "Reference",
    payTo: "Where we pay you",
    payToHelp: "We use this only to send your commissions. After you save, only the last 4 digits are shown.",
    method: "Method",
    holder: "Account holder",
    bank: "Bank",
    account: "Account number",
    iban: "IBAN",
    swift: "SWIFT or BIC",
    phone: "SINPE Móvil phone",
    payEmail: "Payment email (Wise or PayPal)",
    taxId: "ID or tax number",
    country: "Country",
    currency: "Currency",
    save: "Save payment details",
    saved: "Payment details saved.",
    current: (m: string) => `Saved: ${m}. Enter them again to change them.`,
    settings: "Settings",
    monthly: "Send me a monthly summary by email",
    language: "Language",
    optional: "Optional",
    noData: "Nothing yet this year.",
  },
  es: {
    loading: "Cargando su portal",
    title: "Portal de socios",
    signOut: "Salir",
    since: (d: string, amount: string) => `Desde ${d} le hemos transferido ${amount}.`,
    sinceNone: (d: string) => `Es socio de ILP desde ${d}.`,
    people: "Personas que nos envió",
    customers: "Se hicieron clientes",
    earned: "Ganado",
    pending: "En camino",
    pendingHint: "Se paga a fin de mes, al pasar el plazo de reembolso",
    links: "Sus links",
    linksHelp: "Comparta cualquiera de estos. Cuando alguien entra por su link y se hace cliente, usted gana su comisión. El link corto es el más fácil de decir.",
    noLinks: "Todavía no tiene links. Su contacto en ILP le agregará uno.",
    copy: "Copiar",
    copied: "Copiado",
    clicks: (n: number) => `${n} ${n === 1 ? "clic" : "clics"}`,
    month: "Mes",
    year: "Año",
    byMonth: "Mes a mes",
    payments: "Pagos que le enviamos",
    noPayments: "Todavía no hay pagos.",
    date: "Fecha",
    amount: "Monto",
    reference: "Referencia",
    payTo: "Dónde le pagamos",
    payToHelp: "Usamos esto solo para enviarle sus comisiones. Al guardar, solo se muestran los últimos 4 dígitos.",
    method: "Método",
    holder: "Titular de la cuenta",
    bank: "Banco",
    account: "Número de cuenta",
    iban: "IBAN",
    swift: "SWIFT o BIC",
    phone: "Teléfono SINPE Móvil",
    payEmail: "Correo de pago (Wise o PayPal)",
    taxId: "Cédula o número fiscal",
    country: "País",
    currency: "Moneda",
    save: "Guardar datos de pago",
    saved: "Datos de pago guardados.",
    current: (m: string) => `Guardado: ${m}. Ingréselos de nuevo para cambiarlos.`,
    settings: "Preferencias",
    monthly: "Enviarme un resumen mensual por correo",
    language: "Idioma",
    optional: "Opcional",
    noData: "Nada todavía este año.",
  },
};

const METHOD_ES: Record<PayoutMethod, string> = { wire: "Transferencia bancaria", sinpe: "SINPE Móvil", wise: "Wise", paypal: "PayPal", other: "Otro" };
const MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function niceDate(iso: string, lang: Lang, withDay = false): string {
  return new Date(iso).toLocaleDateString(lang === "es" ? "es-CR" : "en-US", { year: "numeric", month: "long", ...(withDay ? { day: "numeric" } : {}) });
}

function Copy({ text, t }: { text: string; t: typeof T.en }) {
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
          window.prompt(t.copy, text);
        }
      }}
    >
      {done ? t.copied : t.copy}
    </Button>
  );
}

/**
 * REFERRALS: the partner's own page (/partners). Email-code sign-in, then
 * what they have brought, earned and been sent since the relationship
 * started, their links, the payments we sent, and where to pay them.
 * Shown in the partner's language (Spanish or English).
 */
export default function PartnerPortal() {
  const [state, setState] = useState<"loading" | "login" | "ready" | "error">("loading");
  const [st, setSt] = useState<Statement | null>(null);
  const [links, setLinks] = useState<Links>([]);
  const [year, setYear] = useState<number | undefined>(undefined);
  const [lang, setLang] = useState<Lang>("es");
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pay, setPay] = useState<Record<string, string>>({ method: "wire" });
  const t = T[lang];

  const load = useCallback(async (y?: number) => {
    if (!partnerApi.hasSession()) {
      setState("login");
      return;
    }
    try {
      const [me, l] = await Promise.all([refPartner.me(y), refPartner.links()]);
      setSt(me.statement);
      setLinks(l.links);
      setLang(me.statement.partner.language);
      setState("ready");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setState("login");
      else {
        setError(e instanceof ApiError ? e.message : "Could not reach ILP. Try again.");
        setState("error");
      }
    }
  }, []);

  useEffect(() => {
    load(year);
  }, [load, year]);

  async function savePayout(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await refPartner.setPayout(pay);
      setToast(t.saved);
      setPay({ method: pay.method });
      await load(year);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function setting(body: { language?: Lang; monthlyEmail?: boolean }) {
    try {
      await refPartner.update(body);
      if (body.language) setLang(body.language);
      await load(year);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save. Try again.");
    }
  }

  if (state === "login") {
    return (
      <PortalLogin
        role="partner"
        onSuccess={() => {
          setState("loading");
          load(year);
        }}
      />
    );
  }

  if (state !== "ready" || !st) {
    return (
      <main className={s.page}>
        <p className={state === "error" ? s.error : s.muted} role="status">{state === "error" ? error : t.loading}</p>
        {state === "error" && <Button onClick={() => load(year)}>Retry</Button>}
      </main>
    );
  }

  const L = st.lifetime;
  const since = niceDate(st.partner.startedAt, lang);
  const monthLabel = (k: string) => (lang === "es" ? MONTHS_ES[Number(k.slice(5, 7)) - 1] : monthShort(k));
  const field = (key: string, label: string, opts: { type?: "text" | "email" | "tel"; optional?: boolean } = {}) => (
    <TextInput label={label} type={opts.type ?? "text"} value={pay[key] ?? ""} onChange={(e) => setPay({ ...pay, [key]: e.target.value })} optional={opts.optional} />
  );

  return (
    <main className={s.page}>
      <header className={s.head}>
        <div>
          <p className={s.eyebrow}>{t.title}</p>
          <h1 className={s.title}>{st.partner.name}</h1>
          <p className={s.lead}>{L.paidCents > 0 ? t.since(since, money(L.paidCents)) : t.sinceNone(since)}</p>
        </div>
        <div className={s.headActions}>
          <Select label={t.language} hideLabel value={lang} onChange={(e) => setting({ language: e.target.value as Lang })} options={[{ value: "es", label: "Español" }, { value: "en", label: "English" }]} />
          <Button variant="ghost" onClick={async () => { await partnerApi.logout(); setState("login"); }}>{t.signOut}</Button>
        </div>
      </header>

      {error && <p className={s.error} role="alert">{error}</p>}

      <section className={s.tiles} aria-label={t.earned}>
        <StatTile label={t.people} value={L.leads.toLocaleString("en-US")} />
        <StatTile label={t.customers} value={L.customers.toLocaleString("en-US")} />
        <StatTile label={t.earned} value={money(L.earnedCents)} />
        <StatTile label={t.pending} value={money(L.pendingCents)} hint={t.pendingHint} />
      </section>

      <section className={s.section} aria-labelledby="p-links">
        <h2 id="p-links">{t.links}</h2>
        <p className={s.muted}>{t.linksHelp}</p>
        {links.length === 0 ? (
          <p className={s.muted}>{t.noLinks}</p>
        ) : (
          <ul className={s.links}>
            {links.map((l) => (
              <li key={l.id} className={s.link}>
                <div className={s.linkHead}>
                  <strong className={s.code}>{l.shortUrl.replace(/^https?:\/\//, "")}</strong>
                  <StatusPill size="sm" tone="info" label={`${BRAND_LABEL[l.brand]} · ${t.clicks(l.clicks)}`} />
                </div>
                <div className={s.row}>
                  <Copy text={l.shortUrl} t={t} />
                </div>
                <p className={s.url}>{l.url}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={s.section} aria-labelledby="p-months">
        <div className={s.sectionHead}>
          <h2 id="p-months">{t.byMonth}</h2>
          <Select
            label={t.year}
            hideLabel
            value={String(st.year)}
            onChange={(e) => setYear(Number(e.target.value))}
            options={[...new Set([new Date().getUTCFullYear(), ...st.years.map((y) => y.year)])].sort((a, b) => b - a).map((y) => ({ value: String(y), label: String(y) }))}
          />
        </div>
        <DataTable
          caption={t.byMonth}
          rows={[...st.months].reverse()}
          rowKey={(m) => m.month}
          empty={<p className={s.muted}>{t.noData}</p>}
          columns={[
            { key: "m", header: t.month, render: (m) => `${monthLabel(m.month)} ${m.month.slice(0, 4)}` },
            { key: "p", header: t.people, align: "end", render: (m) => m.leads },
            { key: "c", header: t.customers, align: "end", render: (m) => m.customers },
            { key: "e", header: t.earned, align: "end", render: (m) => money(m.earnedCents) },
          ]}
        />
      </section>

      <section className={s.section} aria-labelledby="p-paid">
        <h2 id="p-paid">{t.payments}</h2>
        {st.payouts.length === 0 ? (
          <p className={s.muted}>{t.noPayments}</p>
        ) : (
          <dl className={s.dl}>
            {st.payouts.map((p) => (
              <Fragment key={p.id}>
                <dt>{niceDate(p.paidAt, lang, true)}</dt>
                <dd>{money(p.totalCents)} · {p.reference}</dd>
              </Fragment>
            ))}
          </dl>
        )}
      </section>

      <section className={s.section} aria-labelledby="p-bank">
        <h2 id="p-bank">{t.payTo}</h2>
        <p className={s.muted}>{t.payToHelp}</p>
        {st.partner.payout && (
          <p className={s.status} role="status">
            {t.current(`${lang === "es" ? METHOD_ES[st.partner.payout.method] : PAYOUT_METHODS.find((m) => m.value === st.partner.payout!.method)?.label}, ${st.partner.payout.holderName}, ${st.partner.payout.mask}`)}
          </p>
        )}
        <form onSubmit={savePayout} className={s.form}>
          <Select
            label={t.method}
            value={pay.method}
            onChange={(e) => setPay({ method: e.target.value })}
            options={PAYOUT_METHODS.map((m) => ({ value: m.value, label: lang === "es" ? METHOD_ES[m.value] : m.label }))}
          />
          {field("holderName", t.holder)}
          {pay.method === "wire" && (
            <>
              {field("bankName", t.bank)}
              {field("account", t.account)}
              {field("iban", t.iban, { optional: true })}
              {field("swift", t.swift, { optional: true })}
              {field("country", t.country, { optional: true })}
              {field("currency", t.currency, { optional: true })}
            </>
          )}
          {pay.method === "sinpe" && field("phone", t.phone, { type: "tel" })}
          {(pay.method === "wise" || pay.method === "paypal") && field("email", t.payEmail, { type: "email" })}
          {pay.method === "other" && field("account", t.account)}
          {field("taxId", t.taxId, { optional: true })}
          <Button type="submit" busy={busy}>{t.save}</Button>
        </form>
      </section>

      <section className={s.section} aria-labelledby="p-settings">
        <h2 id="p-settings">{t.settings}</h2>
        <Checkbox label={t.monthly} checked={st.partner.monthlyEmail} onChange={(e) => setting({ monthlyEmail: e.target.checked })} />
      </section>
      <Toast message={toast} tone="success" onDismiss={() => setToast(null)} />
    </main>
  );
}
