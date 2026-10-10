import PortalShell from "@/components/PortalShell";
import s from "../portal.module.scss";

const ITEMS = [
  { title: "Residency renewal review", meta: "Costa Rica · 20 min", status: "Completed" },
  { title: "Corporate filing walkthrough", meta: "Panama · 20 min", status: "Completed" },
  { title: "Property purchase questions", meta: "Mexico · 20 min", status: "Upcoming" },
];

export default function ConsultationsPage() {
  return (
    <PortalShell title="Consultation history">
      <div className={s.list}>
        {ITEMS.map((item) => (
          <div key={item.title} className={s.row}>
            <div>
              <div className={s.rowTitle}>{item.title}</div>
              <div className={s.rowMeta}>{item.meta}</div>
            </div>
            <span className={s.badge}>{item.status}</span>
          </div>
        ))}
      </div>
      <p className={s.empty}>
        Summaries, action items, and recordings (where consented) appear here
        after each consultation.
      </p>
    </PortalShell>
  );
}