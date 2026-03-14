"use client";

import { AGENT_COLORS, AGENT_LABELS, DECISION_DISPLAY, type AgentName } from "@/shared/config";
import type { AgentResult } from "@/shared/api";

interface MagiDetailProps {
  name: AgentName;
  agent: AgentResult;
  isWinner: boolean;
  onClose: () => void;
}

export function MagiDetail({ name, agent, isWinner, onClose }: MagiDetailProps) {
  const colors = AGENT_COLORS[name];
  const label = AGENT_LABELS[name];

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
          borderColor: colors.border + "44",
          background: "#0a0a0a",
          paddingBottom: "max(32px, env(safe-area-inset-bottom))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full" style={{ background: colors.text + "33" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ background: colors.panelBg }}
            />
            <span className="text-sm font-bold tracking-widest" style={{ color: colors.text }}>
              {label}
            </span>
            {isWinner && (
              <span
                className="text-[10px] px-2 py-0.5 rounded tracking-widest stamp-in"
                style={{ background: colors.border + "22", color: colors.text, border: `1px solid ${colors.border}44` }}
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
              style={{ color: DECISION_DISPLAY[agent.decision!]?.color ?? colors.text }}
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
