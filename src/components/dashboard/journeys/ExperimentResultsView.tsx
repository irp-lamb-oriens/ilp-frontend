"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Experiment, ExperimentResult } from "@/lib/contracts";
import { Button, Dialog, Notice, RadioGroup, Skeleton, SkeletonTable, StatusPill, Toast, useSkeleton } from "@/components/ui";
import { ErrorText, SectionHead } from "../staff/PageHeader";
import { useStaff } from "../staff/StaffSession";
import { CiBar } from "./charts";
import ExperimentDialog from "./ExperimentDialog";
import { experimentAction, getExperiment, getExperimentResults } from "./journeysApi";
import { Panel, SampleNotice } from "./JourneysFrame";
import {
  EXPERIMENT_STATUS_LABEL,
  EXPERIMENT_STATUS_TONE,
  SURFACES,
  canEditExperiments,
  count,
  experimentActions,
  experimentVerdict,
  pct,
  signedPct,
  stepLabel,
  visitorsNeeded,
} from "./model";
import { useJourneyData } from "./useJourneys";
import s from "./journeys.module.scss";

type Action = "start" | "pause" | "end" | "winner";

const CONFIRM: Record<Action, { title: string; body: string; label: string }> = {
  start: { title: "Start this test?", body: "Visitors who allowed measurement start seeing the versions at once, in the shares you set. Each visitor keeps the same version.", label: "Start the test" },
  pause: { title: "Pause this test?", body: "Everyone sees the control again until you start it again. Results so far are kept.", label: "Pause the test" },
  end: { title: "End this test?", body: "Everyone sees the control again and the result is frozen. A test that has ended cannot be started again.", label: "End the test" },
  winner: { title: "Record the winning version", body: "This records the decision with the test. It does not change the site: a developer makes the winning version the default.", label: "Record the winner" },
};

