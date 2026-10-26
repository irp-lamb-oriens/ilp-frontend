"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { staffApi } from "@/lib/api";
import { PROFILE_FIELDS, PROFILE_SECTIONS, type Handoff, type ProfileSection } from "@/lib/contracts";
import { ButtonLink, Drawer, ProgressBar, StatusPill, Timeline, type TimelineItem } from "@/components/ui";
import { PageHeader, ErrorText, Muted } from "../staff/PageHeader";
import { dueLabel, MEMBERSHIP_LABEL, MEMBERSHIP_TONE, memberName } from "../staff/format";
import type { MemberBundle, QueueTask, TimelineEntry } from "../staff/types";
import { useLawyers } from "../staff/useLawyers";
import { TaskDrawer } from "../today/TaskDrawer";
import { MemberDocumentsList } from "@/components/documents/MemberDocumentsList";
import { CallsPanel, type StaffCall } from "./CallsPanel";
import { HandoffReview } from "./HandoffReview";
import { MembershipPanel } from "./MembershipPanel";
import { NextActions } from "./NextActions";
import s from "./member.module.scss";

const SECTION_LABEL: Record<ProfileSection, string> = {
  identity: "Identity",
  household: "Household",
  immigration: "Immigration",
  property: "Property",
  company: "Company",
  vehicle: "Vehicle",
};

const FIELD_LABEL: Record<string, string> = {
  fullName: "Full name",
  email: "Email",
  phone: "Phone",
  nationality: "Nationality",
  dateOfBirth: "Date of birth",
  maritalStatus: "Marital status",
  dependents: "Dependents",
  residencyStatus: "Residency",
  residencyExpiresAt: "Residency expires",
  ownsProperty: "Owns property",
  propertyLocation: "Property location",
  hasCompany: "Has a company",
  companyType: "Company type",
  ownsVehicle: "Owns a vehicle",
};

type Kind = TimelineEntry["kind"];
const KINDS: Array<{ id: Kind | "all"; label: string }> = [
  { id: "all", label: "Everything" },
  { id: "consultation", label: "Calls" },
  { id: "handoff", label: "Handoffs" },
  { id: "task", label: "Tasks" },
  { id: "quote", label: "Quotes" },
  { id: "note", label: "Notes" },
  { id: "audit", label: "Audit" },
];

function show(v: unknown): string {
  if (v === true) return "Yes";
  if (v === false) return "No";
  if (v === undefined || v === null || v === "") return "Missing";
  const t = typeof v === "string" ? Date.parse(v) : NaN;
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) && !Number.isNaN(t)) return new Date(t).toLocaleDateString("en-US", { dateStyle: "medium" });
  return String(v);
}

