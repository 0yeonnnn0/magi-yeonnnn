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
      <div className="absolute inset-0 bg-black/70" />

      {/* Bottom sheet */}
      <div
        className="relative w-full max-w-md rounded-t-lg border-t border-x p-5 pb-8
          animate-[slideUp_0.3s_ease-out]"
        style={{
          borderColor: colors.border + "66",
          background: colors.bg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full" style={{ background: colors.text + "44" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-widest" style={{ color: colors.text }}>
              {label}
            </span>
            {isWinner && (
              <span
                className="text-[10px] px-2 py-0.5 rounded tracking-widest stamp-in"
                style={{ background: colors.border + "33", color: colors.text }}
              >
                ★ CONSENSUS PICK
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 border rounded-sm hover:opacity-80"
            style={{ borderColor: colors.text + "33", color: colors.text + "88" }}
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
              <div className="text-[10px] tracking-widest mb-1" style={{ color: colors.text + "55" }}>
                ANALYSIS
              </div>
              <div className="text-sm leading-relaxed" style={{ color: colors.text + "cc" }}>
                {agent.reason}
              </div>
            </div>

            <div
              className="px-3 py-2 border rounded text-sm"
              style={{ borderColor: colors.text + "22", color: colors.text + "aa" }}
            >
              <span className="text-[10px] tracking-widest block mb-1" style={{ color: colors.text + "55" }}>
                ADVICE
              </span>
              {agent.advice}
            </div>
          </div>
        )}

        {/* Ask content */}
        {agent.action === "ask" && (
          <div className="space-y-3">
            <div className="text-[10px] tracking-widest" style={{ color: colors.text + "55" }}>
              ADDITIONAL DATA REQUIRED
            </div>
            <div className="text-sm" style={{ color: colors.text }}>
              &quot;{agent.question}&quot;
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
