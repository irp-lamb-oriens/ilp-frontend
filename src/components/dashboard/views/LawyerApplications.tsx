"use client";

import { useMemo, useState } from "react";
import { staffApi } from "@/lib/api";
import type { StreamedList } from "@/lib/useStreamedList";
import { Button, DataTable, Drawer, ListFooter, ListToolbar, Notice, Select, StatusPill, TextArea, type Column, type StatusTone } from "@/components/ui";
import { ErrorText } from "../staff/PageHeader";
import s from "./views.module.scss";

/** A provider doc in review, as GET /api/dashboard/providers/applications returns it (T2). */
export interface LawyerApplication {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  legalAreas?: string[];
  languages?: string[];
  bio?: string;
  status: "pending_review" | "changes_requested" | "declined";
  reviewNote?: string | null;
  createdAt?: string;
  application?: {
    submittedAt?: string;
    city?: string;
    province?: string;
    carne?: string;
    yearAdmitted?: number;
    notary?: boolean;
    notaryCarne?: string;
    firmName?: string;
    yearsInPractice?: number;
    otherArea?: string;
    areaComfort?: Record<string, string>;
    callsPerWeek?: number;
    minNoticeHours?: number;
    hourlyRateCents?: number;
    flatFeesCents?: Record<string, number>;
    quotePreference?: string;
    invoicingEntity?: string;
  };
}

const STATUS: Record<LawyerApplication["status"], { label: string; tone: StatusTone }> = {
  pending_review: { label: "Waiting for review", tone: "warning" },
  changes_requested: { label: "Changes requested", tone: "info" },
  declined: { label: "Declined", tone: "neutral" },
};

const FEE_LABEL: Record<string, string> = {
  residency: "Residency application",
  company_setup: "S.A. or S.R.L. set-up",
  property_review: "Property purchase review",
  vehicle_transfer: "Vehicle transfer",
  will: "Simple will",
};
const QUOTE_LABEL: Record<string, string> = { flat: "Flat fee", hourly: "Hourly with an estimate", either: "Depends on the job" };
const LANG_LABEL: Record<string, string> = { en: "English", es: "Spanish", fr: "French", de: "German", pt: "Portuguese", other: "Other" };

