"use client";

import { AGENT_COLORS, AGENT_LABELS, DECISION_DISPLAY, type AgentName } from "@/shared/config";
import type { AgentResult } from "@/shared/api";

export type PanelState = "idle" | "thinking" | "ready" | "selected" | "winner";

interface MagiPanelProps {
  name: AgentName;
  state: PanelState;
  agent?: AgentResult;
  onClick?: () => void;
}

function getAnimation(name: AgentName, state: PanelState) {
  const c = AGENT_COLORS[name];
  switch (state) {
    case "thinking":
      return `${c.thinking} 0.8s ease-in-out infinite, ${c.glow} 2s ease-in-out infinite`;
    case "ready":
      return `${c.readyPulse} 1.5s ease-in-out infinite`;
    case "winner":
      return `${c.winner} 1.2s ease-in-out infinite`;
    default:
      return undefined;
  }
}

function getBorderColor(name: AgentName, state: PanelState) {
  const c = AGENT_COLORS[name];
  if (state === "winner") return c.border;
  if (state === "ready" || state === "selected") return c.border + "88";
  return c.border + "44";
}

export function MagiPanel({ name, state, agent, onClick }: MagiPanelProps) {
  const colors = AGENT_COLORS[name];
  const label = AGENT_LABELS[name];
  const clickable = state === "ready" || state === "selected" || state === "winner";

  const statusText: Record<PanelState, string> = {
    idle: "READY",
    thinking: "ANALYZING",
    ready: "▶ VIEW RESULT",
    selected: agent?.action === "vote" ? "VOTE" : "ASK",
    winner: "★ SELECTED",
  };

  return (
    <div
      className={`flex flex-col border rounded-sm overflow-hidden transition-all duration-300 ${clickable ? "cursor-pointer hover:brightness-125" : ""}`}
      style={{
        borderColor: getBorderColor(name, state),
        background: colors.bg,
        animation: getAnimation(name, state),
      }}
      onClick={clickable ? onClick : undefined}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b text-xs font-bold tracking-widest"
        style={{ borderColor: colors.border + "33", color: colors.text }}
      >
        <span>{label}</span>
        <span
          style={{
            color: state === "winner" ? colors.text : colors.text + "66",
            fontWeight: state === "winner" ? 900 : undefined,
          }}
        >
          {statusText[state]}
        </span>
      </div>

      {/* Panel body */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[200px]">
        {/* IDLE */}
        {state === "idle" && (
          <div className="text-xs" style={{ color: colors.text + "33" }}>
            AWAITING INPUT
          </div>
        )}

        {/* THINKING — spinning + blinking label */}
        {state === "thinking" && (
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-16 h-16 border-2 rounded-full animate-spin"
              style={{ borderColor: colors.border + "33", borderTopColor: colors.text }}
            />
            <span className="text-xs tracking-widest blink" style={{ color: colors.text + "88" }}>
              PROCESSING
            </span>
          </div>
        )}

        {/* READY — teaser, click to reveal */}
        {state === "ready" && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-2xl blink" style={{ color: colors.text }}>
              ▶
            </div>
            <span className="text-xs tracking-widest" style={{ color: colors.text + "88" }}>
              CLICK TO REVEAL
            </span>
          </div>
        )}

        {/* SELECTED — show full answer */}
        {(state === "selected" || state === "winner") && agent && (
          <>
            {agent.action === "vote" && (
              <div className="flex flex-col items-center gap-4 stamp-in">
                <div
                  className="text-3xl font-black tracking-widest"
                  style={{
                    color: DECISION_DISPLAY[agent.decision!]?.color ?? colors.text,
                  }}
                >
                  {DECISION_DISPLAY[agent.decision!]?.text ?? agent.decision}
                </div>
                <div className="text-xs leading-relaxed mt-2" style={{ color: colors.text + "aa" }}>
                  {agent.reason}
                </div>
                <div
                  className="text-xs mt-2 px-3 py-1 border rounded"
                  style={{ borderColor: colors.text + "33", color: colors.text + "cc" }}
                >
                  {agent.advice}
                </div>
              </div>
            )}

          </>
        )}
      </div>

      {/* Winner badge */}
      {state === "winner" && (
        <div
          className="text-center py-2 text-xs font-bold tracking-[0.5em] border-t stamp-in"
          style={{
            borderColor: colors.border + "66",
            color: colors.text,
            background: colors.border + "22",
          }}
        >
          ★ CONSENSUS PICK ★
        </div>
      )}
    </div>
  );
}
