"use client";

import { useState, useCallback } from "react";
import { consultMagi, type MagiResponse, type AgentResult } from "@/shared/api";
import { AGENT_NAMES } from "@/shared/config";
import { MagiTriangle } from "@/widgets/magi-triangle";
import { MagiDetail } from "@/widgets/magi-detail";
import { MagiChat, type ChatMessage } from "@/widgets/magi-chat";
import { MagiAskModal, type AgentQuestion } from "@/widgets/magi-ask-modal";
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
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  // Ask modal state
  const [askQuestions, setAskQuestions] = useState<AgentQuestion[]>([]);
  const [showAskModal, setShowAskModal] = useState(false);

  const addSystemMessage = useCallback((content: string, tappable?: boolean) => {
    setChatMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "system", content, tappable },
    ]);
  }, []);

  async function handleSend(message: string) {
    setChatMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: message },
    ]);

    const prevAskQuestions = [...askQuestions];
    setLastMessage(message);
    setLoading(true);
    setResponse(null);
    setRevealedPanels([false, false, false]);
    setWinnerIndex(null);
    setDetailIndex(null);
    setDeliberation(undefined);
    setAskQuestions([]);
    setShowAskModal(false);
    // MELCHIOR(0) thinks first
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
          "저는 3개의 시스템이 토론하여 당신의 고민을 판정하는 MAGI입니다.\n\n" +
          "• MELCHIOR — 찬성 관점의 시스템\n" +
          "• BALTHASAR — 중립적 심판\n" +
          "• CASPER — 반대 관점의 시스템\n\n" +
          "연애, 진로, 재정, 건강, 인생 등 어떤 고민이든 입력해주세요.\n" +
          "3개의 시스템이 토론 후 최종 판정을 내립니다.\n\n" +
          "판정 후 상단의 시스템을 탭하면 각 시스템의 상세 의견을 확인할 수 있습니다."
        );
        return;
      }

      if (data.phase === "blocked") {
        setLoading(false);
        setPanelStates(["idle", "idle", "idle"]);
        setDeliberation("ACCESS DENIED");
        addSystemMessage(data.reason || "MAGI는 고민 상담만 가능합니다.");
        // Restore ask modal if this was a follow-up answer rejection
        if (prevAskQuestions.length > 0) {
          setAskQuestions(prevAskQuestions);
          addSystemMessage("답변을 다시 작성해주세요. 탭하여 답변해주세요.", true);
          setShowAskModal(true);
        }
        return;
      }

      setResponse(data);

      // 1. MELCHIOR(0) done → CASPER(2) thinks
      setTimeout(() => {
        setPanelStates(["selected", "idle", "thinking"]);
        setRevealedPanels([true, false, false]);
      }, 800);

      // 2. CASPER(2) done → BALTHASAR(1) thinks last (judge)
      setTimeout(() => {
        setPanelStates(["selected", "thinking", "selected"]);
        setRevealedPanels([true, false, true]);
      }, 1800);

      // 3. BALTHASAR(1) done — all revealed
      setTimeout(() => {
        setPanelStates(["selected", "selected", "selected"]);
        setRevealedPanels([true, true, true]);
      }, 2800);

      setTimeout(() => {
        setLoading(false);

        if (data.phase === "ask") {
          setDeliberation("NEED MORE DATA");
          // Store questions for modal
          const questions = (data.agents ?? [])
            .filter((a) => a.action === "ask")
            .map((a) => ({ agent: a.agent, question: (a as { question: string }).question }));
          setAskQuestions(questions);
          addSystemMessage("추가 정보가 필요합니다. 탭하여 답변해주세요.", true);
          setShowAskModal(true);
        } else if (data.phase === "vote") {
          const consensus = data.decision;
          const wi = (data.agents ?? []).findIndex(
            (a) => a.action === "vote" && a.decision === consensus
          );
          if (wi !== -1) {
            setWinnerIndex(wi);
            setPanelStates((prev) => {
              const next = [...prev];
              next[wi] = "winner";
              return next;
            });
            setDeliberation(`${data.decision?.toUpperCase()} — ${AGENT_NAMES[wi]}`);
            setChatMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "system",
                content: `${AGENT_NAMES[wi]} 의견이 채택되었습니다: ${data.decision} (${data.votes?.찬성 ?? 0}찬성 / ${data.votes?.반대 ?? 0}반대)`,
                hint: true,
              },
            ]);
          } else {
            setDeliberation("DELIBERATION COMPLETE");
          }
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
    setLastMessage(null);
    setAskQuestions([]);
    setShowAskModal(false);
  }

  function handleAskComplete(combinedAnswers: string) {
    setShowAskModal(false);
    setAskQuestions([]);
    handleSend(combinedAnswers);
  }

  function handleTappableClick() {
    if (askQuestions.length > 0) {
      setShowAskModal(true);
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
            onRetry={handleRetry}
            showRetry={hasResult}
          />
        </div>

        <MagiChat
          messages={chatMessages}
          loading={loading}
          onSend={handleSend}
          onTappableClick={handleTappableClick}
        />

        {/* Ask modal */}
        {showAskModal && askQuestions.length > 0 && (
          <MagiAskModal
            questions={askQuestions}
            onComplete={handleAskComplete}
            onClose={() => setShowAskModal(false)}
          />
        )}

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
