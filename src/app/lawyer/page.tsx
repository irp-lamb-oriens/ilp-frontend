"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  providerFetch,
  getProviderToken,
  setProviderToken,
  clearProviderToken,
  ApiError,
} from "@/lib/provider";
import { getDashboardToken } from "@/lib/api";
import AuthShell from "@/components/auth/AuthShell";
import AuthField from "@/components/auth/AuthField";
import styles from "./lawyer.module.scss";

interface LawyerMe {
  providerId: string;
  email: string;
  name: string | null;
  score: number | null;
  legalAreas: string[];
  jurisdictions: string[];
}

interface LawyerClient {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  legalArea: string | null;
  legalMatter: string | null;
  jurisdiction: string | null;
  stage: string;
  pendingCount: number;
  lastUpdated: string | null;
}

interface LawyerClientsResponse {
  clients: LawyerClient[];
  stages: string[];
  stageLabels: Array<{ id: string; label: string }>;
  total: number;
}

interface LawyerFinance {
  providerId: string;
  providerPayments: Array<{
    quoteId: string;
    clientId: string | null;
    date: string | null;
    amount: number;
    paid: boolean;
    note: string | null;
  }>;
  totalEarned: number;
  totalPending: number;
  settlementCount: number;
}

type Stage = "loading" | "login" | "verify" | "ready";
type Tab = "kanban" | "finance";

const money = (v: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);

const displayName = (c: LawyerClient) =>
  [c.name, c.surname].filter(Boolean).join(" ") || c.email;

// ── Cursor-reactive tilt card (state-reactive motion hook) ──────────────────
// Subtly leans toward the cursor (rotateX/rotateY within ±5deg) using motion
// values outside the React render cycle, so it never re-renders on mousemove.
function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [5, -5]), {
    stiffness: 200,
    damping: 20,
  });
  const ry = useSpring(useTransform(mx, [0, 1], [-5, 5]), {
    stiffness: 200,
    damping: 20,
  });

  function onMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  }
  function onLeave() {
    mx.set(0.5);
    my.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
      className={styles.tilt}
    >
      {children}
    </motion.div>
  );
}