/** One experiment: its read in plain words, each version's numbers, the 95% intervals and the guardrails. */
export default function ExperimentResultsView({ id }: { id: string }) {
  const staff = useStaff();
  const canEdit = canEditExperiments(staff.role);
  const [n, setN] = useState(0);
  const exp = useJourneyData(() => getExperiment(id), `${id}:${n}`);
  const res = useJourneyData(() => getExperimentResults(id), `${id}:${n}`);
  const sk = useSkeleton((exp.loading && !exp.data) || (res.loading && !res.data));
  const [confirm, setConfirm] = useState<Action | null>(null);
  const [winner, setWinner] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "danger" } | null>(null);

  async function run(a: Action) {
    setBusy(true);
    try {
      await experimentAction(id, a, a === "winner" ? winner : undefined);
      setToast({ tone: "success", message: a === "start" ? "The test is running." : a === "pause" ? "The test is paused." : a === "end" ? "The test has ended." : "The winner is recorded." });
      setConfirm(null);
      setN((x) => x + 1);
    } catch (e) {
      setToast({ tone: "danger", message: e instanceof Error ? e.message : "That did not work. Try again." });
    } finally {
      setBusy(false);
    }
  }

  const back = (
    <Link href="/dashboard/journeys/experiments" className={s.back}>
      ← All experiments
    </Link>
  );
  if (exp.error && !exp.data) return <>{back}<ErrorText onRetry={exp.retry}>This experiment could not be loaded. {exp.error}</ErrorText></>;
  if (sk.showSkeleton || !exp.data) return sk.skeletonVisible ? <ResultsSkeleton /> : null;
  const e = exp.data;
  const actions = canEdit ? experimentActions(e.status) : [];

  return (
    <div className={s.stack}>
      <div>
        {back}
        <SectionHead
          title={e.name}
          sub={
            <>
              <StatusPill size="sm" label={EXPERIMENT_STATUS_LABEL[e.status]} tone={EXPERIMENT_STATUS_TONE[e.status]} /> Key {e.key}
            </>
          }
          actions={
            actions.length ? (
              <div className={s.actions}>
                {actions.includes("edit") && <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>}
                {actions.includes("start") && <Button onClick={() => setConfirm("start")}>{e.status === "paused" ? "Start again" : "Start"}</Button>}
                {actions.includes("pause") && <Button variant="secondary" onClick={() => setConfirm("pause")}>Pause</Button>}
                {actions.includes("end") && <Button variant="secondary" onClick={() => setConfirm("end")}>End</Button>}
                {actions.includes("winner") && <Button onClick={() => { setWinner(e.winner ?? ""); setConfirm("winner"); }}>{e.winner ? "Change the winner" : "Declare a winner"}</Button>}
              </div>
            ) : undefined
          }
        />
      </div>
      <SampleNotice show={exp.sample || res.sample} />
      <dl className={s.meta}>
        <div><dt>Hypothesis</dt><dd>{e.hypothesis}</dd></div>
        <div><dt>Where</dt><dd>{SURFACES.find((x) => x.value === e.surface)?.label ?? e.surface}</dd></div>
        <div><dt>Success step</dt><dd>{stepLabel(e.primaryStep)}</dd></div>
        <div><dt>Who sees it</dt><dd>{e.audience === "all" ? "Everyone" : e.audience === "inbound" ? "Inbound visitors" : "Outbound visitors"}</dd></div>
        {e.winner && <div><dt>Winner</dt><dd>{e.variants.find((v) => v.key === e.winner)?.name ?? e.winner}</dd></div>}
      </dl>

      {res.error && !res.data ? (
        <ErrorText onRetry={res.retry}>The results could not be loaded. {res.error}</ErrorText>
      ) : res.data ? (
        <Results e={e} r={res.data} />
      ) : null}

      {confirm && (
        <Dialog
          open
          role="alertdialog"
          onClose={() => setConfirm(null)}
          title={CONFIRM[confirm].title}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirm(null)} disabled={busy}>Cancel</Button>
              <Button onClick={() => void run(confirm)} busy={busy} disabled={confirm === "winner" && !winner}>{CONFIRM[confirm].label}</Button>
            </>
          }
        >
          <p>{CONFIRM[confirm].body}</p>
          {confirm === "winner" && (
            <RadioGroup label="Winning version" name="winner" value={winner} onChange={setWinner} options={e.variants.map((v) => ({ value: v.key, label: `${v.key}: ${v.name}` }))} />
          )}
        </Dialog>
      )}
      {canEdit && <ExperimentDialog open={editing} experiment={e} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); setN((x) => x + 1); }} />}
      <Toast message={toast?.message ?? null} tone={toast?.tone} onDismiss={() => setToast(null)} />
    </div>
  );
}

