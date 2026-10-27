"use client";

import { useEffect, useState } from "react";
import PortalLogin from "@/components/auth/PortalLogin";
import { DEFAULT_NAV, NotificationBell, RoleShell, type NavItem, type ShellRole } from "@/components/shell";
import {
  AgingBadge,
  Button,
  Card,
  DataTable,
  Drawer,
  EmptyState,
  ProgressBar,
  StatTile,
  StatusPill,
  Tabs,
  Timeline,
  type Column,
  type StatusTone,
} from "@/components/ui";
import { chartSeries } from "@/styles/tokens";
import FormsGallery from "./FormsGallery";
import ScheduleGallery from "./ScheduleGallery";
import GuardGallery from "./GuardGallery";
import LoadingGallery from "./LoadingGallery";
import TutorialsGallery from "./TutorialsGallery";
import NoticeGallery from "./NoticeGallery";
import { ACTIVITY, MEMBERS, NOW, formatDate, type MemberRow } from "./sampleData";
import s from "./UiGallery.module.scss";

const SECTIONS = [
  ["buttons", "Button"],
  ["cards", "Card"],
  ["stats", "StatTile"],
  ["status", "StatusPill and AgingBadge"],
  ["progress", "ProgressBar"],
  ["table", "DataTable and Drawer"],
  ["timeline", "Timeline"],
  ["tabs", "Tabs"],
  ["empty", "EmptyState"],
  ["notices", "Notice"],
  ["forms", "Form fields"],
  ["schedule", "Time and schedule"],
  ["guard", "Dialog and unsaved changes"],
  ["tokens", "Chart tokens"],
  ["loading", "Loading states"],
  ["shell", "RoleShell"],
  ["login", "PortalLogin"],
  ["tutorials", "Tutorials"],
] as const;

const MEMBERSHIP_PILL: Record<MemberRow["status"], { label: string; tone: StatusTone }> = {
  active: { label: "Active", tone: "success" },
  past_due: { label: "Past due", tone: "danger" },
  pending: { label: "Activation pending", tone: "warning" },
};

const COLUMNS: Column<MemberRow>[] = [
  { key: "name", header: "Member", sortValue: (r) => r.name, render: (r) => <strong>{r.name}</strong> },
  { key: "matter", header: "Matter", sortValue: (r) => r.matter, hideOnMobile: true },
  {
    key: "stage",
    header: "In stage",
    sortValue: (r) => Date.parse(r.stageEnteredAt),
    render: (r) => <AgingBadge since={r.stageEnteredAt} now={NOW} />,
  },
  {
    key: "profile",
    header: "Profile",
    align: "end",
    sortValue: (r) => r.profile,
    render: (r) => `${Math.round(r.profile * 100)}%`,
    hideOnMobile: true,
  },
  { key: "minutes", header: "Min left", align: "end", sortValue: (r) => r.minutesLeft, render: (r) => r.minutesLeft },
  {
    key: "status",
    header: "Membership",
    sortValue: (r) => r.status,
    render: (r) => <StatusPill {...MEMBERSHIP_PILL[r.status]} size="sm" />,
  },
];

/** Demo nav: first item points at /ui so it shows as active; others are anchors. */
function demoNav(role: ShellRole): NavItem[] {
  return DEFAULT_NAV[role].map((item, i) => ({
    ...item,
    href: i === 0 ? "/ui" : `#${role}-${item.label.toLowerCase()}`,
    match: i === 0 ? "exact" : "prefix",
    badge: role === "staff" && i === 0 ? 6 : role === "lawyer" && i === 0 ? 3 : undefined,
  }));
}

const SHELL_DEMO: Record<ShellRole, { title: string; user: { name: string; email: string; title: string } }> = {
  staff: {
    title: "Today",
    user: { name: "Mariela Solís", email: "mariela.solis@ilp.legal", title: "Customer Success Manager" },
  },
  lawyer: {
    title: "Today",
    user: { name: "Andrea Vargas Mora", email: "avargas@vargasmora.cr", title: "Partner lawyer · Corporate" },
  },
  client: {
    title: "Overview",
    user: { name: "Karen Whitfield", email: "karen.whitfield@gmail.com", title: "Member since Oct 23, 2026" },
  },
};

