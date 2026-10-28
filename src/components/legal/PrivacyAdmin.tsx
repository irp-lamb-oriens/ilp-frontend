"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, DataTable, Drawer, FilterBar, ListFooter, Notice, StatusPill, useUnsavedChanges, type Column, type StatusTone } from "@/components/ui";
import { apiListSource } from "@/lib/listSource";
import { LIST_SCHEMAS } from "@/lib/listSchemas";
import { LOCAL_SCHEMAS } from "@/lib/localListSchemas";
import { useSchemaList } from "@/lib/useSchemaList";
import { ApiError, downloadFile, staffApi } from "@/lib/api";
import { DownloadButton } from "@/components/documents/DownloadButton";
import type { PrivacyRequest } from "@/lib/contracts";
import { ErrorText, Muted, PageHeader } from "@/components/dashboard/staff/PageHeader";
import { AdminOnly, useStaff } from "@/components/dashboard/staff/StaffSession";
import s from "./PrivacyAdmin.module.scss";

type Row = PrivacyRequest & { memberName: string; overdue: boolean; staffNote?: string };

interface PlanLine {
  collection: string;
  action: "delete" | "anonymize" | "keep" | "pseudonymize_email";
  count: number;
  why: string;
}

interface Plan {
  blocker: string | null;
  lines: PlanLine[];
  manualSteps: string[];
  email: string;
}

const KIND: Record<PrivacyRequest["kind"], string> = {
  access: "Access",
  export: "Export",
  rectify: "Correction",
  delete: "Deletion",
  restrict: "Objection",
};

const STATUS: Record<PrivacyRequest["status"], [string, StatusTone]> = {
  received: ["Received", "info"],
  in_review: ["In review", "warning"],
  completed: ["Completed", "success"],
  refused: ["Refused", "danger"],
};

const ACTION: Record<PlanLine["action"], string> = {
  delete: "Delete",
  anonymize: "Anonymize",
  keep: "Keep",
  pseudonymize_email: "Hash email",
};

const day = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

/** /dashboard/privacy: process members' privacy requests (admin only, P6). */
export default function PrivacyAdmin() {
  return (
    <AdminOnly what="Privacy administration">
      <PrivacyRequests />
    </AdminOnly>
  );
}

const requestsSource = apiListSource<Row>(staffApi, "/api/dashboard/privacy/requests");

function PrivacyRequests() {
  const { email } = useStaff();
  const sl = useSchemaList<Row>({
    schema: LIST_SCHEMAS.privacyRequests,
    key: "staff-privacy-requests",
    source: requestsSource,
    pageSize: 25,
    baseFilters: { status: "open" },
    defaultSort: { key: "dueAt", dir: "asc" },
    keyOf: (r) => r.id,
    viewer: email,
  });
  const list = sl.list;
  const all = list.filters.status === "all";
  // Picking a status in the filters means closed requests may be wanted too.
  const statusPicked = !!sl.filterState.status;
  const { setFilter } = list;
  useEffect(() => {
    if (statusPicked) setFilter("status", "all");
  }, [statusPicked, setFilter]);
  const [open, setOpen] = useState<Row | null>(null);

  const columns = useMemo<Column<Row>[]>(() => [
    { key: "memberName", header: "Member" },
    { key: "email", header: "Email", render: (r) => r.email, hideOnMobile: true },
    { key: "kind", header: "Request", render: (r) => KIND[r.kind] },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusPill label={STATUS[r.status][0]} tone={STATUS[r.status][1]} size="sm" />,
    },
    { key: "createdAt", header: "Received", render: (r) => day(r.createdAt), sortable: true, hideOnMobile: true },
    {
      key: "dueAt",
      header: "Answer by",
      render: (r) => (r.overdue ? <StatusPill label={`Overdue · ${day(r.dueAt)}`} tone="danger" size="sm" /> : day(r.dueAt)),
      sortable: true,
    },
  ], []);

  return (
    <div className={s.page}>
      <PageHeader
        title="Privacy requests"
        sub={all ? "Showing open and closed requests." : "Showing open requests."}
        actions={
          <Button variant="ghost" size="sm" onClick={() => list.setFilter("status", all ? "open" : "all")} aria-pressed={all}>
            {all ? "Show open only" : "Show closed too"}
          </Button>
        }
      />
      <FilterBar list={sl} noun="requests" searchLabel="Search requests" placeholder="Reference, email or kind" columns={columns.map((c) => ({ key: c.key, header: c.header }))} />
      <DataTable
        caption="Privacy requests"
        columns={sl.visibleColumns(columns)}
        rows={list.items}
        loading={list.initialLoading}
        loadingMore={list.loadingMore}
        stale={list.stale}
        sort={list.sort}
        onSortChange={list.setSort}
        rowKey={(r) => r.id}
        onRowActivate={setOpen}
        selectedKey={open?.id ?? null}
        empty={<Muted>{list.activeQuery || sl.activeCount ? "No request matches these filters." : all ? "No privacy requests yet." : "No open privacy requests."}</Muted>}
      />
      <ListFooter list={list} audience="staff" />
      {open && (
        <RequestDrawer
          row={open}
          onClose={() => setOpen(null)}
          onChanged={async () => {
            setOpen(null);
            list.refresh();
          }}
        />
      )}
    </div>
  );
}

