"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button, EmptyState, ErrorNotice, Notice, Skeleton, SkeletonRegion, StatusPill, useSkeleton } from "@/components/ui";
import { COUNTRIES } from "@/lib/contracts";
import { AREA_LABEL_OF, groupSpecialties, routingApi, type Coverage } from "@/lib/routing";
import s from "./routing.module.scss";

/**
 * Staff: which country × specialty pairs have a lawyer. A cell counts active,
 * verified lawyers who take that exact specialty; "area" means only lawyers
 * covering its wider area (the router accepts them, with a lower score).
 * Empty cells are where a member would wait, so they are marked in words.
 */
export function CoverageView() {
  const [data, setData] = useState<Coverage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [onlyGaps, setOnlyGaps] = useState(false);

  const load = useCallback(() => {
    setError(null);
    routingApi.coverage().then(setData).catch((e) => setError(e instanceof Error ? e.message : "Coverage could not be loaded."));
  }, []);
  useEffect(load, [load]);

  async function retry() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await routingApi.sweep();
      setMsg(r.resolved ? `${r.resolved} waiting member${r.resolved === 1 ? "" : "s"} now ${r.resolved === 1 ? "has" : "have"} a lawyer. ${r.open} still waiting.` : `No new match. ${r.open} member${r.open === 1 ? "" : "s"} still waiting.`);
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Routing could not run.");
    } finally {
      setBusy(false);
    }
  }

  const sk = useSkeleton(!data && !error);
  if (error) return <ErrorNotice audience="staff" variant="block" title="Coverage did not load" onRetry={load}>{error}</ErrorNotice>;
  if (sk.showSkeleton || !data) {
    return (
      <SkeletonRegion label="Loading coverage" visible={sk.skeletonVisible}>
        <Skeleton shape="block" size="lg" />
      </SkeletonRegion>
    );
  }

  const countries = data.countries;
  const cell = (c: string, id: string) => data.cells[c]?.[id] ?? { exact: 0, areaOnly: 0 };
  const isGap = (id: string, applies: (c: string) => boolean) => countries.some((c) => applies(c) && cell(c, id).exact === 0 && cell(c, id).areaOnly === 0);
  const groups = groupSpecialties(data.specialties)
    .map((g) => ({ ...g, items: g.items.filter((sp) => !onlyGaps || isGap(sp.id, (c) => !sp.countries.length || sp.countries.includes(c as never))) }))
    .filter((g) => g.items.length);

  return (
    <div className={s.stack}>
      {data.gaps.length > 0 ? (
        <Notice
          tone="warning"
          title={`${data.gaps.length} member${data.gaps.length === 1 ? " is" : "s are"} waiting for a lawyer`}
          terms={["partnerLawyer"]}
          fix={{
            summary: "Nobody passes the router's checks for these members. They were told we are arranging their lawyer, and a short sales call is set up.",
            steps: [
              "Open the member below to read why no lawyer matched.",
              "Add the missing specialty to a lawyer who takes it (Capacity, then Profile on their row), or approve a new lawyer licensed in that country.",
              "Press Try routing again. Members who now match are assigned and emailed to book their call.",
              "If nobody fits soon, assign a lawyer by hand from the member's page.",
            ],
          }}
          actions={<Button variant="secondary" busy={busy} onClick={retry}>Try routing again</Button>}
        >
          <ul className={s.gapList}>
            {data.gaps.map((g) => (
              <li key={g.id}>
                <Link href={`/dashboard/members/${encodeURIComponent(g.clientId)}`}>{COUNTRIES[g.country]?.name ?? g.country} · {data.specialties.find((x) => x.id === g.specialtyId)?.label ?? AREA_LABEL_OF[g.area ?? ""] ?? "General"}</Link>
                <span className={s.meta}> since {g.createdAt.slice(0, 10)}. {g.reason}</span>
              </li>
            ))}
          </ul>
        </Notice>
      ) : (
        <p className={s.note}>No member is waiting for a lawyer right now.{data.placeholderGaps ? ` (${data.placeholderGaps} seed member${data.placeholderGaps === 1 ? "" : "s"} waiting in demo data.)` : ""}</p>
      )}
      {msg && <p className={s.ok} role="status">{msg}</p>}
      <div className={s.bar}>
        <Button variant="secondary" size="sm" onClick={() => setOnlyGaps((v) => !v)} aria-pressed={onlyGaps}>
          {onlyGaps ? "Show every specialty" : "Show only gaps"}
        </Button>
        <span className={s.meta}>Numbers are active, verified lawyers who take the exact specialty. &quot;Area&quot; means only lawyers who cover the wider area.</span>
      </div>
      {groups.length === 0 ? (
        <EmptyState compact title="No gaps" body="Every specialty has at least one lawyer in every country where it applies." />
      ) : (
        <div className={s.matrixWrap} role="region" aria-label="Coverage by country and specialty" tabIndex={0}>
          <table className={s.matrix}>
            <caption className={s.sr}>Lawyers per specialty and country</caption>
            <thead>
              <tr>
                <th scope="col">Specialty</th>
                {countries.map((c) => <th key={c} scope="col">{COUNTRIES[c].name}</th>)}
              </tr>
            </thead>
            {groups.map((g) => (
              <tbody key={g.group}>
                <tr className={s.groupRow}><th colSpan={countries.length + 1} scope="colgroup">{g.label}</th></tr>
                {g.items.map((sp) => (
                  <tr key={sp.id}>
                    <th scope="row">{sp.label}</th>
                    {countries.map((c) => {
                      const applies = !sp.countries.length || sp.countries.includes(c);
                      const v = cell(c, sp.id);
                      return (
                        <td key={c}>
                          {!applies ? <span className={s.meta}>n/a</span>
                            : v.exact > 0 ? <span className={s.count}>{v.exact}</span>
                            : v.areaOnly > 0 ? <StatusPill size="sm" tone="neutral" label={`Area ${v.areaOnly}`} />
                            : <StatusPill size="sm" tone="warning" label="None" />}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      )}
    </div>
  );
}
