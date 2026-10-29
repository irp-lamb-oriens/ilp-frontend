"use client";

import { useMemo } from "react";
import { FUNNEL_STEPS, type FunnelStepId, type JourneyFunnelRow, type JourneyStuck } from "@/lib/contracts";
import { Skeleton, SkeletonStatStrip, SkeletonTable, StatTile, useSkeleton } from "@/components/ui";
import { ErrorText } from "../staff/PageHeader";
import { Bar } from "./charts";
import { getFunnel, getStuck } from "./journeysApi";
import { Panel, SampleNotice } from "./JourneysFrame";
import { biggestLeaks, count, formatMs, pct, stepLabel } from "./model";
import { useJourneyData, useJourneyFilters } from "./useJourneys";
import s from "./journeys.module.scss";

const STAGE_LABEL = { acquire: "Find", activate: "Free account", convert: "Become a member", retain: "Stay" } as const;
const stageOf = (id: string) => FUNNEL_STEPS.find((x) => x.id === id)?.stage;

function rowOf(rows: JourneyFunnelRow[], id: FunnelStepId) {
  return rows.find((r) => r.step === id);
}

const ratio = (a?: JourneyFunnelRow, b?: JourneyFunnelRow) => (a && b && a.visitors > 0 ? b.visitors / a.visitors : null);

/** Sum of the median time of each step from `from` (exclusive) to `to` (inclusive). */
function medianBetween(rows: JourneyFunnelRow[], from: FunnelStepId, to: FunnelStepId): number | null {
  const i = rows.findIndex((r) => r.step === from);
  const j = rows.findIndex((r) => r.step === to);
  if (i < 0 || j <= i) return null;
  let total = 0;
  for (let k = i + 1; k <= j; k++) {
    const m = rows[k].medianMsFromPrev;
    if (m === null) return null;
    total += m;
  }
  return total;
}

/**
 * Overview: how many people reach each step, where they drop off, how long
 * each step takes, inbound next to outbound, and the three leaks worth
 * fixing first, in plain words.
 */