// ── Kanban card with cursor-following tooltip + click-to-inspect ────────────
function KanbanCard({
  client,
  onDragStart,
  onDragEnd,
  onInspect,
}: {
  client: LawyerClient;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onInspect: (c: LawyerClient) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const tipX = useMotionValue(0);
  const tipY = useMotionValue(0);
  const [hovered, setHovered] = useState(false);

  function onMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    tipX.set(e.clientX - rect.left);
    tipY.set(e.clientY - rect.top);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
    >
      <div
        ref={ref}
        className={styles.card}
        draggable
        onDragStart={(e) => onDragStart(e, client.id)}
        onDragEnd={onDragEnd}
        onMouseMove={onMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onInspect(client)}
      >
        <div className={styles.cardName}>{displayName(client)}</div>
        <div className={styles.cardMeta}>
          {client.legalArea ?? "—"}
          {client.jurisdiction ? ` · ${client.jurisdiction}` : ""}
        </div>
        {client.pendingCount > 0 && (
          <div className={styles.cardPending}>{client.pendingCount} pending</div>
        )}

        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.12 }}
              className={styles.tooltip}
              style={{ x: tipX, y: tipY }}
            >
              <span className={styles.tooltipEmail}>{client.email}</span>
              <span className={styles.tooltipMatter}>{client.legalMatter ?? "No matter"}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function LawyerPage() {
  const [stage, setStage] = useState<Stage>("loading");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [me, setMe] = useState<LawyerMe | null>(null);
  const [board, setBoard] = useState<LawyerClientsResponse | null>(null);
  const [finance, setFinance] = useState<LawyerFinance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("kanban");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<LawyerClient | null>(null);

  const load = useCallback(async () => {
    const [meRes, boardRes, finRes] = await Promise.allSettled([
      providerFetch<LawyerMe>("/api/provider/me"),
      providerFetch<LawyerClientsResponse>("/api/provider/clients"),
      providerFetch<LawyerFinance>("/api/provider/finance"),
    ]);

    if (meRes.status === "fulfilled") setMe(meRes.value);
    if (boardRes.status === "fulfilled") setBoard(boardRes.value);
    if (finRes.status === "fulfilled") setFinance(finRes.value);

    const authFail = [meRes, boardRes, finRes].find(
      (r) => r.status === "rejected" && r.reason instanceof ApiError && r.reason.status === 401,
    );
    if (authFail) {
      clearProviderToken();
      setStage("login");
      setError("Session expired. Please log in again.");
      return;
    }

    setStage("ready");
  }, []);

  useEffect(() => {
    if (!getProviderToken() && !getDashboardToken()) {
      setStage("login");
      return;
    }
    load();
  }, [load]);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      await providerFetch("/api/provider/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setNotice("Verification code sent to your email.");
      setStage("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code.");
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await providerFetch<{ token: string }>(
        "/api/provider/auth/verify-otp",
        { method: "POST", body: JSON.stringify({ email, code }) },
      );
      setProviderToken(res.token);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code.");
    }
  }

  function logout() {
    clearProviderToken();
    setMe(null);
    setBoard(null);
    setFinance(null);
    setSelected(null);
    setCode("");
    setStage("login");
  }

  async function moveClient(clientId: string, targetStage: string) {
    const client = board?.clients.find((c) => c.id === clientId);
    if (!client || client.stage === targetStage) return;
    try {
      await providerFetch(`/api/provider/clients/${clientId}/stage`, {
        method: "PATCH",
        body: JSON.stringify({ stage: targetStage }),
      });
      await load();
      setSelected((s) => (s && s.id === clientId ? { ...s, stage: targetStage } : s));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move client.");
    }
  }

  function onDragStart(e: React.DragEvent, clientId: string) {
    setDraggedId(clientId);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDrop(e: React.DragEvent, targetStage: string) {
    e.preventDefault();
    if (draggedId) moveClient(draggedId, targetStage);
    setDraggedId(null);
  }

  if (stage === "loading") {
    return (
      <main className={styles.main}>
        <p className={styles.muted}>Loading…</p>
      </main>
    );
  }

  if (stage === "login" || stage === "verify") {
    return (
      <AuthShell
        title="ILP lawyer portal"
        sub={
          stage === "login"
            ? "Enter your lawyer email to receive a login code."
            : `Enter the 6-digit code sent to ${email}.`
        }
        notice={notice}
        error={error}
        primaryLabel={stage === "login" ? "Send code" : "Verify"}
        onSubmit={stage === "login" ? requestOtp : verifyOtp}
        secondaryVisible={stage === "verify"}
        secondaryLabel="Use a different email"
        onSecondary={() => {
          setStage("login");
          setCode("");
          setError(null);
          setNotice(null);
        }}
      >
        {stage === "login" ? (
          <AuthField
            label="Lawyer email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@lawfirm.com"
            required
            autoFocus
          />
        ) : (
          <AuthField
            label="Verification code"
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="000000"
            maxLength={6}
            required
            autoFocus
          />
        )}
      </AuthShell>
    );
  }

  const stageLabel = (id: string) =>
    board?.stageLabels.find((s) => s.id === id)?.label ?? id.replace(/_/g, " ");

  return (
    <main className={styles.shell}>
      {/* Glass top bar */}
      <header className={styles.topbar}>
        <div className={styles.topbarBrand}>
          <span className={styles.topbarMark}>ILP</span>
          <div>
            <div className={styles.topbarTitle}>Lawyer workspace</div>
            <div className={styles.topbarSub}>
              {me?.name ?? me?.email}
              {me?.score != null ? ` · ${me.score.toFixed(1)}★` : ""}
            </div>
          </div>
        </div>
        <button type="button" className={styles.secondary} onClick={logout}>
          Log out
        </button>
      </header>

      <div className={styles.workspace}>
        {/* Icon rail */}
        <nav className={styles.rail} aria-label="Workspace sections">
          <button
            type="button"
            className={tab === "kanban" ? styles.railActive : styles.railBtn}
            onClick={() => setTab("kanban")}
            title="Kanban"
          >
            <span className={styles.railIcon}>▦</span>
            <span className={styles.railLabel}>Board</span>
          </button>
          <button
            type="button"
            className={tab === "finance" ? styles.railActive : styles.railBtn}
            onClick={() => setTab("finance")}
            title="Finance"
          >
            <span className={styles.railIcon}>◈</span>
            <span className={styles.railLabel}>Finance</span>
          </button>
        </nav>

        {/* Central canvas */}
        <section className={styles.canvas}>
          {error && <p className={styles.error}>{error}</p>}

          {tab === "kanban" && (
            <div className={styles.board}>
              {board?.stages.map((stageId) => {
                const cards = (board.clients ?? []).filter((c) => c.stage === stageId);
                return (
                  <div
                    key={stageId}
                    className={styles.column}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDrop(e, stageId)}
                  >
                    <div className={styles.columnHead}>
                      <span className={styles.columnTitle}>{stageLabel(stageId)}</span>
                      <span className={styles.columnCount}>{cards.length}</span>
                    </div>
                    <div className={styles.columnBody}>
                      {cards.length === 0 && <p className={styles.empty}>No clients</p>}
                      <AnimatePresence>
                        {cards.map((c) => (
                          <KanbanCard
                            key={c.id}
                            client={c}
                            onDragStart={onDragStart}
                            onDragEnd={() => setDraggedId(null)}
                            onInspect={setSelected}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "finance" && (
            <div className={styles.finance}>
              <div className={styles.matrixGrid}>
                <TiltCard>
                  <div className={styles.kpi}>
                    <span className={styles.kpiValue}>{money(finance?.totalEarned ?? 0)}</span>
                    <span className={styles.kpiLabel}>Earned (paid)</span>
                  </div>
                </TiltCard>
                <TiltCard>
                  <div className={styles.kpi}>
                    <span className={styles.kpiValue}>{money(finance?.totalPending ?? 0)}</span>
                    <span className={styles.kpiLabel}>Pending</span>
                  </div>
                </TiltCard>
                <TiltCard>
                  <div className={styles.kpi}>
                    <span className={styles.kpiValue}>{finance?.settlementCount ?? 0}</span>
                    <span className={styles.kpiLabel}>Settlements</span>
                  </div>
                </TiltCard>
              </div>

              <div className={styles.ledger}>
                <h2 className={styles.sectionTitle}>Payments</h2>
                {(finance?.providerPayments ?? []).length === 0 && (
                  <p className={styles.muted}>No payments recorded yet.</p>
                )}
                {(finance?.providerPayments ?? []).map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.25 }}
                    className={styles.ledgerRow}
                  >
                    <span className={styles.ledgerAmount}>{money(p.amount)}</span>
                    <span className={styles.ledgerMeta}>
                      {p.date ? new Date(p.date).toLocaleDateString() : "—"}
                      {p.clientId ? ` · ${p.clientId}` : ""}
                    </span>
                    <span className={p.paid ? styles.paid : styles.unpaid}>
                      {p.paid ? "Paid" : "Pending"}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Inspector slide-over */}
        <AnimatePresence>
          {selected && (
            <motion.aside
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className={styles.inspector}
            >
              <div className={styles.inspectorHead}>
                <h2 className={styles.inspectorTitle}>{displayName(selected)}</h2>
                <button
                  type="button"
                  className={styles.inspectorClose}
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className={styles.inspectorBody}>
                <Row label="Email" value={selected.email} />
                <Row label="Legal area" value={selected.legalArea ?? "—"} />
                <Row label="Matter" value={selected.legalMatter ?? "—"} />
                <Row label="Jurisdiction" value={selected.jurisdiction ?? "—"} />
                <Row label="Stage" value={stageLabel(selected.stage)} />
                <Row label="Pending" value={String(selected.pendingCount)} />

                <label className={styles.inspectorField}>
                  <span>Move to stage</span>
                  <select
                    className={styles.assignSelect}
                    value={selected.stage}
                    onChange={(e) => moveClient(selected.id, e.target.value)}
                  >
                    {board?.stages.map((s) => (
                      <option key={s} value={s}>
                        {stageLabel(s)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.inspectorRow}>
      <span className={styles.inspectorLabel}>{label}</span>
      <span className={styles.inspectorValue}>{value}</span>
    </div>
  );
}