"use client";

import { AGENT_LABELS, DECISION_DISPLAY, type AgentName } from "@/shared/config";
import type { AgentResult } from "@/shared/api";

interface MagiDetailProps {
  name: AgentName;
  agent: AgentResult;
  isWinner: boolean;
  onClose: () => void;
}

function getDecisionColor(agent: AgentResult) {
  if (agent.action !== "vote") return { main: "#888888", bg: "#88888822", border: "#88888844" };
  const decision = agent.finalDecision ?? agent.decision;
  if (decision === "찬성") return { main: "#6ec6ff", bg: "#6ec6ff22", border: "#6ec6ff44" };
  if (decision === "반대") return { main: "#ff4444", bg: "#ff444422", border: "#ff444444" };
  return { main: "#888888", bg: "#88888822", border: "#88888844" };
}

export function MagiDetail({ name, agent, isWinner, onClose }: MagiDetailProps) {
  const label = AGENT_LABELS[name];
  const color = getDecisionColor(agent);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Bottom sheet */}
      <div
        className="relative w-full max-w-md rounded-t-lg border-t border-x p-5 pb-8
          animate-[slideUp_0.3s_ease-out]"
        style={{
          borderColor: color.border,
          background: "#0a0a0a",
          paddingBottom: "max(32px, env(safe-area-inset-bottom))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full" style={{ background: color.main + "33" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ background: color.main }}
            />
            <span className="text-sm font-bold tracking-widest" style={{ color: color.main }}>
              {label}
            </span>
            {isWinner && (
              <span
                className="text-[10px] px-2 py-0.5 rounded tracking-widest stamp-in"
                style={{ background: color.bg, color: color.main, border: `1px solid ${color.border}` }}
              >
                ★ CONSENSUS
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[10px] px-2 py-1 border rounded-sm active:opacity-60"
            style={{ borderColor: "#ffffff22", color: "#ffffff66" }}
          >
            CLOSE
          </button>
        </div>

        {/* Vote content */}
        {agent.action === "vote" && (
          <div className="space-y-4">
            <div
              className="text-2xl font-black tracking-widest text-center py-3"
              style={{ color: DECISION_DISPLAY[agent.decision!]?.color ?? color.main }}
            >
              {DECISION_DISPLAY[agent.decision!]?.text ?? agent.decision}
            </div>

            <div>
              <div className="text-[10px] tracking-widest mb-1.5" style={{ color: "#ff6a0066" }}>
                ANALYSIS
              </div>
              <div className="text-sm leading-relaxed" style={{ color: "#ffffffbb" }}>
                {agent.reason}
              </div>
            </div>

            <div
              className="px-3 py-2.5 border rounded text-sm leading-relaxed"
              style={{ borderColor: "#ff6a0022", color: "#ffffffaa", background: "#ff6a0008" }}
            >
              <span className="text-[10px] tracking-widest block mb-1.5" style={{ color: "#ff6a0066" }}>
                ADVICE
              </span>
              {agent.advice}
            </div>

            {/* Cross comments from other agents */}
            {agent.comments && agent.comments.length > 0 && (
              <div>
                <div className="text-[10px] tracking-widest mb-2" style={{ color: "#ff6a0066" }}>
                  OTHER SYSTEMS
                </div>
                <div className="space-y-2">
                  {agent.comments.map((c, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 border rounded text-sm leading-relaxed"
                      style={{ borderColor: "#ffffff11", background: "#ffffff06" }}
                    >
                      <span className="text-[10px] tracking-wider font-bold block mb-1" style={{ color: "#ff6a0088" }}>
                        {c.agent}
                      </span>
                      <span style={{ color: "#ffffffaa" }}>{c.comment}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Persuasion result (MELCHIOR / CASPER only) */}
            {agent.finalDecision && (
              <div
                className="px-3 py-2.5 border rounded text-sm leading-relaxed"
                style={{
                  borderColor: agent.persuaded ? "#ffaa0033" : "#ffffff11",
                  background: agent.persuaded ? "#ffaa0008" : "#ffffff04",
                }}
              >
                <span className="text-[10px] tracking-widest block mb-1.5" style={{ color: "#ff6a0066" }}>
                  {agent.persuaded ? "PERSUADED — 의견 변경" : "NOT PERSUADED — 의견 유지"}
                </span>
                <span style={{ color: "#ffffffbb" }}>
                  최종: <span style={{ color: agent.finalDecision === "찬성" ? "#6ec6ff" : "#ff4444", fontWeight: "bold" }}>
                    {agent.finalDecision === "찬성" ? "APPROVE" : "DENY"}
                  </span>
                  {" — "}{agent.finalReason}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Ask content */}
        {agent.action === "ask" && (
          <div className="space-y-3">
            <div className="text-[10px] tracking-widest" style={{ color: "#ff6a0066" }}>
              ADDITIONAL DATA REQUIRED
            </div>
            <div className="text-sm leading-relaxed" style={{ color: "#ffffffcc" }}>
              &quot;{agent.question}&quot;
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
