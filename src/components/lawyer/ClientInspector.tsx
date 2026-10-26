"use client";

import { useState } from "react";
import AnimatedTabs, { type TabItem } from "@/components/AnimatedTabs";
import type { LawyerClient } from "./types";
import { displayName } from "./types";
import OverviewTab from "./OverviewTab";
import InsightsTab from "./InsightsTab";
import LilyTab from "./LilyTab";
import NotesTab from "./NotesTab";
import QuotesTab from "./QuotesTab";
import ActivityTab from "./ActivityTab";
import DeadlinesTab from "./DeadlinesTab";
import styles from "./inspector.module.scss";

interface ClientInspectorProps {
  client: LawyerClient;
  stageLabel: (id: string) => string;
  stages: string[];
  onMoveStage: (clientId: string, targetStage: string) => Promise<void>;
  onClose: () => void;
}

export default function ClientInspector({
  client,
  stageLabel,
  stages,
  onMoveStage,
  onClose,
}: ClientInspectorProps) {
  const [current, setCurrent] = useState<LawyerClient>(client);
  const [moving, setMoving] = useState(false);

  async function handleMove(targetStage: string) {
    if (targetStage === current.stage || moving) return;
    setMoving(true);
    try {
      await onMoveStage(current.id, targetStage);
      setCurrent((c) => ({ ...c, stage: targetStage }));
    } finally {
      setMoving(false);
    }
  }

  const tabs: TabItem[] = [
    {
      id: "overview",
      label: "Overview",
      content: <OverviewTab client={current} onRefreshed={setCurrent} />,
    },
    {
      id: "insights",
      label: "Insights",
      content: <InsightsTab client={current} onRefreshed={setCurrent} />,
    },
    { id: "lily", label: "Lily", content: <LilyTab clientId={current.id} /> },
    {
      id: "deadlines",
      label: "Deadlines",
      content: <DeadlinesTab client={current} />,
    },
    {
      id: "notes",
      label: "Notes",
      content: <NotesTab client={current} onRefreshed={setCurrent} />,
    },
    { id: "quotes", label: "Quotes", content: <QuotesTab client={current} /> },
    {
      id: "activity",
      label: "Activity",
      content: <ActivityTab client={current} onRefreshed={setCurrent} />,
    },
  ];

  return (
    <div className={styles.inspector}>
      <div className={styles.head}>
        <h2 className={styles.title}>{displayName(current)}</h2>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className={styles.stageField}>
        <span className={styles.stageLabel}>Move to stage</span>
        <select
          className={styles.stageSelect}
          value={current.stage}
          disabled={moving}
          onChange={(e) => handleMove(e.target.value)}
        >
          {stages.map((s) => (
            <option key={s} value={s}>
              {stageLabel(s)}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.body}>
        <AnimatedTabs tabs={tabs} defaultTab="overview" />
      </div>
    </div>
  );
}