function Results({ e, r }: { e: Experiment; r: ExperimentResult }) {
  const vs = r.variants;
  const control = vs[0];
  const [min, max] = useMemo(() => {
    const lo = Math.min(...vs.map((v) => v.ci95[0]));
    const hi = Math.max(...vs.map((v) => v.ci95[1]));
    const pad = (hi - lo) * 0.15 || 0.01;
    return [Math.max(0, lo - pad), Math.min(1, hi + pad)];
  }, [vs]);
  const leader = [...vs].sort((a, b) => b.probabilityBest - a.probabilityBest)[0];
  const more = visitorsNeeded(r);
  const guardSteps = e.guardrailSteps ?? [];

  return (
    <>
      <Panel id="x-read" title="What the data says so far" sub="Based on visitors who saw a version and allowed measurement. A test is read once every version has enough visitors.">
        <p className={s.verdict} role="status">{experimentVerdict(r)}</p>
      </Panel>
      {r.srmWarning && (
        <Notice
          tone="warning"
          title="The versions did not get the shares you set"
          terms={["srm"]}
          fix={{
            summary: "This is called a sample ratio mismatch. Until it is fixed, the result cannot be trusted.",
            steps: [
              "Check the shares on this test. If someone changed them while it ran, end it and start a new test.",
              "Ask a developer whether one version loads slower, breaks on some phones or is cached by the browser, so fewer visits are counted.",
              "Check that both versions send the same steps: a version that skips the step that records the visit is undercounted.",
              "Once the cause is fixed, end this test and start a new one. Do not pick a winner from this one.",
            ],
          }}
        >
          The split between the versions is further from your shares than chance would explain.
        </Notice>
      )}
      {!r.enoughData && more > 0 && (
        <Notice tone="info" title={`Needs about ${count(more)} more visitors per version`}>
          To spot a 20% change in the success rate with confidence, each version needs about {count(r.sampleSizeNeeded)} visitors. Until then, treat any lead as a hint.
        </Notice>
      )}
      <Panel id="x-versions" title="Each version" sub="Rate is the share of visitors who reached the success step. The line shows the range the true rate is likely in (95% interval); the dashed line is the control's rate. Ranges that overlap a lot mean the difference may be chance.">
        <div className={s.scroll}>
          <table className={s.table}>
            <caption>Results by version</caption>
            <thead>
              <tr>
                <th scope="col">Version</th>
                <th scope="col" className={s.num}>Visitors</th>
                <th scope="col" className={s.num}>Reached {stepLabel(e.primaryStep).toLowerCase()}</th>
                <th scope="col" className={s.num}>Rate</th>
                <th scope="col" className={s.num}>Change vs control</th>
                <th scope="col" className={s.num}>Chance to be best</th>
                <th scope="col" className={s.barCell}>95% interval</th>
              </tr>
            </thead>
            <tbody>
              {vs.map((v, i) => (
                <tr key={v.key}>
                  <td className={s.stepCell}>
                    <span className={s.stepName}>{v.key}: {v.name}</span>
                    {i === 0 && <span className={s.stageTag}>Control</span>}
                  </td>
                  <td className={s.num}>{count(v.visitors)}</td>
                  <td className={s.num}>{count(v.conversions)}</td>
                  <td className={s.num}>{pct(v.rate)}</td>
                  <td className={s.num}>{i === 0 ? "Control" : signedPct(v.liftVsControl)}</td>
                  <td className={s.num}>{pct(v.probabilityBest)}</td>
                  <td className={s.barCell}>
                    <CiBar lo={v.ci95[0]} hi={v.ci95[1]} rate={v.rate} min={min} max={max} control={i === 0 ? null : control.rate} accent={v.key === leader.key && i !== 0} />
                    <span className={s.whoSub}>{pct(v.ci95[0])} to {pct(v.ci95[1])}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {guardSteps.length > 0 && (
        <Panel id="x-guard" title="Guardrails" sub="Steps that must not get worse. A version that wins on the success step but loses here may cost members.">
          <div className={s.scroll}>
            <table className={s.table}>
              <caption>Guardrail rates by version</caption>
              <thead>
                <tr>
                  <th scope="col">Step</th>
                  {vs.map((v) => <th key={v.key} scope="col" className={s.num}>{v.key}: {v.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {guardSteps.map((g) => (
                  <tr key={g}>
                    <td>{stepLabel(g)}</td>
                    {vs.map((v) => {
                      const rate = v.guardrails?.find((x) => x.step === g)?.rate;
                      return <td key={v.key} className={s.num}>{rate === undefined ? "None yet" : pct(rate)}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </>
  );
}

function ResultsSkeleton() {
  return (
    <div className={s.stack} aria-hidden="true">
      <Skeleton shape="line" size="sm" width="15" />
      <Skeleton shape="line" size="xl" width="40" />
      <Skeleton shape="line" size="md" width="75" />
      <SkeletonTable columns={[{ header: "Version", width: "wide" }, { header: "Visitors", align: "end" }, { header: "Rate", align: "end" }, { header: "Chance to be best", align: "end" }, { header: "95% interval", width: "wide" }]} rows={2} />
    </div>
  );
}
