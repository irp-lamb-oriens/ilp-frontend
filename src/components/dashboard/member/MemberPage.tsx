"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { staffApi } from "@/lib/api";
import { PROFILE_FIELDS, PROFILE_SECTIONS, type Handoff, type ProfileSection } from "@/lib/contracts";
import { ButtonLink, Drawer, ListFooter, ProgressBar, SearchInput, SkeletonRegion, SkeletonTimeline, Stagger, StaggerItem, StatusPill, Timeline, useSkeleton, type TimelineItem } from "@/components/ui";
import { apiListSource } from "@/lib/listSource";
import { useStreamedList } from "@/lib/useStreamedList";
import { PageHeader, ErrorText } from "../staff/PageHeader";
import { IntroTitleContext, ScreenIntro } from "../staff/ScreenIntro";
import { STAFF_INTROS } from "../staff/intros";
import { dueLabel, MEMBERSHIP_LABEL, MEMBERSHIP_TONE, memberName } from "../staff/format";
import type { MemberBundle, QueueTask, TimelineEntry } from "../staff/types";
import { useLawyers } from "../staff/useLawyers";
import { TaskDrawer } from "../today/TaskDrawer";
import { MemberDocumentsList } from "@/components/documents/MemberDocumentsList";
import { MemberOpportunities } from "../opportunities/MemberOpportunities";
import { CallsPanel } from "./CallsPanel";
import { HandoffReview } from "./HandoffReview";
import { MembershipPanel } from "./MembershipPanel";
import { JoinAnswers } from "./JoinAnswers";
import { NextActions } from "./NextActions";
import MemberSkeleton from "./MemberSkeleton";
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
  const [error, setError] = useState<string | null>(null);
  // Timeline: newest first, a page at a time, filtered and searched on the server.
  const timelineSource = useMemo(
    () => apiListSource<TimelineEntry>(staffApi, `/api/dashboard/staff/members/${encodeURIComponent(clientId)}/timeline`),
    [clientId],
  );
  const timeline = useStreamedList<TimelineEntry>(timelineSource, {
    key: `staff-timeline-${clientId}`,
    pageSize: 30,
    sort: { key: "at", dir: "desc" },
    keyOf: (e) => e.id,
  });
  const kind = (timeline.filters.kind || "all") as Kind | "all";
  const setKind = (k: Kind | "all") => timeline.setFilter("kind", k === "all" ? "" : k);
  const refreshTimeline = timeline.refresh;
  const [handoff, setHandoff] = useState<Handoff | null>(null);
  const [task, setTask] = useState<QueueTask | null>(null);
  const { nameOf } = useLawyers();
  const { showSkeleton, skeletonVisible } = useSkeleton(!bundle && !error);

  const loadBundle = useCallback(() => {
    staffApi
      .get<MemberBundle>(`/api/staff/members/${encodeURIComponent(clientId)}`)
      .then(setBundle)
      .catch((e) => setError(e instanceof Error ? e.message : "This member could not be loaded."));
  }, [clientId]);
  const load = useCallback(() => {
    loadBundle();
    refreshTimeline();
  }, [loadBundle, refreshTimeline]);

  useEffect(() => {
    loadBundle();
  }, [loadBundle]);

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

  const items: TimelineItem[] = timeline.items
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
        <StaggerItem>
          <ErrorText>{error}</ErrorText>
        </StaggerItem>
      </>
    );
  }
  if (showSkeleton || !bundle) {
    return (
      <SkeletonRegion label="Loading member" visible={skeletonVisible}>
        <MemberSkeleton />
      </SkeletonRegion>
    );
  }

  const m = bundle.membership;
  const openTasks = bundle.tasks.filter((t) => t.status === "open");

  const ready = bundle.completeness.consultationReady;
  return (
    <Stagger>
      <ScreenIntro intro={STAFF_INTROS.member} title={name} storageKey="/dashboard/members/[id]" />
      <IntroTitleContext.Provider value={true}>
        <PageHeader
          sub={[String(bundle.client?.email ?? ""), String(bundle.client?.persona ?? "")].filter(Boolean).join(" · ") || undefined}
          title={name}
          actions={
            <>
              {bundle.client?.placeholder === true && <StatusPill label="Placeholder" tone="warning" />}
              <ButtonLink href="/dashboard/members" variant="secondary">
                All members
              </ButtonLink>
            </>
          }
        />
      </IntroTitleContext.Provider>

      <dl className={s.glance} aria-label="This member at a glance">
        <div className={s.glanceItem}>
          <dt>Membership</dt>
          <dd>{m ? <StatusPill size="sm" label={MEMBERSHIP_LABEL[m.status]} tone={MEMBERSHIP_TONE[m.status]} /> : "No membership"}</dd>
        </div>
        <div className={s.glanceItem}>
          <dt>Profile</dt>
          <dd>
            <span className={s.glanceValue}>{Math.round(bundle.completeness.score * 100)}%</span>{" "}
            <StatusPill size="sm" label={ready ? "Ready" : "Not ready"} tone={ready ? "success" : "warning"} />
          </dd>
        </div>
        <div className={s.glanceItem}>
          <dt>Minutes left</dt>
          <dd>
            <span className={s.glanceValue}>{bundle.minutesLeft}</span> of {m?.minutesIncluded ?? 60}
          </dd>
        </div>
        <div className={s.glanceItem}>
          <dt>Calls left</dt>
          <dd>
            <span className={s.glanceValue}>{bundle.callsLeft}</span> of {m?.callsIncluded ?? 3}
          </dd>
        </div>
        <div className={s.glanceItem}>
          <dt>Open tasks</dt>
          <dd>
            <span className={s.glanceValue}>{openTasks.length}</span>
          </dd>
        </div>
      </dl>

      <div className={s.layout}>
        <div className={s.col}>
          <StaggerItem as="section" index={0} className={s.block} aria-label="Profile" data-tour="staff-member-head">
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
          </StaggerItem>
          <StaggerItem index={1}>
            <JoinAnswers membership={m} profile={profile} />
          </StaggerItem>
          <StaggerItem index={2}>
            <MembershipPanel membership={m} onChanged={load} />
          </StaggerItem>
          <StaggerItem index={4}>
            <MemberDocumentsList
              clientId={clientId}
              role="staff"
              matterTitle={(id) => bundle.matters.find((x) => x.id === id)?.title}
            />
          </StaggerItem>
        </div>

        <div className={s.col}>
          {bundle.nextStep && (
            <StaggerItem index={1} className={s.nextStep}>
              <p className={s.label}>Member&apos;s next step</p>
              <p className={s.nextWhat}>{bundle.nextStep.what}</p>
              <p className={s.meta}>
                {bundle.nextStep.who === "client" ? "Member" : bundle.nextStep.who === "lawyer" ? "Lawyer" : "ILP"} · {dueLabel(bundle.nextStep.dueAt).text}
              </p>
            </StaggerItem>
          )}
          <StaggerItem as="section" index={2} className={s.block} aria-label="Timeline" data-tour="staff-member-timeline">
            <h2 className={s.blockTitle}>Timeline</h2>
            <div className={s.timelineFilter} role="group" aria-label="Filter timeline">
              {KINDS.map((k) => (
                <button key={k.id} type="button" className={s.chip} aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
                  {k.label}
                </button>
              ))}
            </div>
            <SearchInput label="Search the timeline" hideLabel value={timeline.query} onValueChange={timeline.setQuery} placeholder="Search the timeline" />
            {timeline.initialLoading ? (
              <SkeletonTimeline />
            ) : (
              <div aria-busy={timeline.stale || undefined} className={timeline.stale ? s.stale : undefined}>
                <Timeline items={items} emptyLabel={timeline.activeQuery ? "Nothing in the timeline matches this search." : "Nothing recorded for this filter yet."} />
              </div>
            )}
            <ListFooter list={timeline} audience="staff" auto={false} loadMoreLabel="Show older events" endLabel={null} skeleton={<SkeletonTimeline />} />
          </StaggerItem>
        </div>

        <div className={s.col}>
          <StaggerItem index={1}>
            <NextActions
              bundle={bundle}
              openTasks={openTasks}
              onOpenTask={(t) => setTask({ ...t, memberName: name, membershipStatus: m?.status ?? null })}
              onChanged={load}
            />
          </StaggerItem>
          <StaggerItem index={3}>
            <CallsPanel calls={bundle.consultations} lawyerName={nameOf} onChanged={load} />
          </StaggerItem>
          <StaggerItem index={4}>
            <MemberOpportunities bundle={bundle} />
          </StaggerItem>
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
    </Stagger>
  );
}