function RequestDrawer({ row, onClose, onChanged }: { row: Row; onClose: () => void; onChanged: () => Promise<void> }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [confirm, setConfirm] = useState("");
  const [result, setResult] = useState<{ lines: PlanLine[]; manualSteps: string[]; fileErrors: number } | null>(null);
  const [sentNote, setSentNote] = useState("");
  useUnsavedChanges(note.trim() !== "" && note.trim() !== sentNote, "The note on this request is not saved yet. If you close now, it will be lost.");
  const openState = row.status === "received" || row.status === "in_review";

  async function setStatus(status: "in_review" | "completed" | "refused") {
    setBusy(status);
    setError(null);
    try {
      await staffApi.post(`/api/dashboard/privacy/requests/${encodeURIComponent(row.id)}/status`, { status, note: note.trim() });
      setSentNote(note.trim());
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save.");
    } finally {
      setBusy(null);
    }
  }

  async function loadPlan() {
    setBusy("plan");
    setError(null);
    try {
      setPlan(await staffApi.get<Plan>(`/api/dashboard/privacy/requests/${encodeURIComponent(row.id)}/plan`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load the deletion plan.");
    } finally {
      setBusy(null);
    }
  }

  async function erase() {
    setBusy("erase");
    setError(null);
    try {
      setResult(await staffApi.post(`/api/dashboard/privacy/requests/${encodeURIComponent(row.id)}/erase`, { confirmEmail: confirm.trim() }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Deletion failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Drawer open onClose={onClose} title={`${KIND[row.kind]} request`} subtitle={`${row.memberName} · answer by ${day(row.dueAt)}`} size="lg">
      <div className={s.body}>
        <dl className={s.facts}>
          <div>
            <dt>Reference</dt>
            <dd>{row.id}</dd>
          </div>
          <div>
            <dt>Received</dt>
            <dd>{day(row.createdAt)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{STATUS[row.status][0]}</dd>
          </div>
          {row.note && (
            <div>
              <dt>Member wrote</dt>
              <dd className={s.note}>{row.note}</dd>
            </div>
          )}
          {row.staffNote && (
            <div>
              <dt>Answer</dt>
              <dd className={s.note}>{row.staffNote}</dd>
            </div>
          )}
        </dl>

        {openState && (
          <Notice
            tone="warning"
            title="Confirm it is really the member before you act"
            terms={["privacyRequest", "personalData"]}
            fix={{
              summary: "Someone else could ask for a member's data. Check first, every time.",
              steps: [
                "Reply to the request from your ILP email, sent to the email address on the member's account (not one typed in the request).",
                "Wait for the member to answer from that address, or call them on the phone number in their profile.",
                "Write how you checked in the answer box, for example: Confirmed by reply from the account email on 27 Oct.",
                "Only then mark the request in review and complete it.",
              ],
              tutorialId: "staff.privacy",
              tutorialStep: "answer",
            }}
          >
            Reply from the account email or call the member first.
          </Notice>
        )}

        <p className={s.text}>
          The member can download their own data from their portal; for an access request you can also send this file:{" "}
          <DownloadButton
            className={s.inlineLink}
            download={() =>
              downloadFile("staff", `/api/dashboard/privacy/members/${encodeURIComponent(row.clientId)}/export`, `ilp-member-data-${row.clientId}.json`)
            }
          >
            member data (JSON)
          </DownloadButton>
          .
        </p>

        {openState && row.kind !== "delete" && (
          <div className={s.form}>
            <label htmlFor="privacy-note" className={s.label}>
              Answer to the member (emailed when you complete or refuse)
            </label>
            <textarea id="privacy-note" className={s.textarea} rows={4} value={note} onChange={(e) => setNote(e.target.value)} />
            <div className={s.actions}>
              {row.status === "received" && (
                <Button variant="ghost" busy={busy === "in_review"} onClick={() => setStatus("in_review")}>
                  Mark in review
                </Button>
              )}
              <Button busy={busy === "completed"} onClick={() => setStatus("completed")}>
                Complete
              </Button>
              <Button variant="danger" busy={busy === "refused"} onClick={() => setStatus("refused")}>
                Refuse
              </Button>
            </div>
          </div>
        )}

        {openState && row.kind === "delete" && !result && (
          <div className={s.form}>
            {!plan ? (
              <div className={s.actions}>
                <Button variant="secondary" busy={busy === "plan"} onClick={loadPlan}>
                  Show what will be deleted
                </Button>
                {row.status === "received" && (
                  <Button variant="ghost" busy={busy === "in_review"} onClick={() => setStatus("in_review")}>
                    Mark in review
                  </Button>
                )}
              </div>
            ) : (
              <>
                {plan.blocker && <ErrorText>{plan.blocker}</ErrorText>}
                <PlanTable lines={plan.lines} />
                <h3 className={s.h3}>After the deletion, by hand</h3>
                <ul className={s.list}>
                  {plan.manualSteps.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
                <label htmlFor="privacy-confirm" className={s.label}>
                  Type the member&apos;s email ({plan.email}) to run the deletion
                </label>
                <input id="privacy-confirm" className={s.input} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
                <div className={s.actions}>
                  <Button
                    variant="danger"
                    busy={busy === "erase"}
                    disabled={!!plan.blocker || confirm.trim().toLowerCase() !== plan.email}
                    onClick={erase}
                  >
                    Run deletion
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {result && (
          <div className={s.form} role="status">
            <h3 className={s.h3}>Deletion done</h3>
            {result.fileErrors > 0 && (
              <ErrorText>{result.fileErrors} stored file(s) could not be deleted. Run the deletion again later to retry them.</ErrorText>
            )}
            <PlanTable lines={result.lines} />
            <h3 className={s.h3}>Now do by hand</h3>
            <ul className={s.list}>
              {result.manualSteps.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <div className={s.actions}>
              <Button onClick={onChanged}>Close</Button>
            </div>
          </div>
        )}

        {error && <ErrorText>{error}</ErrorText>}
      </div>
    </Drawer>
  );
}

function PlanTable({ lines }: { lines: PlanLine[] }) {
  // FILTERS: the deletion matrix, searched and filtered by action (it lists every collection).
  const sl = useSchemaList<PlanLine>({
    schema: LOCAL_SCHEMAS.privacyPlan,
    key: "staff-privacy-plan",
    rows: lines,
    pageSize: 50,
    keyOf: (l) => l.collection,
  });
  const columns = useMemo<Column<PlanLine>[]>(() => [
    { key: "collection", header: "Collection", render: (l) => <span title={l.why}>{l.collection}</span>, sortable: true, width: "wide" },
    { key: "action", header: "Action", render: (l) => ACTION[l.action] },
    { key: "count", header: "Records", render: (l) => (l.action === "keep" ? "kept" : l.count), sortable: true, align: "end" },
    { key: "why", header: "Why", render: (l) => l.why, hideOnMobile: true },
  ], []);
  return (
    <div className={s.planTable}>
      <FilterBar list={sl} noun="collections" searchLabel="Search the deletion matrix" placeholder="Collection or reason" compact columns={columns.map((c) => ({ key: c.key, header: c.header }))} />
      <DataTable
        caption="Deletion matrix"
        columns={sl.visibleColumns(columns)}
        rows={sl.list.items}
        rowKey={(l) => l.collection}
        sort={sl.list.sort}
        onSortChange={sl.list.setSort}
        empty="No collection matches these filters."
      />
      <ListFooter list={sl.list} audience="staff" auto={false} endLabel={null} />
    </div>
  );
}
