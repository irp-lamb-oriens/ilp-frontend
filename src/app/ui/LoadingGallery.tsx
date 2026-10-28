"use client";

import { useEffect, useState } from "react";
import CountUp from "@/components/motion/CountUp";
import {
  Button,
  Loadable,
  Skeleton,
  SkeletonBoard,
  SkeletonCard,
  SkeletonList,
  SkeletonRegion,
  SkeletonStatStrip,
  SkeletonTable,
  SkeletonTimeline,
  Stagger,
  StaggerItem,
  StatTile,
  StatusPill,
  type SkeletonSize,
  type StatusTone,
} from "@/components/ui";
import s from "./LoadingGallery.module.scss";

const usdFmt = (v: number) => `US$${(v / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pctFmt = (v: number) => `${v.toFixed(1)}%`;

const TASKS: Array<{ id: string; type: string; tone: StatusTone; title: string; member: string; due: string; dueTone: StatusTone }> = [
  { id: "t1", type: "Onboarding", tone: "info", title: "Welcome call and profile walkthrough", member: "Mariela Solís Vargas", due: "Today", dueTone: "warning" },
  { id: "t2", type: "Handoff", tone: "success", title: "Confirm next steps after residency call", member: "Daniel Whitford", due: "2 days late", dueTone: "danger" },
  { id: "t3", type: "Proposal", tone: "warning", title: "Follow up on corporation clean-up quote", member: "Karen Oduya", due: "Thu", dueTone: "neutral" },
  { id: "t4", type: "Document", tone: "neutral", title: "Missing: property title (Guanacaste)", member: "Esteban Quesada Mora", due: "Fri", dueTone: "neutral" },
];

const SIZES: SkeletonSize[] = ["xs", "sm", "md", "lg", "xl"];

/** /ui → Loading states: every skeleton, and the stagger with a replay. */
export default function LoadingGallery() {
  const [run, setRun] = useState(0);
  const [latency, setLatency] = useState(1200);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), latency);
    return () => window.clearTimeout(t);
  }, [run, latency]);

  const replay = (ms: number) => {
    setLoading(true);
    setLatency(ms);
    setRun((r) => r + 1);
  };

  return (
    <div className={s.wrap}>
      <div>
        <h3 className={s.h3}>Staggered reveal</h3>
        <p className={s.note}>
          A simulated load: the skeleton waits 150 ms before it shows, stays at least 300 ms, then the content fades and
          lifts in, 45 ms apart and capped at six steps. Figures count up once. With reduced motion the content simply
          fades in. The fast replay finishes inside the grace period, so no skeleton flashes.
        </p>
        <div className={s.controls}>
          <Button onClick={() => replay(1200)}>Replay (1.2 s load)</Button>
          <Button variant="secondary" onClick={() => replay(80)}>
            Replay (80 ms load)
          </Button>
        </div>
        <div className={s.demo} key={run}>
          <Loadable loading={loading} label="Loading the demo figures" skeleton={<SkeletonStatStrip className={s.strip} small={4} />}>
            <Stagger>
              <DemoTiles />
            </Stagger>
          </Loadable>
          <Loadable loading={loading} label="Loading the demo queue" skeleton={<SkeletonList rows={4} />}>
            <Stagger>
              <ul className={s.rows}>
                {TASKS.map((t, i) => (
                  <StaggerItem as="li" index={i + 1} key={t.id} className={s.rowItem}>
                    <StatusPill size="sm" label={t.type} tone={t.tone} />
                    <span className={s.rowText}>
                      <span className={s.rowTitle}>{t.title}</span>
                      <span className={s.rowSub}>{t.member}</span>
                    </span>
                    <StatusPill size="sm" label={t.due} tone={t.dueTone} srPrefix="Due" />
                  </StaggerItem>
                ))}
              </ul>
            </Stagger>
          </Loadable>
        </div>
      </div>

      <div>
        <h3 className={s.h3}>Skeleton shapes</h3>
        <p className={s.note}>
          Low-contrast gray that pulses toward white and back, on opacity only (static under reduced motion). Shapes are aria-hidden; the region around them carries
          aria-busy and a &ldquo;Loading …&rdquo; status for screen readers.
        </p>
        <SkeletonRegion label="Skeleton shapes example" className={s.shapes}>
          <div className={s.shapeCol}>
            {SIZES.map((size) => (
              <div key={size}>
                <span className={s.label}>line {size}</span>
                <Skeleton shape="line" size={size} width={size === "xl" ? "40" : "75"} />
              </div>
            ))}
          </div>
          <div className={s.shapeCol}>
            <span className={s.label}>circle xs to xl</span>
            <div className={s.shapeRow}>
              {SIZES.map((size) => (
                <Skeleton key={size} shape="circle" size={size} />
              ))}
            </div>
            <span className={s.label}>pill sm, md, lg</span>
            <div className={s.shapeRow}>
              <Skeleton shape="pill" size="sm" width="pill-sm" />
              <Skeleton shape="pill" size="md" />
              <Skeleton shape="pill" size="lg" width="pill-lg" />
            </div>
            <span className={s.label}>block sm (44 px), md, lg</span>
            <Skeleton shape="block" size="sm" />
            <Skeleton shape="block" size="md" />
            <Skeleton shape="block" size="lg" />
          </div>
        </SkeletonRegion>
      </div>

      <div>
        <h3 className={s.h3}>Layouts</h3>
        <p className={s.note}>
          Each mirrors the real component and accepts the page&apos;s own layout class, so the placeholder holds the
          exact grid of the content that replaces it.
        </p>
        <SkeletonRegion label="Skeleton layouts example" className={s.stack}>
          <div>
            <span className={s.label}>SkeletonStatStrip</span>
            <SkeletonStatStrip small={4} />
          </div>
          <div className={s.compositions}>
            <div className={s.stack}>
              <div>
                <span className={s.label}>SkeletonList (queue)</span>
                <SkeletonList rows={3} />
              </div>
              <div>
                <span className={s.label}>SkeletonList (calls, time-led)</span>
                <SkeletonList rows={2} lead="time" trail="pills" variant="spaced" />
              </div>
              <div>
                <span className={s.label}>SkeletonTable (columns hide below 768 px)</span>
                <SkeletonTable
                  columns={[
                    { header: "Member", width: "wide" },
                    { header: "Membership" },
                    { header: "Minutes used", hideOnMobile: true, align: "end" },
                    { header: "Renews", hideOnMobile: true },
                  ]}
                  rows={4}
                />
              </div>
            </div>
            <div className={s.stack}>
              <div>
                <span className={s.label}>SkeletonCard</span>
                <SkeletonCard badge figure lines={1} action />
              </div>
              <div>
                <span className={s.label}>SkeletonTimeline</span>
                <SkeletonTimeline items={3} />
              </div>
            </div>
          </div>
          <div>
            <span className={s.label}>SkeletonBoard</span>
            <SkeletonBoard cards={[3, 2, 1, 1]} />
          </div>
        </SkeletonRegion>
      </div>
    </div>
  );
}

function DemoTiles() {
  return (
    <section aria-label="Demo key figures" className={s.strip}>
      <StaggerItem index={0} className={s.tileCell}>
        <StatTile size="lg" label="Monthly recurring revenue" value={<CountUp value={383952} formatter={usdFmt} />} delta="+US$79.99 since yesterday" trend="up" hint="48 active members × US$79.99" />
      </StaggerItem>
      <StaggerItem index={1} className={s.tileCell}>
        <StatTile label="Month-3 retention" value={<CountUp value={83.3} formatter={pctFmt} />} hint="25 of 30 · target 80%" />
      </StaggerItem>
      <StaggerItem index={2} className={s.tileCell}>
        <StatTile label="Consultation-ready" value={<CountUp value={68.4} formatter={pctFmt} />} hint="33 of 48 active members" />
      </StaggerItem>
      <StaggerItem index={3} className={s.tileCell}>
        <StatTile label="Handoffs confirmed in 24 h" value={<CountUp value={96.7} formatter={pctFmt} />} hint="29 of 30 · target 100%" />
      </StaggerItem>
      <StaggerItem index={4} className={s.tileCell}>
        <StatTile label="Overdue open tasks" value={<CountUp value={7} />} upIsGood={false} hint="3 yours" />
      </StaggerItem>
    </section>
  );
}
