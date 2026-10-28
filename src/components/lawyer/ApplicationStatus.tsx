"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ButtonLink, IconCheck, Notice, StatusPill, type StatusTone } from "@/components/ui";
import { callsApi } from "./callsApi";
import type { LawyerMe } from "./lawyerApi";
import s from "./ApplicationStatus.module.scss";

interface Item {
  id: string;
  title: string;
  body: string;
  state: { label: string; tone: StatusTone };
  link?: { href: string; label: string };
}

const DONE = { label: "Done", tone: "success" as const };
const TODO = { label: "To do", tone: "warning" as const };

/** True while the signed-in lawyer's application is not approved yet (T2). */
export function inReview(me: LawyerMe | null | undefined): boolean {
  return me?.status === "pending_review" || me?.status === "changes_requested";
}

/**
 * Shown on Today while an application is in review: where it stands and a
 * "Finish your profile" checklist. Members cannot book the lawyer until staff
 * approve the application (the server enforces it; this only explains it).
 */
export default function ApplicationStatus({ me }: { me: LawyerMe }) {
  const [hoursSaved, setHoursSaved] = useState<boolean | null>(null);

  useEffect(() => {
    if (!inReview(me)) return;
    callsApi
      .availability()
      .then((a) => setHoursSaved(!a.isDefault && a.weekly.length > 0))
      .catch(() => setHoursSaved(null));
  }, [me]);

  if (!inReview(me)) return null;

  const sent = me.submittedAt ? new Date(me.submittedAt).toLocaleDateString("en-US", { month: "long", day: "numeric" }) : null;
  const items: Item[] = [
    {
      id: "sent",
      title: "Application sent",
      body: sent ? `We received it on ${sent}.` : "We received your application.",
      state: me.status === "changes_requested" ? { label: "Needs a change", tone: "warning" } : DONE,
      ...(me.status === "changes_requested" ? { link: { href: "/lawyers/apply", label: "Send it again" } } : {}),
    },
    {
      id: "hours",
      title: "Weekly hours",
      body: "The hours when members can book you once you are approved. Check them and add days off.",
      state: hoursSaved === null ? { label: "Checking", tone: "neutral" } : hoursSaved ? DONE : TODO,
      link: { href: "/lawyer/availability", label: "Check your hours" },
    },
    {
      id: "bio",
      title: "Introduction for members",
      body: me.hasBio ? "Members read it before a call. To change it, write to your ILP contact." : "Write to your ILP contact to add a short introduction.",
      state: me.hasBio ? DONE : TODO,
    },
    {
      id: "photo",
      title: "Photo for members",
      body: "Uploading a photo in the portal is not available yet. We will ask you for one by email.",
      state: { label: "Not available yet", tone: "neutral" },
    },
    {
      id: "payout",
      title: "Payout details",
      body: "We ask for these after you are approved. We never ask for bank details by email.",
      state: { label: "After approval", tone: "neutral" },
    },
    {
      id: "review",
      title: "Review by ILP",
      body: "We check your carné with the Colegio and read your answers. We email you when you can take calls.",
      state: { label: me.status === "changes_requested" ? "Waiting for your change" : "In review", tone: "info" },
    },
  ];

  return (
    <section className={s.wrap} aria-labelledby="application-status-h">
      {me.status === "changes_requested" ? (
        <Notice
          tone="warning"
          title="We need a change to your application"
          fix={{
            summary: "Members can book you only after we approve the application.",
            steps: [
              "Read our note below.",
              "Open the application form and send it again with the same email address.",
              "We review it again as soon as it arrives and email you the result.",
            ],
          }}
          actions={<ButtonLink href="/lawyers/apply" size="sm">Open the application form</ButtonLink>}
        >
          {me.reviewNote ? `Our note: ${me.reviewNote}` : "We emailed you what to change."}
        </Notice>
      ) : (
        <Notice tone="info" title="Your profile is under review">
          You can look around the portal and set your hours. Members cannot book you yet. We will email you when you can take calls.
        </Notice>
      )}

      <div className={s.card}>
        <h2 id="application-status-h" className={s.h}>
          Finish your profile
        </h2>
        <p className={s.lead}>The steps from your application to your first call. The ones marked To do are yours.</p>
        <ol className={s.list}>
          {items.map((it, i) => (
            <li key={it.id} className={s.item}>
              <span className={s.num} data-done={it.state === DONE || undefined} aria-hidden="true">
                {it.state === DONE ? <IconCheck /> : i + 1}
              </span>
              <div className={s.itemMain}>
                <span className={s.itemTitle}>{it.title}</span>
                <span className={s.itemBody}>{it.body}</span>
                {it.link && (
                  <Link className={s.itemLink} href={it.link.href}>
                    {it.link.label}
                  </Link>
                )}
              </div>
              <StatusPill size="sm" label={it.state.label} tone={it.state.tone} srPrefix="Status" />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