const usd = (c?: number) => (typeof c === "number" ? `US$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "Not given");
const day = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not given");
const areas = (a?: string[]) => (a ?? []).map((x) => x.replace(/_/g, " ")).join(", ") || "None";

type Action = "approve" | "request_changes" | "decline";

/**
 * Lawyer applications waiting for staff (T2). Open one to read it, then
 * Approve (activates the lawyer and emails a welcome), Request changes or
 * Decline (both need a note the lawyer reads). Each action is audited and
 * closes the review task.
 */
export function LawyerApplications({ list }: { list: StreamedList<LawyerApplication> }) {
  const onChanged = list.refresh;
  const [open, setOpen] = useState<LawyerApplication | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const columns = useMemo<Column<LawyerApplication>[]>(() => [
    { key: "name", header: "Lawyer", render: (a) => a.name ?? a.email ?? a.id, sortable: true, width: "wide" },
    { key: "areas", header: "Areas", render: (a) => areas(a.legalAreas), hideOnMobile: true },
    { key: "submittedAt", header: "Sent", render: (a) => day(a.application?.submittedAt ?? a.createdAt), sortable: true, hideOnMobile: true },
    { key: "status", header: "Status", render: (a) => <StatusPill size="sm" label={STATUS[a.status]?.label ?? a.status} tone={STATUS[a.status]?.tone ?? "neutral"} /> },
  ], []);

  function close() {
    setOpen(null);
    setAction(null);
    setNote("");
    setActionError(null);
  }

  async function run(a: Action) {
    if (!open) return;
    setBusy(true);
    setActionError(null);
    try {
      await staffApi.post(`/api/dashboard/providers/${encodeURIComponent(open.id)}/review`, { action: a, note });
      const who = open.name ?? open.email ?? "The lawyer";
      setDone(
        a === "approve"
          ? `${who} is approved. Members can book them now, and we emailed them.`
          : a === "decline"
          ? `${who}'s application is declined. We emailed them the reason.`
          : `We asked ${who} for changes by email.`,
      );
      close();
      onChanged();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "The review was not saved. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const app = open?.application ?? {};
  const fees = Object.entries(app.flatFeesCents ?? {});
  const canReview = open?.status === "pending_review" || open?.status === "changes_requested";

  return (
    <div className={s.stack}>
      {done && (
        <Notice tone="success" title="Review saved" dismissible onDismiss={() => setDone(null)}>
          {done}
        </Notice>
      )}
      <ListToolbar list={list} noun="applications" placeholder="Name, email or area">
        <Select label="Show" value={list.filters.status ?? ""} onChange={(e) => list.setFilter("status", e.target.value)}>
          <option value="">Waiting for review</option>
          <option value="all">All, including declined</option>
        </Select>
      </ListToolbar>
      <DataTable
        caption="Lawyer applications"
        columns={columns}
        rows={list.items}
        rowKey={(a) => a.id}
        loading={list.initialLoading}
        loadingMore={list.loadingMore}
        stale={list.stale}
        sort={list.sort}
        onSortChange={list.setSort}
        onRowActivate={(a) => {
          setDone(null);
          setOpen(a);
        }}
        empty={list.activeQuery ? "No application matches this search." : "No applications are waiting. New ones from the lawyers page appear here."}
      />
      <ListFooter list={list} audience="staff" />

      <Drawer
        open={!!open}
        onClose={close}
        size="lg"
        title={open?.name ?? "Application"}
        subtitle={open ? `${STATUS[open.status]?.label ?? open.status} · sent ${day(app.submittedAt ?? open.createdAt)}` : undefined}
        footer={
          open && canReview ? (
            action ? (
              <div className={s.stack}>
                {action !== "approve" && (
                  <TextArea
                    label={action === "decline" ? "Reason for declining" : "What should the lawyer change?"}
                    hint="The lawyer reads this in the email, so write it in plain words."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    required
                  />
                )}
                {actionError && <ErrorText>{actionError}</ErrorText>}
                <div className={s.row}>
                  <Button variant={action === "decline" ? "danger" : "primary"} busy={busy} onClick={() => void run(action)} disabled={action !== "approve" && note.trim().length < 5}>
                    {action === "approve" ? "Approve and email the lawyer" : action === "decline" ? "Decline and email the lawyer" : "Send the request"}
                  </Button>
                  <Button variant="ghost" onClick={() => setAction(null)} disabled={busy}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className={s.row}>
                <Button onClick={() => setAction("approve")}>Approve</Button>
                <Button variant="secondary" onClick={() => setAction("request_changes")}>
                  Request changes
                </Button>
                <Button variant="ghost" onClick={() => setAction("decline")}>
                  Decline
                </Button>
              </div>
            )
          ) : null
        }
      >
        {open && (
          <div className={s.stack}>
            {open.status === "changes_requested" && open.reviewNote && (
              <Notice tone="info" title="Changes requested">
                {open.reviewNote}
              </Notice>
            )}
            <Notice tone="neutral" title="Before you approve">
              Check the carné number with the Colegio de Abogados y Abogadas, and the notary number if there is one. Approving lets members book this lawyer at once.
            </Notice>
            <dl className={s.factList}>
              <div><dt>Email</dt><dd>{open.email ?? "Not given"}</dd></div>
              <div><dt>Mobile</dt><dd>{open.phone ?? "Not given"}</dd></div>
              <div><dt>Works in</dt><dd>{[app.city, app.province].filter(Boolean).join(", ") || "Not given"}</dd></div>
              <div><dt>Languages</dt><dd>{(open.languages ?? []).map((l) => LANG_LABEL[l] ?? l).join(", ") || "Not given"}</dd></div>
              <div><dt>Carné</dt><dd>{app.carne ?? "Not given"}{app.yearAdmitted ? `, admitted ${app.yearAdmitted}` : ""}</dd></div>
              <div><dt>Notary</dt><dd>{app.notary ? `Yes, number ${app.notaryCarne ?? "not given"}` : "No"}</dd></div>
              <div><dt>Firm</dt><dd>{[app.firmName, open.website].filter(Boolean).join(" · ") || "Works alone"}</dd></div>
              <div><dt>Years in practice</dt><dd>{app.yearsInPractice ?? "Not given"}</dd></div>
              <div><dt>Areas</dt><dd>{areas(open.legalAreas)}{app.otherArea ? ` (other: ${app.otherArea})` : ""}</dd></div>
              <div><dt>Calls a week</dt><dd>{app.callsPerWeek ?? "Not given"}, notice {app.minNoticeHours ?? "?"} hours (hours are on the Hours tab after approval)</dd></div>
              <div><dt>Hourly rate</dt><dd>{usd(app.hourlyRateCents)}</dd></div>
              {fees.length > 0 && (
                <div><dt>Flat fees</dt><dd>{fees.map(([k, c]) => `${FEE_LABEL[k] ?? k} ${usd(c)}`).join("; ")}</dd></div>
              )}
              <div><dt>Quotes</dt><dd>{QUOTE_LABEL[app.quotePreference ?? ""] ?? "Not given"}, invoiced by {app.invoicingEntity === "firm" ? "the firm" : "the lawyer"}</dd></div>
            </dl>
            <div>
              <h3 className={s.subhead}>Introduction for members</h3>
              <p className={s.bio}>{open.bio ?? "Not given"}</p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