function ShellBody({ role }: { role: ShellRole }) {
  if (role === "staff") {
    return (
      <div className={s.shellGrid}>
        <Card title="My queue" actions={<StatusPill label="6 open" tone="info" size="sm" />}>
          <ul className={s.queue}>
            <li>
              <span>Welcome call and profile review · Robert Haskins</span>
              <StatusPill label="Due tomorrow" tone="neutral" size="sm" />
            </li>
            <li>
              <span>Follow up on open proposal · Linda Okafor</span>
              <StatusPill label="Overdue 1 day" tone="danger" size="sm" />
            </li>
            <li>
              <span>Send next steps and confirm · Karen Whitfield</span>
              <StatusPill label="Due today" tone="warning" size="sm" />
            </li>
          </ul>
        </Card>
        <Card title="Needs attention" tone="mist">
          <p className={s.small}>3 deadlines inside 14 days · 1 quote unanswered for 6 days</p>
        </Card>
      </div>
    );
  }
  if (role === "lawyer") {
    return (
      <Card title="Next call · 10:40 with Karen Whitfield" actions={<StatusPill label="Recording consent given" tone="success" size="sm" />}>
        <p className={s.small}>
          US retiree, Guanacaste house, Costa Rican S.A. Question: what is due for the corporation tax this year?
        </p>
      </Card>
    );
  }
  return (
    <div className={s.shellGrid}>
      <Card title="Next step" tone="accent">
        <p className={s.small}>
          Bring the 2025 S.A. book of minutes. From you, by Oct 30. Your lawyer will file the D-195 return after that.
        </p>
      </Card>
      <Card title="Membership">
        <ProgressBar label="Minutes left this month" value={40} max={60} valueText="40 of 60 min" />
      </Card>
    </div>
  );
}

