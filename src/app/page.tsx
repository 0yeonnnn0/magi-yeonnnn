"use client";

import { useState, useCallback } from "react";
import { consultMagi, type MagiResponse, type AgentResult } from "@/shared/api";
import { AGENT_NAMES } from "@/shared/config";
import { MagiTriangle } from "@/widgets/magi-triangle";
import { MagiDetail } from "@/widgets/magi-detail";
import { MagiChat, type ChatMessage } from "@/widgets/magi-chat";
import type { PanelState } from "@/widgets/magi-panel";

export default function MagiSystem() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [response, setResponse] = useState<MagiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [deliberation, setDeliberation] = useState<string | undefined>();

  const [panelStates, setPanelStates] = useState<PanelState[]>(["idle", "idle", "idle"]);
  const [revealedPanels, setRevealedPanels] = useState<boolean[]>([false, false, false]);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);

  const addSystemMessage = useCallback((content: string, hint?: boolean) => {
    setChatMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "system", content, hint },
    ]);
  }, []);

  async function handleSend(message: string) {
    setChatMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: message },
    ]);

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
        addSystemMessage(
          "MAGI SYSTEM에 오신 것을 환영합니다.\n\n" +
          "저는 3개의 시스템이 투표하여 밸런스게임을 판정하는 MAGI입니다.\n\n" +
          "• MELCHIOR — 직감파\n" +
          "• BALTHASAR — 분석파\n" +
          "• CASPER — 현실파\n\n" +
          "\"A vs B\" 형태로 질문해주세요.\n" +
          "3개의 시스템이 각자 선택 후 다수결로 판정합니다.\n\n" +
          "판정 후 상단의 시스템을 탭하면 선택 이유를 확인할 수 있습니다."
        );
        return;
      }

      if (data.phase === "blocked") {
        setLoading(false);
        setPanelStates(["idle", "idle", "idle"]);
        setDeliberation("ACCESS DENIED");
        addSystemMessage(data.reason || "밸런스게임 질문을 입력해주세요.");
        return;
      }

      setResponse(data);

      // Sequential reveal: MELCHIOR → CASPER → BALTHASAR (1초+ 간격)
      setTimeout(() => {
        setPanelStates(["selected", "idle", "thinking"]);
        setRevealedPanels([true, false, false]);
      }, 1200);

      setTimeout(() => {
        setPanelStates(["selected", "thinking", "selected"]);
        setRevealedPanels([true, false, true]);
      }, 2400);

      setTimeout(() => {
        setPanelStates(["selected", "selected", "selected"]);
        setRevealedPanels([true, true, true]);
      }, 3600);

      setTimeout(() => {
        setLoading(false);

        // Find winner by majority
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

          // Build vote summary
          const voteEntries = Object.entries(votes)
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => `${k} ${v}표`)
            .join(" / ");

          setDeliberation(`${decision} — ${AGENT_NAMES[wi]}`);
          setChatMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "system",
              content: `MAGI 판정 결과:\n${decision} (${voteEntries})`,
              hint: true,
            },
          ]);
        } else {
          setDeliberation("VOTE COMPLETE");
        }
      }, 4000);
    } catch {
      setLoading(false);
      setPanelStates(["idle", "idle", "idle"]);
      setDeliberation("SYSTEM ERROR");
      addSystemMessage("MAGI 시스템 오류가 발생했습니다. 다시 시도해주세요.");
    }
  }

  function handlePanelClick(index: number) {
    const state = panelStates[index];
    if (state === "selected" || state === "winner") {
      setDetailIndex(index);
    }
  }

  function handleRetry() {
    if (loading) return;
    setSessionId(null);
    setResponse(null);
    setLoading(false);
    setChatMessages([]);
    setDeliberation(undefined);
    setPanelStates(["idle", "idle", "idle"]);
    setRevealedPanels([false, false, false]);
    setWinnerIndex(null);
    setDetailIndex(null);
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
            onRetry={handleRetry}
            showRetry={hasResult}
          />
        </div>

        <MagiChat
          messages={chatMessages}
          loading={loading}
          onSend={handleSend}
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
