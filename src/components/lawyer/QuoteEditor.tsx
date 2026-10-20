"use client";

import { useEffect, useMemo, useState } from "react";
import { providerFetch } from "@/lib/provider";
import type { Quote, QuoteGroup, QuoteLineItem } from "./types";
import styles from "./quoteEditor.module.scss";

interface TemplateOption {
  id: string;
  title: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function blankLine(currency: string, marginPct: number): QuoteLineItem {
  return {
    lineId: makeId("li"),
    label: "",
    amount: 0,
    marginPct,
    marginMode: "pct",
    marginFlat: null,
    currency,
    providerId: null,
    notes: null,
  };
}

function blankGroup(role: QuoteGroup["role"], currency: string, marginPct: number): QuoteGroup {
  return {
    groupId: makeId("grp"),
    title: "",
    labelId: null,
    role,
    description: null,
    lineItems: [blankLine(currency, marginPct)],
  };
}

function lineClientPrice(li: QuoteLineItem): number {
  const cost = Number(li.amount) || 0;
  if (li.marginMode === "flat") {
    return Math.round((cost + (Number(li.marginFlat) || 0)) * 100) / 100;
  }
  const m = typeof li.marginPct === "number" ? li.marginPct : 20;
  return Math.round(cost * (1 + m / 100) * 100) / 100;
}

function money(n: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

// ── Component ─────────────────────────────────────────────────────────────────

interface QuoteEditorProps {
  clientId: string;
  quote: Quote | null; // null = new quote
  onSaved: (quote: Quote) => void;
  onCancelled: () => void;
}

export default function QuoteEditor({ clientId, quote, onSaved, onCancelled }: QuoteEditorProps) {
  const [title, setTitle] = useState(quote?.title ?? "");
  const [notes, setNotes] = useState(quote?.notes ?? "");
  const [currency, setCurrency] = useState(quote?.currency ?? "USD");
  const [defaultMarginPct, setDefaultMarginPct] = useState(quote?.defaultMarginPct ?? 20);
  const [clientDescription, setClientDescription] = useState(quote?.clientDescription ?? "");
  const [paymentSchedule, setPaymentSchedule] = useState<number[]>(
    Array.isArray(quote?.paymentSchedule) && quote.paymentSchedule.length > 0
      ? quote.paymentSchedule
      : [35, 65],
  );
  const [groups, setGroups] = useState<QuoteGroup[]>(() => {
    if (Array.isArray(quote?.lineGroups) && quote.lineGroups.length > 0) {
      return quote.lineGroups;
    }
    if (Array.isArray(quote?.lineItems) && quote.lineItems.length > 0) {
      return [
        {
          groupId: makeId("grp"),
          title: "",
          labelId: null,
          role: "required",
          description: null,
          lineItems: quote.lineItems,
        },
      ];
    }
    return [blankGroup("optional", quote?.currency ?? "USD", quote?.defaultMarginPct ?? 20)];
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [templateId, setTemplateId] = useState<string>(quote?.templateId ?? "");
  const [templates, setTemplates] = useState<TemplateOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/templates")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Array<Record<string, unknown>>) => {
        if (cancelled) return;
        setTemplates(
          rows
            .filter((t) => t && t.id && t.title)
            .map((t) => ({ id: String(t.id), title: String(t.title) })),
        );
      })
      .catch(() => {
        // non-fatal; selector just stays empty
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Derived math ────────────────────────────────────────────────────────────
  const lineItems = useMemo(() => groups.flatMap((g) => g.lineItems), [groups]);
  const costSubtotal = useMemo(
    () => Math.round(lineItems.reduce((s, li) => s + (Number(li.amount) || 0), 0) * 100) / 100,
    [lineItems],
  );
  const clientTotal = useMemo(
    () => Math.round(lineItems.reduce((s, li) => s + lineClientPrice(li), 0) * 100) / 100,
    [lineItems],
  );
  const earnings = useMemo(
    () => Math.round((clientTotal - costSubtotal) * 100) / 100,
    [clientTotal, costSubtotal],
  );
  const scheduleSum = paymentSchedule.reduce((s, p) => s + (Number(p) || 0), 0);
  const scheduleOver = scheduleSum > 100.001;

  // ── Group / line mutations ──────────────────────────────────────────────────
  function updateGroup(groupId: string, patch: Partial<QuoteGroup>) {
    setGroups((gs) => gs.map((g) => (g.groupId === groupId ? { ...g, ...patch } : g)));
  }

  function addGroup() {
    setGroups((gs) => [...gs, blankGroup("optional", currency, defaultMarginPct)]);
  }

  function removeGroup(groupId: string) {
    setGroups((gs) => {
      const next = gs.filter((g) => g.groupId !== groupId);
      return next.length > 0 ? next : [blankGroup("optional", currency, defaultMarginPct)];
    });
  }

  function addLine(groupId: string) {
    setGroups((gs) =>
      gs.map((g) =>
        g.groupId === groupId
          ? { ...g, lineItems: [...g.lineItems, blankLine(g.lineItems[0]?.currency ?? currency, defaultMarginPct)] }
          : g,
      ),
    );
  }

  function removeLine(groupId: string, lineId: string) {
    setGroups((gs) =>
      gs.map((g) =>
        g.groupId === groupId
          ? { ...g, lineItems: g.lineItems.filter((li) => li.lineId !== lineId) }
          : g,
      ),
    );
  }

  function updateLine(groupId: string, lineId: string, patch: Partial<QuoteLineItem>) {
    setGroups((gs) =>
      gs.map((g) =>
        g.groupId === groupId
          ? {
              ...g,
              lineItems: g.lineItems.map((li) => (li.lineId === lineId ? { ...li, ...patch } : li)),
            }
          : g,
      ),
    );
  }

  function addScheduleSegment() {
    setPaymentSchedule((s) => [...s, 0]);
  }

  function removeScheduleSegment(i: number) {
    setPaymentSchedule((s) => (s.length <= 1 ? s : s.filter((_, idx) => idx !== i)));
  }

  // ── AI description ──────────────────────────────────────────────────────────
  async function generateDescription() {
    if (!quote) {
      setError("Save the quote once before generating a description.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await providerFetch<{ clientDescription: string }>(
        `/api/provider/clients/${clientId}/quotes/${quote.quoteId}/generate-description`,
        { method: "POST", body: JSON.stringify({ force: true }) },
      );
      setClientDescription(res.clientDescription);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate a description.");
    } finally {
      setGenerating(false);
    }
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  async function save() {
    if (scheduleOver) {
      setError("Payment schedule segments must sum to no more than 100%.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      title,
      notes,
      currency,
      defaultMarginPct,
      clientDescription,
      paymentSchedule,
      templateId: templateId || null,
      lineGroups: groups,
    };
    try {
      if (quote) {
        await providerFetch(`/api/provider/clients/${clientId}/quotes/${quote.quoteId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        const updated = await providerFetch<Quote>(
          `/api/provider/clients/${clientId}/quotes/${quote.quoteId}`,
        );
        onSaved(updated);
      } else {
        const res = await providerFetch<{ quote: Quote }>(
          `/api/provider/clients/${clientId}/quotes`,
          { method: "POST", body: JSON.stringify(payload) },
        );
        onSaved(res.quote);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save quote.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.editor}>
      <div className={styles.head}>
        <h3 className={styles.heading}>{quote ? "Edit quote" : "New quote"}</h3>
        <div className={styles.headActions}>
          <button type="button" className={styles.cancelBtn} onClick={onCancelled} disabled={saving}>
            Cancel
          </button>
          <button type="button" className={styles.saveBtn} onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="q-title">Title</label>
        <input
          id="q-title"
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New Quote"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="q-template">Template</label>
        <select
          id="q-template"
          className={styles.input}
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
        >
          <option value="">No template</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="q-notes">Internal notes</label>
        <textarea
          id="q-notes"
          className={styles.textarea}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="q-currency">Currency</label>
          <input
            id="q-currency"
            className={styles.input}
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={3}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="q-margin">Default margin %</label>
          <input
            id="q-margin"
            className={styles.input}
            type="number"
            value={defaultMarginPct}
            onChange={(e) => setDefaultMarginPct(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className={styles.groups}>
        {groups.map((g) => (
          <div key={g.groupId} className={styles.group}>
            <div className={styles.groupHead}>
              <input
                className={styles.groupTitle}
                value={g.title}
                onChange={(e) => updateGroup(g.groupId, { title: e.target.value })}
                placeholder="Group title"
              />
              <select
                className={styles.groupRole}
                value={g.role}
                onChange={(e) => updateGroup(g.groupId, { role: e.target.value as QuoteGroup["role"] })}
              >
                <option value="required">Required</option>
                <option value="optional">Optional</option>
                <option value="fixed">Fixed</option>
              </select>
              <button
                type="button"
                className={styles.removeGroupBtn}
                onClick={() => removeGroup(g.groupId)}
                aria-label="Remove group"
              >
                ×
              </button>
            </div>

            <input
              className={styles.groupDesc}
              value={g.description ?? ""}
              onChange={(e) => updateGroup(g.groupId, { description: e.target.value || null })}
              placeholder="Client-visible description (optional)"
            />

            <div className={styles.lines}>
              {g.lineItems.map((li) => (
                <div key={li.lineId} className={styles.line}>
                  <input
                    className={styles.lineLabel}
                    value={li.label}
                    onChange={(e) => updateLine(g.groupId, li.lineId, { label: e.target.value })}
                    placeholder="Line item"
                  />
                  <input
                    className={styles.lineAmount}
                    type="number"
                    value={li.amount}
                    onChange={(e) => updateLine(g.groupId, li.lineId, { amount: Number(e.target.value) || 0 })}
                    placeholder="Cost"
                  />
                  <select
                    className={styles.lineMode}
                    value={li.marginMode}
                    onChange={(e) =>
                      updateLine(g.groupId, li.lineId, { marginMode: e.target.value as "pct" | "flat" })
                    }
                  >
                    <option value="pct">%</option>
                    <option value="flat">Flat</option>
                  </select>
                  {li.marginMode === "pct" ? (
                    <input
                      className={styles.lineMargin}
                      type="number"
                      value={li.marginPct}
                      onChange={(e) => updateLine(g.groupId, li.lineId, { marginPct: Number(e.target.value) || 0 })}
                      placeholder="%"
                    />
                  ) : (
                    <input
                      className={styles.lineMargin}
                      type="number"
                      value={li.marginFlat ?? 0}
                      onChange={(e) => updateLine(g.groupId, li.lineId, { marginFlat: Number(e.target.value) || 0 })}
                      placeholder="Flat"
                    />
                  )}
                  <span className={styles.linePrice}>{money(lineClientPrice(li), li.currency || currency)}</span>
                  <button
                    type="button"
                    className={styles.removeLineBtn}
                    onClick={() => removeLine(g.groupId, li.lineId)}
                    aria-label="Remove line"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button type="button" className={styles.addLineBtn} onClick={() => addLine(g.groupId)}>
              + Add line
            </button>
          </div>
        ))}
      </div>

      <button type="button" className={styles.addGroupBtn} onClick={addGroup}>
        + Add group
      </button>

      <div className={styles.schedule}>
        <div className={styles.scheduleHead}>
          <span className={styles.scheduleTitle}>Payment schedule (%)</span>
          <span className={scheduleOver ? styles.scheduleOver : styles.scheduleSum}>
            {scheduleSum}%
          </span>
        </div>
        {paymentSchedule.map((p, i) => (
          <div key={i} className={styles.scheduleRow}>
            <span className={styles.scheduleIndex}>{i + 1}</span>
            <input
              className={styles.scheduleInput}
              type="number"
              value={p}
              onChange={(e) =>
                setPaymentSchedule((s) => s.map((v, idx) => (idx === i ? Number(e.target.value) || 0 : v)))
              }
            />
            <button
              type="button"
              className={styles.removeLineBtn}
              onClick={() => removeScheduleSegment(i)}
              aria-label="Remove segment"
            >
              ×
            </button>
          </div>
        ))}
        <button type="button" className={styles.addLineBtn} onClick={addScheduleSegment}>
          + Add segment
        </button>
      </div>

      <div className={styles.field}>
        <div className={styles.descHead}>
          <label className={styles.label} htmlFor="q-desc">Client description</label>
          {quote && (
            <button
              type="button"
              className={styles.generateBtn}
              onClick={generateDescription}
              disabled={generating}
            >
              {generating ? "Generating…" : "Generate with AI"}
            </button>
          )}
        </div>
        <textarea
          id="q-desc"
          className={styles.textarea}
          value={clientDescription}
          onChange={(e) => setClientDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className={styles.totals}>
        <span className={styles.totalLabel}>Cost</span>
        <span className={styles.totalValue}>{money(costSubtotal, currency)}</span>
        <span className={styles.totalLabel}>Client total</span>
        <span className={styles.totalValue}>{money(clientTotal, currency)}</span>
        <span className={styles.totalLabel}>Earnings</span>
        <span className={styles.totalValue}>{money(earnings, currency)}</span>
      </div>
    </div>
  );
}