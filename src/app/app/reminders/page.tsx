import PortalShell from "@/components/PortalShell";
import s from "../portal.module.scss";

const REMINDERS = [
  { title: "DIMEX residency renewal", meta: "Costa Rica · Due in 45 days", status: "Upcoming" },
  { title: "Corporate annual tax filing", meta: "Panama · Due in 30 days", status: "Upcoming" },
  { title: "Marchamo vehicle inspection", meta: "Costa Rica · Due in 60 days", status: "Upcoming" },
  { title: "Municipal property tax", meta: "Mexico · Due in 20 days", status: "Soon" },
];

export default function RemindersPage() {
  return (
    <PortalShell title="Compliance & reminder center">
      <div className={s.list}>
        {REMINDERS.map((r) => (
          <div key={r.title} className={s.row}>
            <div>
              <div className={s.rowTitle}>{r.title}</div>
              <div className={s.rowMeta}>{r.meta}</div>
            </div>
            <span className={s.badge}>{r.status}</span>
          </div>
        ))}
      </div>
      <p className={s.empty}>
        Rule-based alerts for residency renewals, corporate filings, vehicle
        inspections, and property taxes appear here.
      </p>
    </PortalShell>
  );
}