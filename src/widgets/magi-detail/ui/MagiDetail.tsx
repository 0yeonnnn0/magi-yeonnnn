"use client";

import { AGENT_LABELS, type AgentName } from "@/shared/config";
import type { AgentResult } from "@/shared/api";

interface MagiDetailProps {
  name: AgentName;
  agent: AgentResult;
  isWinner: boolean;
  onClose: () => void;
}

export function MagiDetail({ name, agent, isWinner, onClose }: MagiDetailProps) {
  const label = AGENT_LABELS[name];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80" />

      <div
        className="relative w-full max-w-md rounded-t-lg border-t border-x p-5 pb-8
          animate-[slideUp_0.3s_ease-out]"
        style={{
          borderColor: "#5cff8a44",
          background: "#0a0a0a",
          paddingBottom: "max(32px, env(safe-area-inset-bottom))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full" style={{ background: "#5cff8a33" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ background: "#8de8a0" }} />
            <span className="text-sm font-bold tracking-widest" style={{ color: "#5cff8a" }}>
              {label}
            </span>
            {isWinner && (
              <span
                className="text-[10px] px-2 py-0.5 rounded tracking-widest stamp-in"
                style={{ background: "#5cff8a22", color: "#5cff8a", border: "1px solid #5cff8a44" }}
              >
                ★ WINNER
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

        {/* Choice */}
        <div
          className="text-2xl font-black tracking-widest text-center py-3"
          style={{ color: "#5cff8a" }}
        >
          {agent.decision}
        </div>

        {/* Reason */}
        {agent.reason && (
          <div className="mt-4">
            <div className="text-[10px] tracking-widest mb-1.5" style={{ color: "#ff6a0066" }}>
              REASON
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#ffffffbb" }}>
              {agent.reason.replace(/\. /g, ".\n")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
