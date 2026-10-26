"use client";

import { useCallback, useMemo, useRef } from "react";
import { Drawer, Tabs, type TabItem } from "@/components/ui";
import { BriefTab, MatterTab, NotesCallsTab } from "./InspectorTabs";
import FeeQuotesTab from "./FeeQuotesTab";
import DeadlineEditor, { providerDeadlineAdapter } from "./DeadlineEditor";
import { areaLabel, lawyerApi, type BoardCard, type ClientBrief } from "./lawyerApi";
import type { LawyerClient } from "./types";

interface Props {
  card: BoardCard;
  stages: Array<{ id: string; label: string }>;
  onMove: (stage: string) => void;
  onClose: () => void;
}

/**
 * Member inspector: opens on Brief, then Matter, Notes and calls, Quotes
 * (your fee only) and Deadlines. Tabs mount on first visit (W2 Tabs), so
 * unopened tabs never fetch; brief and client data are fetched once and
 * shared between the tabs that need them.
 */
export default function ClientInspector({ card, stages, onMove, onClose }: Props) {
  const briefRef = useRef<Promise<ClientBrief> | null>(null);
  const clientRef = useRef<Promise<LawyerClient> | null>(null);

  const getBrief = useCallback(() => (briefRef.current ??= lawyerApi.clientBrief(card.clientId)), [card.clientId]);
  const getClient = useCallback(() => (clientRef.current ??= lawyerApi.client(card.clientId)), [card.clientId]);
  const adapter = useMemo(() => providerDeadlineAdapter(card.clientId), [card.clientId]);

  const tabs: TabItem[] = [
    { id: "brief", label: "Brief", content: () => <BriefTab load={getBrief} /> },
    { id: "matter", label: "Matter", content: () => <MatterTab card={card} stages={stages} onMove={onMove} loadClient={getClient} /> },
    { id: "notes", label: "Notes and calls", content: () => <NotesCallsTab loadBrief={getBrief} loadClient={getClient} /> },
    { id: "quotes", label: "Quotes", content: () => <FeeQuotesTab clientId={card.clientId} /> },
    { id: "deadlines", label: "Deadlines", content: () => <DeadlineEditor adapter={adapter} /> },
  ];

  return (
    <Drawer open onClose={onClose} title={card.clientName} subtitle={`${card.title} · ${areaLabel(card.area)}`} size="lg">
      <Tabs key={card.clientId} tabs={tabs} defaultValue="brief" label={`${card.clientName} details`} />
    </Drawer>
  );
}