export default function OverviewView() {
  const { query, queryKey } = useJourneyFilters();
  const funnel = useJourneyData(() => getFunnel(query), queryKey);
  const stuck = useJourneyData(() => getStuck(query), queryKey);
  const sk = useSkeleton(funnel.loading && !funnel.data);
  const rows = useMemo(() => funnel.data?.rows ?? [], [funnel.data]);
  const leaks = useMemo(() => biggestLeaks(rows, (stuck.data?.steps ?? []) as JourneyStuck[]), [rows, stuck.data]);

  if (funnel.error && !funnel.data) return <ErrorText onRetry={funnel.retry}>The funnel could not be loaded. {funnel.error}</ErrorText>;
  if (sk.showSkeleton || !funnel.data) return sk.skeletonVisible ? <OverviewSkeleton /> : null;

  const first = rows[0];
  const checkStart = rowOf(rows, "check_start");
  const account = rowOf(rows, "account_created");
  const member = rowOf(rows, "activation_paid");
  const firstCall = rowOf(rows, "call_done");
  const maxDrop = Math.max(1, ...rows.map((r) => r.dropOff));
  const empty = !first || first.visitors === 0;

  return (
    <div className={s.stack}>
      <SampleNotice show={funnel.sample} />
      <div className={s.kpis} data-tour="staff-journeys-kpis">
        <StatTile size="lg" label="Visitors" value={count(first?.visitors ?? 0)} hint="People who opened a public ILP page and allowed measurement." />
        <StatTile label="Check to account" value={pct(ratio(checkStart, account))} hint={`${count(account?.visitors ?? 0)} of ${count(checkStart?.visitors ?? 0)} who started the check`} />
        <StatTile label="Account to member" value={pct(ratio(account, member))} hint={`${count(member?.visitors ?? 0)} paid the activation fee`} />
        <StatTile label="Member to first call" value={pct(ratio(member, firstCall))} hint={`${count(firstCall?.visitors ?? 0)} had a call`} />
        <StatTile label="Median time to member" value={formatMs(medianBetween(rows, "check_start", "activation_paid"))} hint="From starting the check, adding the median time of each step." />
      </div>

      {empty ? (
        <Panel title="No visits in these dates" id="j-empty">
          <p className={s.panelSub}>Nobody who allowed measurement opened a public page in this range with these filters. Try a longer range or clear the filters.</p>
        </Panel>
      ) : (
        <>
          <div className={s.split}>
            <Panel
              id="j-funnel"
              title="Member funnel"
              sub="Each row counts the people who reached that step. The bar is the share of everyone who started; the columns show the share kept from the step before, the people lost and the median time the step took."
            >
              <FunnelTable rows={rows} />
            </Panel>
            <div className={s.stack}>
              <Panel id="j-leaks" title="Biggest leaks" sub="The three steps that lose the most future members. A person lost close to paying counts for more than one lost on the homepage.">
                {leaks.length ? (
                  <ol className={s.leaks} data-tour="staff-journeys-leaks">
                    {leaks.map((l) => (
                      <li key={`${l.from}-${l.to}`} className={s.leak}>
                        <div>
                          <p className={s.leakText}>{l.text}</p>
                          <p className={s.leakMeta}>
                            {stepLabel(l.from)} to {stepLabel(l.to)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className={s.panelSub}>No step lost anyone in this range.</p>
                )}
              </Panel>
              <Panel id="j-drop" title="Drop-off by step" sub="People who reached the step before and stopped. Longest bar first.">
                <div className={s.scroll}>
                  <table className={s.table}>
                    <caption>Drop-off by step</caption>
                    <thead>
                      <tr>
                        <th scope="col">Stopped before</th>
                        <th scope="col" className={s.barCell}>
                          <span className={s.sr}>Bar</span>
                        </th>
                        <th scope="col" className={s.num}>
                          People
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...rows]
                        .filter((r) => r.dropOff > 0)
                        .sort((a, b) => b.dropOff - a.dropOff)
                        .slice(0, 6)
                        .map((r) => (
                          <tr key={r.step}>
                            <td>{r.label}</td>
                            <td className={s.barCell}>
                              <Bar value={r.dropOff / maxDrop} tone="soft" />
                            </td>
                            <td className={s.num}>{count(r.dropOff)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>
          </div>
          <Panel
            id="j-sources"
            title="Inbound and outbound side by side"
            sub="Inbound people found ILP on their own. Outbound people were contacted by ILP first (outreach email, imported lead or CSM call). Shares are from each group's own first step."
          >
            <SourceCompare inbound={funnel.data.bySource.inbound ?? []} outbound={funnel.data.bySource.outbound ?? []} />
          </Panel>
        </>
      )}
    </div>
  );
}

export function FunnelTable({ rows }: { rows: JourneyFunnelRow[] }) {
  return (
    <div className={s.scroll}>
      <table className={s.table}>
        <caption>Member funnel by step</caption>
        <thead>
          <tr>
            <th scope="col">Step</th>
            <th scope="col" className={s.barCell}>
              Share of start
            </th>
            <th scope="col" className={s.num}>
              People
            </th>
            <th scope="col" className={s.num}>
              From previous
            </th>
            <th scope="col" className={`${s.num} ${s.hideMd}`}>
              Lost
            </th>
            <th scope="col" className={`${s.num} ${s.hideMd}`}>
              Median time
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.step}>
              <td className={s.stepCell}>
                <span className={s.stepName}>{r.label}</span>
                {(i === 0 || stageOf(r.step) !== stageOf(rows[i - 1].step)) && stageOf(r.step) && <span className={s.stageTag}>{STAGE_LABEL[stageOf(r.step)!]}</span>}
              </td>
              <td className={s.barCell}>
                <Bar value={r.conversionFromStart} tone={r.step === "activation_paid" ? "accent" : "navy"} />
              </td>
              <td className={s.num}>
                {count(r.visitors)}
                <span className={s.sr}>, {pct(r.conversionFromStart)} of the start</span>
              </td>
              <td className={s.num}>{i === 0 ? "Start" : pct(r.conversionFromPrev)}</td>
              <td className={`${s.num} ${s.loss} ${s.hideMd}`}>{i === 0 ? "None" : count(r.dropOff)}</td>
              <td className={`${s.num} ${s.hideMd}`}>{i === 0 ? "None" : formatMs(r.medianMsFromPrev)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SourceCompare({ inbound, outbound }: { inbound: JourneyFunnelRow[]; outbound: JourneyFunnelRow[] }) {
  const ob = new Map(outbound.map((r) => [r.step, r]));
  return (
    <div className={s.scroll}>
      <ul className={s.legend} aria-hidden="true">
        <li className={s.key}>
          <svg className={s.keySwatch} viewBox="0 0 14 8">
            <rect className={s.barFill} width="14" height="8" />
          </svg>
          Inbound
        </li>
        <li className={s.key}>
          <svg className={s.keySwatch} viewBox="0 0 14 8">
            <rect className={s.barAccent} width="14" height="8" />
          </svg>
          Outbound
        </li>
      </ul>
      <table className={s.table}>
        <caption>Inbound and outbound funnels</caption>
        <thead>
          <tr>
            <th scope="col">Step</th>
            <th scope="col" className={s.num}>
              Inbound
            </th>
            <th scope="col" className={s.barCell}>
              Inbound share
            </th>
            <th scope="col" className={s.num}>
              Outbound
            </th>
            <th scope="col" className={s.barCell}>
              Outbound share
            </th>
          </tr>
        </thead>
        <tbody>
          {inbound.map((r) => {
            const o = ob.get(r.step);
            return (
              <tr key={r.step}>
                <td>{r.label}</td>
                <td className={s.num}>
                  {count(r.visitors)} ({pct(r.conversionFromStart)})
                </td>
                <td className={s.barCell}>
                  <Bar value={r.conversionFromStart} />
                </td>
                <td className={s.num}>{o ? `${count(o.visitors)} (${pct(o.conversionFromStart)})` : "None"}</td>
                <td className={s.barCell}>
                  <Bar value={o?.conversionFromStart ?? 0} tone="accent" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <div className={s.stack} aria-hidden="true">
      <SkeletonStatStrip small={4} />
      <div className={s.split}>
        <SkeletonTable columns={[{ header: "Step", width: "wide" }, { header: "Share of start", width: "wide" }, { header: "People", align: "end" }, { header: "From previous", align: "end" }]} rows={10} />
        <div className={s.sk}>
          <Skeleton shape="line" size="lg" width="60" />
          <Skeleton shape="line" size="md" width="90" />
          <Skeleton shape="line" size="md" width="90" />
          <Skeleton shape="line" size="md" width="75" />
        </div>
      </div>
    </div>
  );
}
