"use client";

import { useState, useCallback } from "react";
import { consultMagi, type MagiResponse, type AgentResult } from "@/shared/api";
import { AGENT_NAMES } from "@/shared/config";
import { MagiTriangle } from "@/widgets/magi-triangle";
import { MagiDetail } from "@/widgets/magi-detail";
import { MagiChat } from "@/widgets/magi-chat";
import type { PanelState } from "@/widgets/magi-panel";

export default function MagiSystem() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [response, setResponse] = useState<MagiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const [deliberation, setDeliberation] = useState<string | undefined>();

  const [panelStates, setPanelStates] = useState<PanelState[]>(["idle", "idle", "idle"]);
  const [revealedPanels, setRevealedPanels] = useState<boolean[]>([false, false, false]);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [resetKey, setResetKey] = useState(0);

  async function handleSend(message: string) {
    setLastQuestion(message);
    setLoading(true);
    setResponse(null);
    setRevealedPanels([false, false, false]);
    setWinnerIndex(null);
    setDetailIndex(null);
    setDeliberation(undefined);
    setPanelStates(["thinking", "idle", "idle"]);

    try {
      const data = await consultMagi(message, sessionId);
      setSessionId(data.sessionId);

      if (data.phase === "greeting") {
        setLoading(false);
        setPanelStates(["idle", "idle", "idle"]);
        setDeliberation("WELCOME");
        return;
      }

      if (data.phase === "blocked") {
        setLoading(false);
        setPanelStates(["idle", "idle", "idle"]);
        setDeliberation("ACCESS DENIED");
        return;
      }

      setResponse(data);

      // Sequential reveal: MELCHIOR → CASPER → BALTHASAR (2초 간격)
      setTimeout(() => {
        setPanelStates(["selected", "idle", "thinking"]);
        setRevealedPanels([true, false, false]);
      }, 2000);

      setTimeout(() => {
        setPanelStates(["selected", "thinking", "selected"]);
        setRevealedPanels([true, false, true]);
      }, 4000);

      setTimeout(() => {
        setPanelStates(["selected", "selected", "selected"]);
        setRevealedPanels([true, true, true]);
      }, 6000);

      setTimeout(() => {
        setLoading(false);

        const votes = data.votes ?? {};
        const decision = data.decision;
        const wi = (data.agents ?? []).findIndex(
          (a) => a.action === "vote" && a.decision === decision
        );

        if (wi !== -1) {
          setWinnerIndex(wi);
          setPanelStates((prev) => {
            const next = [...prev];
            next[wi] = "winner";
            return next;
          });

          const voteEntries = Object.entries(votes)
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => `${k} ${v}표`)
            .join(" / ");

          setDeliberation(`${decision} — ${AGENT_NAMES[wi]}`);
        } else {
          setDeliberation("VOTE COMPLETE");
        }
      }, 7000);
    } catch {
      setLoading(false);
      setPanelStates(["idle", "idle", "idle"]);
      setDeliberation("SYSTEM ERROR");
    }
  }

  function handleRetry() {
    if (loading || !lastQuestion) return;
    handleSend(lastQuestion);
  }

  function handleReset() {
    if (loading) return;
    setSessionId(null);
    setResponse(null);
    setLoading(false);
    setLastQuestion(null);
    setDeliberation(undefined);
    setPanelStates(["idle", "idle", "idle"]);
    setRevealedPanels([false, false, false]);
    setWinnerIndex(null);
    setDetailIndex(null);
    setResetKey((k) => k + 1);
  }

  function handlePanelClick(index: number) {
    const state = panelStates[index];
    if (state === "selected" || state === "winner") {
      setDetailIndex(index);
    }
  }

  const hasResult = !loading && response !== null;

  const displayAgents: (AgentResult | undefined)[] = AGENT_NAMES.map((_, i) =>
    revealedPanels[i] ? response?.agents?.[i] : undefined
  );

  return (
    <div className="h-[100dvh] w-screen flex justify-center" style={{ background: "#000000" }}>
      <div className="h-full w-full max-w-[430px] flex flex-col relative" style={{ background: "#000000" }}>
        <div className="flex items-center justify-center px-2 pb-1 flex-shrink-0" style={{ paddingTop: "max(8px, env(safe-area-inset-top))" }}>
          <MagiTriangle
            panelStates={panelStates}
            agents={displayAgents}
            onPanelClick={handlePanelClick}
            winnerIndex={winnerIndex}
            loading={loading}
            deliberation={deliberation}
            onRetry={handleReset}
            showRetry={hasResult}
            winnerDecision={response?.decision}
          />
        </div>

        <MagiChat
          key={resetKey}
          loading={loading}
          onSend={handleSend}
          onRetry={handleRetry}
          showRetry={hasResult}
        />

        {/* Detail bottom sheet */}
        {detailIndex !== null && response?.agents?.[detailIndex] && revealedPanels[detailIndex] && (
          <MagiDetail
            name={AGENT_NAMES[detailIndex]}
            agent={response.agents[detailIndex]}
            isWinner={winnerIndex === detailIndex}
            onClose={() => setDetailIndex(null)}
          />
        )}
      </div>
    </div>
  );
}
