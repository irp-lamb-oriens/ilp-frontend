"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, DataTable, Drawer, StatusPill, type Column, type StatusTone } from "@/components/ui";
import { ApiError, downloadFile, staffApi } from "@/lib/api";
import { DownloadButton } from "@/components/documents/DownloadButton";
import type { PrivacyRequest } from "@/lib/contracts";
import { ErrorText, Muted, PageHeader } from "@/components/dashboard/staff/PageHeader";
import { AdminOnly } from "@/components/dashboard/staff/StaffSession";
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
    <AdminOnly>
      <PrivacyRequests />
    </AdminOnly>
  );
}

function PrivacyRequests() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [all, setAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Row | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await staffApi.get<{ items: Row[] }>("/api/dashboard/privacy/requests", { query: { status: all ? "all" : "open" } });
      setRows(r.items);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load requests.");
    }
  }, [all]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<Row>[] = [
    { key: "memberName", header: "Member", sortValue: (r) => r.memberName },
    { key: "kind", header: "Request", render: (r) => KIND[r.kind], sortValue: (r) => r.kind },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusPill label={STATUS[r.status][0]} tone={STATUS[r.status][1]} size="sm" />,
      sortValue: (r) => r.status,
    },
    { key: "createdAt", header: "Received", render: (r) => day(r.createdAt), sortValue: (r) => r.createdAt, hideOnMobile: true },
    {
      key: "dueAt",
      header: "Answer by",
      render: (r) => (r.overdue ? <StatusPill label={`Overdue · ${day(r.dueAt)}`} tone="danger" size="sm" /> : day(r.dueAt)),
      sortValue: (r) => r.dueAt,
    },
  ];

  return (
    <div className={s.page}>
      <PageHeader
        title="Privacy requests"
        sub="Access, correction, objection and deletion requests from members, with their legal answer date."
        actions={
          <Button variant="ghost" size="sm" onClick={() => setAll((v) => !v)} aria-pressed={all}>
            {all ? "Show open only" : "Show closed too"}
          </Button>
        }
      />
      {error && <ErrorText>{error}</ErrorText>}
      <DataTable
        caption="Privacy requests"
        columns={columns}
        rows={rows ?? []}
        loading={rows === null}
        rowKey={(r) => r.id}
        onRowActivate={setOpen}
        selectedKey={open?.id ?? null}
        defaultSort={{ key: "dueAt", dir: "asc" }}
        empty={<Muted>No open privacy requests.</Muted>}
      />
      {open && (
        <RequestDrawer
          row={open}
          onClose={() => setOpen(null)}
          onChanged={async () => {
            setOpen(null);
            await load();
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
  const openState = row.status === "received" || row.status === "in_review";

  async function setStatus(status: "in_review" | "completed" | "refused") {
    setBusy(status);
    setError(null);
    try {
      await staffApi.post(`/api/dashboard/privacy/requests/${encodeURIComponent(row.id)}/status`, { status, note: note.trim() });
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

        <p className={s.text}>
          Confirm the member&apos;s identity before acting (reply from the account email, or a call). The member can
          download their own data from their portal; for an access request you can also send this file:{" "}
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
  return (
    <table className={s.table}>
      <caption className={s.caption}>Deletion matrix</caption>
      <thead>
        <tr>
          <th scope="col">Collection</th>
          <th scope="col">Action</th>
          <th scope="col" className={s.num}>
            Records
          </th>
        </tr>
      </thead>
      <tbody>
        {lines.map((l) => (
          <tr key={l.collection}>
            <th scope="row" title={l.why}>
              {l.collection}
            </th>
            <td>{ACTION[l.action]}</td>
            <td className={s.num}>{l.action === "keep" ? "kept" : l.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