export default function UiGallery() {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<MemberRow | null>(null);
  const [shellRole, setShellRole] = useState<ShellRole>("staff");
  const [loginRole, setLoginRole] = useState<"staff" | "lawyer" | "client">("client");
  const [loginNote, setLoginNote] = useState<string | null>(null);

  // Dates and locale formatting differ between server and browser; render after mount.
  useEffect(() => setReady(true), []);
  if (!ready) return <div className={s.page} aria-busy="true" />;

  return (
    <div className={s.page}>
      <header className={s.head}>
        <p className={s.eyebrow}>W2 · shell and UI kit</p>
        <h1 className={s.title}>ILP UI kit</h1>
        <p className={s.lede}>
          Every shared primitive and the role shell, with Costa Rica sample data. Import primitives from{" "}
          <code>@/components/ui</code>, the shell from <code>@/components/shell</code>, the login from{" "}
          <code>@/components/auth/PortalLogin</code> and chart colors from <code>@/styles/tokens</code>.
        </p>
        <nav className={s.index} aria-label="Sections">
          {SECTIONS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className={s.indexLink}>
              {label}
            </a>
          ))}
        </nav>
      </header>

      <section id="buttons" className={s.section}>
        <h2 className={s.h2}>Button</h2>
        <div className={s.row}>
          <Button>Book a call</Button>
          <Button variant="secondary">View profile</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger">Cancel membership</Button>
          <Button
            busy={busy}
            onClick={() => {
              setBusy(true);
              window.setTimeout(() => setBusy(false), 1500);
            }}
          >
            Save next steps
          </Button>
          <Button size="sm" variant="secondary">
            Move to…
          </Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section id="cards" className={s.section}>
        <h2 className={s.h2}>Card</h2>
        <div className={s.asym}>
          <Card title="Living profile" eyebrow="Member" actions={<Button size="sm" variant="ghost">Edit</Button>}>
            <ProgressBar label="Profile complete" value={0.43} />
          </Card>
          <Card title="Upcoming obligation" tone="mist" footer={<Button size="sm" variant="secondary">Ask my lawyer</Button>}>
            <p className={s.small}>Annual corporation tax (D-195) may require review before Jan 31, 2027.</p>
          </Card>
        </div>
      </section>

      <section id="stats" className={s.section}>
        <h2 className={s.h2}>StatTile</h2>
        <div className={s.kpis}>
          <StatTile size="lg" label="MRR" value="US$3,839.52" delta="+US$79.99" trend="up" hint="48 active members" />
          <div className={s.kpiSmall}>
            <StatTile label="Month-3 retention" value="83.3%" delta="+2.1 pts" trend="up" hint="target ≥ 80%" />
            <StatTile label="Consultation-ready ≤ 7 days" value="68.4%" delta="−3.0 pts" trend="down" hint="target ≥ 70%" />
            <StatTile label="Handoff confirmed ≤ 24 h" value="96.7%" hint="29 of 30 calls" />
            <StatTile label="Monthly churn" value="2.4%" delta="+0.6 pts" trend="up" upIsGood={false} />
          </div>
        </div>
      </section>

      <section id="status" className={s.section}>
        <h2 className={s.h2}>StatusPill and AgingBadge</h2>
        <div className={s.row}>
          <StatusPill label="Open" />
          <StatusPill label="Booked" tone="info" />
          <StatusPill label="Confirmed" tone="success" />
          <StatusPill label="Waiting on member" tone="warning" />
          <StatusPill label="Past due" tone="danger" />
        </div>
        <div className={s.row}>
          <AgingBadge days={3} />
          <AgingBadge days={9} />
          <AgingBadge days={21} />
          <AgingBadge days={2} warnAfterDays={1} overdueAfterDays={3} suffix="since booking" />
        </div>
        <p className={s.small}>
          Status always has a text label. AgingBadge props: <code>since</code> or <code>days</code>,{" "}
          <code>warnAfterDays</code> (default 7), <code>overdueAfterDays</code> (default 14).
        </p>
      </section>

      <section id="progress" className={s.section}>
        <h2 className={s.h2}>ProgressBar</h2>
        <div className={s.stack}>
          <ProgressBar label="Profile complete" value={0.43} />
          <ProgressBar label="Minutes left this month" value={40} max={60} valueText="40 of 60 min" />
          <ProgressBar label="Calls used" value={1} max={3} valueText="1 of 3 calls" tone="success" />
          <ProgressBar label="Onboarding tasks overdue" value={0.27} tone="warning" />
        </div>
      </section>

      <section id="table" className={s.section}>
        <h2 className={s.h2}>DataTable and Drawer</h2>
        <p className={s.small}>
          Click a header to sort. Tab into the table, use the arrow keys, Home and End, then Enter to open the drawer.
          Esc closes it and focus returns to the row.
        </p>
        <DataTable
          caption="Members"
          columns={COLUMNS}
          rows={MEMBERS}
          rowKey={(r) => r.id}
          onRowActivate={setSelected}
          selectedKey={selected?.id ?? null}
          defaultSort={{ key: "stage", dir: "asc" }}
        />
        <Drawer
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected?.name ?? ""}
          subtitle={selected ? `${selected.matter} · ${selected.area} · Costa Rica` : undefined}
          footer={
            <>
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Close
              </Button>
              <Button>Open member page</Button>
            </>
          }
        >
          {selected && (
            <div className={s.stack}>
              <div className={s.row}>
                <StatusPill {...MEMBERSHIP_PILL[selected.status]} />
                <AgingBadge since={selected.stageEnteredAt} now={NOW} />
              </div>
              <ProgressBar label="Profile complete" value={selected.profile} />
              <ProgressBar label="Minutes left" value={selected.minutesLeft} max={60} valueText={`${selected.minutesLeft} of 60 min`} />
              <p className={s.small}>Next deadline {formatDate(selected.nextDue)}</p>
              <Timeline items={ACTIVITY.slice(0, 3)} />
            </div>
          )}
        </Drawer>
        <DataTable
          caption="Empty table"
          columns={COLUMNS}
          rows={[]}
          rowKey={(r) => r.id}
          empty={<EmptyState compact title="No members match these filters" body="Clear the area filter to see all 48 members." />}
        />
      </section>

      <section id="timeline" className={s.section}>
        <h2 className={s.h2}>Timeline</h2>
        <Card>
          <Timeline items={ACTIVITY} />
        </Card>
      </section>

      <section id="tabs" className={s.section}>
        <h2 className={s.h2}>Tabs</h2>
        <p className={s.small}>Panels mount on first visit and stay mounted: type in Notes, switch tabs, come back.</p>
        <Tabs
          label="Matter"
          tabs={[
            { id: "brief", label: "Brief", content: <LazyPanel name="Brief" /> },
            { id: "notes", label: "Notes", count: 2, content: () => <NotesPanel /> },
            { id: "quotes", label: "Quotes", content: <LazyPanel name="Quotes" /> },
            { id: "deadlines", label: "Deadlines", count: 3, content: <LazyPanel name="Deadlines" /> },
          ]}
        />
      </section>

      <section id="empty" className={s.section}>
        <h2 className={s.h2}>EmptyState</h2>
        <EmptyState
          title="No calls booked yet"
          body="You have 60 minutes this month across up to three 20-minute calls."
          action={<Button>Book a call</Button>}
        />
      </section>

      <section id="notices" className={s.section}>
        <h2 className={s.h2}>Notice</h2>
        <NoticeGallery />
      </section>

      <section id="forms" className={s.section}>
        <h2 className={s.h2}>Form fields</h2>
        <FormsGallery />
      </section>

      <section id="schedule" className={s.section}>
        <h2 className={s.h2}>Time and schedule inputs</h2>
        <ScheduleGallery />
      </section>

      <section id="guard" className={s.section}>
        <h2 className={s.h2}>Dialog and unsaved changes</h2>
        <GuardGallery />
      </section>

      <section id="tokens" className={s.section}>
        <h2 className={s.h2}>Chart tokens</h2>
        <p className={s.small}>
          <code>chartSeries</code> from <code>@/styles/tokens</code>, in order. One hue family, no second accent.
        </p>
        <ol className={s.swatches}>
          {chartSeries.map((c, i) => (
            <li key={c} className={s.swatch}>
              <span className={`${s.chip} ${s[`chip${i + 1}`]}`} aria-hidden="true" />
              <code>
                {i + 1}. {c}
              </code>
            </li>
          ))}
        </ol>
      </section>

      <section id="loading" className={s.section}>
        <h2 className={s.h2}>Loading states</h2>
        <LoadingGallery />
      </section>

      <section id="shell" className={s.section}>
        <h2 className={s.h2}>RoleShell</h2>
        <p className={s.small}>
          Same shell for all three roles. Narrow the window below 768px to see the bottom bar (staff shows a More
          drawer past five items).
        </p>
        <Tabs
          label="Role"
          value={shellRole}
          onChange={(id) => setShellRole(id as ShellRole)}
          tabs={(["staff", "lawyer", "client"] as ShellRole[]).map((role) => ({
            id: role,
            label: role === "client" ? "Client" : role === "lawyer" ? "Lawyer" : "Staff",
            content: (
              <RoleShell
                embedded
                role={role}
                nav={demoNav(role)}
                title={SHELL_DEMO[role].title}
                user={SHELL_DEMO[role].user}
                onSearch={() => undefined}
                bell={<NotificationBell count={role === "client" ? 1 : 4} />}
                showCountry={role !== "client"}
                homeHref="/ui"
                actions={role === "client" ? <Button>Book a call</Button> : undefined}
                onLogout={() => undefined}
              >
                <ShellBody role={role} />
              </RoleShell>
            ),
          }))}
        />
      </section>

      <section id="login" className={s.section}>
        <h2 className={s.h2}>PortalLogin</h2>
        <p className={s.small}>
          Live component: submitting sends a real code request to the configured API.
        </p>
        <div className={s.row}>
          {(["client", "lawyer", "staff"] as const).map((r) => (
            <Button key={r} size="sm" variant={loginRole === r ? "primary" : "secondary"} onClick={() => setLoginRole(r)}>
              {r === "client" ? "Client" : r === "lawyer" ? "Lawyer" : "Staff"}
            </Button>
          ))}
        </div>
        {loginNote && <p className={s.small}>{loginNote}</p>}
        <div className={s.loginFrame}>
          <PortalLogin
            key={loginRole}
            role={loginRole}
            onSuccess={({ email }) => setLoginNote(`Signed in as ${email}. A portal would route to its home now.`)}
          />
        </div>
      </section>

      <section id="tutorials" className={s.section}>
        <h2 className={s.h2}>Tutorials</h2>
        <TutorialsGallery />
      </section>
    </div>
  );
}

function LazyPanel({ name }: { name: string }) {
  const [mountedAt] = useState(() => new Date().toLocaleTimeString("en-US"));
  return (
    <p className={s.small}>
      {name} panel mounted at {mountedAt}. It mounted when you first opened it and has not remounted since.
    </p>
  );
}

function NotesPanel() {
  const [text, setText] = useState("");
  return (
    <label className={s.field}>
      <span className={s.fieldLabel}>Private note</span>
      <textarea
        className={s.textarea}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Member prefers calls after 2 pm Costa Rica time."
        rows={3}
      />
    </label>
  );
}