/** Full-page member record: profile left, one timeline centre, next actions right. */
export default function MemberPage({ clientId }: { clientId: string }) {
  const [bundle, setBundle] = useState<MemberBundle | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<Kind | "all">("all");
  const [handoff, setHandoff] = useState<Handoff | null>(null);
  const [task, setTask] = useState<QueueTask | null>(null);
  const { nameOf } = useLawyers();

  const load = useCallback(() => {
    Promise.all([
      staffApi.get<MemberBundle>(`/api/staff/members/${encodeURIComponent(clientId)}`),
      staffApi.get<{ items: TimelineEntry[] }>(`/api/dashboard/staff/members/${encodeURIComponent(clientId)}/timeline`),
    ])
      .then(([b, t]) => {
        setBundle(b);
        setTimeline(t.items);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "This member could not be loaded."));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  // ?handoff=<id> opens the handoff review straight away.
  useEffect(() => {
    if (!bundle || typeof window === "undefined") return;
    const id = new URLSearchParams(window.location.search).get("handoff");
    if (id) setHandoff(bundle.handoffs.find((h) => h.id === id) ?? null);
  }, [bundle]);

  const name = memberName(bundle?.client ?? null, clientId);
  const profile = useMemo(() => {
    const c = (bundle?.client ?? {}) as Record<string, unknown>;
    return { ...((c.clientFields as Record<string, unknown>) ?? {}), ...c } as Record<string, unknown>;
  }, [bundle]);

  const items: TimelineItem[] = (timeline ?? [])
    .filter((e) => kind === "all" || e.kind === kind)
    .map((e) => {
      const h = e.kind === "handoff" ? bundle?.handoffs.find((x) => x.id === e.ref) : undefined;
      return {
        id: e.id,
        at: e.at,
        actor: e.actor,
        tone: e.tone,
        title: h ? (
          <button type="button" className={s.linkBtn} onClick={() => setHandoff(h)}>
            {e.title}
          </button>
        ) : (
          e.title
        ),
        body: e.body,
        meta: <StatusPill size="sm" label={KINDS.find((k) => k.id === e.kind)?.label ?? e.kind} />,
      };
    });

  if (error) {
    return (
      <>
        <PageHeader title="Member" actions={<ButtonLink href="/dashboard/members" variant="secondary">All members</ButtonLink>} />
        <ErrorText>{error}</ErrorText>
      </>
    );
  }
  if (!bundle) return <Muted>Loading member…</Muted>;

  const m = bundle.membership;
  const openTasks = bundle.tasks.filter((t) => t.status === "open");

  return (
    <>
      <PageHeader
        title={name}
        sub={[String(bundle.client?.email ?? ""), String(bundle.client?.persona ?? "")].filter(Boolean).join(" · ")}
        actions={
          <>
            {m && <StatusPill label={MEMBERSHIP_LABEL[m.status]} tone={MEMBERSHIP_TONE[m.status]} srPrefix="Membership" />}
            <ButtonLink href="/dashboard/members" variant="secondary">
              All members
            </ButtonLink>
          </>
        }
      />

      <div className={s.layout}>
        <div className={s.col}>
          <section className={s.block} aria-label="Profile">
            <h2 className={s.blockTitle}>Living profile</h2>
            <ProgressBar
              label={bundle.completeness.consultationReady ? "Complete · consultation-ready" : "Complete · not ready yet (70% needed)"}
              value={bundle.completeness.score}
              tone={bundle.completeness.consultationReady ? "success" : "warning"}
            />
            <ul className={s.sections}>
              {PROFILE_SECTIONS.map((sec) => (
                <li key={sec} className={s.sectionRow}>
                  <span>{SECTION_LABEL[sec]}</span>
                  <span className={bundle.completeness.bySection[sec] < 1 ? s.missing : undefined}>
                    {Math.round(bundle.completeness.bySection[sec] * 100)}%
                  </span>
                </li>
              ))}
            </ul>
            <dl className={s.facts}>
              {PROFILE_SECTIONS.flatMap((sec) => PROFILE_FIELDS[sec]).map((f) => (
                <div key={f}>
                  <dt>{FIELD_LABEL[f] ?? f}</dt>
                  <dd className={show(profile[f]) === "Missing" ? s.missing : undefined}>{show(profile[f])}</dd>
                </div>
              ))}
            </dl>
          </section>
          <MembershipPanel membership={m} onChanged={load} />
          <MemberDocumentsList
            clientId={clientId}
            role="staff"
            matterTitle={(id) => bundle.matters.find((x) => x.id === id)?.title}
          />
        </div>

        <div className={s.col}>
          {bundle.nextStep && (
            <div className={s.nextStep}>
              <p className={s.label}>Member&apos;s next step</p>
              <p className={s.nextWhat}>{bundle.nextStep.what}</p>
              <p className={s.meta}>
                {bundle.nextStep.who === "client" ? "Member" : bundle.nextStep.who === "lawyer" ? "Lawyer" : "ILP"} · {dueLabel(bundle.nextStep.dueAt).text}
              </p>
            </div>
          )}
          <section className={s.block} aria-label="Timeline">
            <h2 className={s.blockTitle}>Timeline</h2>
            <div className={s.timelineFilter} role="group" aria-label="Filter timeline">
              {KINDS.map((k) => (
                <button key={k.id} type="button" className={s.chip} aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
                  {k.label}
                </button>
              ))}
            </div>
            <Timeline items={items} emptyLabel="Nothing recorded for this filter yet." />
          </section>
        </div>

        <div className={s.col}>
          <NextActions
            bundle={bundle}
            openTasks={openTasks}
            onOpenTask={(t) => setTask({ ...t, memberName: name, membershipStatus: m?.status ?? null })}
            onChanged={load}
          />
          <CallsPanel calls={bundle.consultations as StaffCall[]} lawyerName={nameOf} onChanged={load} />
        </div>
      </div>

      <Drawer
        open={!!handoff}
        onClose={() => setHandoff(null)}
        size="lg"
        title="Handoff review"
        subtitle={handoff ? `${name} · ${nameOf(handoff.providerId)}` : undefined}
      >
        {handoff && (
          <HandoffReview
            handoff={handoff}
            consultation={bundle.consultations.find((c) => c.id === handoff.consultationId)}
            lawyerName={nameOf(handoff.providerId)}
            proposalTask={bundle.tasks.find((t) => t.type === "proposal" && t.status === "open" && t.source.id === handoff.id) ?? null}
            onChanged={load}
          />
        )}
      </Drawer>

      <TaskDrawer
        task={task}
        onClose={() => setTask(null)}
        onClosed={() => {
          setTask(null);
          load();
        }}
        onChanged={load}
      />
    </>
  );
}
