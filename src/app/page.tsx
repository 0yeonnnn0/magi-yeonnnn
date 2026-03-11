"use client";

import { useState, useCallback } from "react";
import { consultMagi, type MagiResponse, type AgentResult } from "@/shared/api";
import { AGENT_NAMES } from "@/shared/config";
import { MagiHeader } from "@/widgets/magi-header";
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

  const addSystemMessage = useCallback((content: string) => {
    setChatMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "system", content },
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
    // Start with only the first agent thinking
    setPanelStates(["thinking", "idle", "idle"]);

    try {
      const data = await consultMagi(message, sessionId);
      setSessionId(data.sessionId);

      // Blocked by guard
      if (data.phase === "blocked") {
        setLoading(false);
        setPanelStates(["idle", "idle", "idle"]);
        setDeliberation("ACCESS DENIED");
        addSystemMessage(data.reason || "MAGI는 연애 상담만 가능합니다.");
        return;
      }

      setResponse(data);

      // Sequential: think → ready, one at a time
      // Agent 0: already thinking → ready at 800ms, Agent 1 starts thinking
      setTimeout(() => {
        setPanelStates(["ready", "thinking", "idle"]);
      }, 800);

      // Agent 1: thinking → ready at 1800ms, Agent 2 starts thinking
      setTimeout(() => {
        setPanelStates(["ready", "ready", "thinking"]);
      }, 1800);

      // Agent 2: thinking → ready at 2800ms
      setTimeout(() => {
        setPanelStates(["ready", "ready", "ready"]);
      }, 2800);

      setTimeout(() => {
        setLoading(false);

        if (data.phase === "ask") {
          setDeliberation("NEED MORE DATA");
          const questions = (data.agents ?? [])
            .filter((a) => a.action === "ask")
            .map((a) => a.question)
            .join("\n");
          addSystemMessage(`추가 정보가 필요합니다:\n${questions}`);
        } else if (data.phase === "vote") {
          setDeliberation("DELIBERATION COMPLETE");
          addSystemMessage("MAGI 판정 완료! 각 패널을 터치해서 상세 답변을 확인하세요.");
        }
      }, 3200);
    } catch {
      setLoading(false);
      setPanelStates(["idle", "idle", "idle"]);
      setDeliberation("SYSTEM ERROR");
      addSystemMessage("MAGI 시스템 오류가 발생했습니다. 다시 시도해주세요.");
    }
  }

  function handlePanelClick(index: number) {
    const state = panelStates[index];

    if (state === "ready") {
      setRevealedPanels((prev) => {
        const next = [...prev];
        next[index] = true;
        return next;
      });
      setPanelStates((prev) => {
        const next = [...prev];
        next[index] = "selected";
        return next;
      });
      setDetailIndex(index);

      // Check all revealed → find winner
      setRevealedPanels((prev) => {
        const next = [...prev];
        next[index] = true;

        if (next.every(Boolean) && response?.phase === "vote" && winnerIndex === null) {
          const consensus = response.decision;
          const wi = (response.agents ?? []).findIndex(
            (a) => a.action === "vote" && a.decision === consensus
          );
          if (wi !== -1) {
            setWinnerIndex(wi);
            setTimeout(() => {
              setPanelStates((prev2) => {
                const next2 = [...prev2];
                next2[wi] = "winner";
                return next2;
              });
              setDeliberation(
                `${response.decision?.toUpperCase()} — ${AGENT_NAMES[wi]}`
              );
              addSystemMessage(
                `${AGENT_NAMES[wi]} 의견이 채택되었습니다: ${response.decision} (${response.votes?.찬성 ?? 0}찬성 / ${response.votes?.반대 ?? 0}반대 / ${response.votes?.보류 ?? 0}보류)`
              );
            }, 300);
          }
        }
        return next;
      });
    } else if (state === "selected" || state === "winner") {
      setDetailIndex(index);
    }
  }

  const displayAgents: (AgentResult | undefined)[] = AGENT_NAMES.map((_, i) =>
    revealedPanels[i] ? response?.agents?.[i] : undefined
  );

  return (
    <div className="h-[100dvh] w-screen flex flex-col" style={{ background: "#0a0a0a" }}>
      <MagiHeader loading={loading} deliberation={deliberation} />

      {/* MAGI Triangle */}
      <main className="flex-1 flex items-center justify-center px-4 min-h-0">
        <MagiTriangle
          panelStates={panelStates}
          agents={displayAgents}
          onPanelClick={handlePanelClick}
          winnerIndex={winnerIndex}
        />
      </main>

      {/* Chat */}
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
  );
}
