"use client";

import { AGENT_COLORS, AGENT_LABELS, DECISION_DISPLAY, type AgentName } from "@/shared/config";
import type { AgentResult } from "@/shared/api";
import type { PanelState } from "@/widgets/magi-panel";

interface MagiTriangleProps {
  panelStates: PanelState[];
  agents: (AgentResult | undefined)[];
  onPanelClick: (index: number) => void;
  winnerIndex: number | null;
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

/**
 * Individual MAGI panel — styled like the anime screen:
 * Agent name on top, stamp box below
 */
function PanelBox({
  name,
  state,
  agent,
  onClick,
}: {
  name: AgentName;
  state: PanelState;
  agent?: AgentResult;
  onClick: () => void;
}) {
  const colors = AGENT_COLORS[name];
  const label = AGENT_LABELS[name];
  const clickable = state === "ready" || state === "selected" || state === "winner";

  return (
    <div
      className={`flex flex-col items-center gap-1.5 ${clickable ? "cursor-pointer active:scale-95" : ""} transition-transform`}
      onClick={clickable ? onClick : undefined}
    >
      {/* Agent name */}
      <div
        className="text-[11px] sm:text-xs font-bold tracking-widest"
        style={{ color: colors.text }}
      >
        {label}
      </div>

      {/* Stamp box — the main visual element */}
      <div
        className="w-[80px] h-[50px] sm:w-[100px] sm:h-[60px] border-2 flex items-center justify-center"
        style={{
          borderColor: state === "winner" ? colors.border : colors.border + "66",
          background: state === "winner" ? colors.border + "22" : "#0a0a0a",
          animation: getAnimation(name, state),
        }}
      >
        {state === "idle" && (
          <span className="text-[10px]" style={{ color: colors.text + "22" }}>—</span>
        )}

        {state === "thinking" && (
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: colors.border + "33", borderTopColor: colors.text }}
          />
        )}

        {state === "ready" && (
          <span className="blink text-base" style={{ color: colors.text }}>▶</span>
        )}

        {(state === "selected" || state === "winner") && agent?.action === "vote" && (
          <div
            className="text-sm sm:text-base font-black tracking-wider stamp-in"
            style={{ color: DECISION_DISPLAY[agent.decision!]?.color ?? colors.text }}
          >
            {DECISION_DISPLAY[agent.decision!]?.text ?? agent.decision}
          </div>
        )}

        {(state === "selected" || state === "winner") && agent?.action === "ask" && (
          <span className="text-xs stamp-in" style={{ color: colors.text }}>?</span>
        )}
      </div>

      {/* Winner indicator */}
      {state === "winner" && (
        <div
          className="text-[8px] tracking-[0.3em] stamp-in"
          style={{ color: colors.text }}
        >
          ★ SELECTED
        </div>
      )}
    </div>
  );
}

export function MagiTriangle({ panelStates, agents, onPanelClick }: MagiTriangleProps) {
  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-[340px] sm:max-w-[400px] mx-auto">
      {/* BALTHASAR — top */}
      <PanelBox
        name="BALTHASAR"
        state={panelStates[1]}
        agent={agents[1]}
        onClick={() => onPanelClick(1)}
      />

      {/* Connecting lines top */}
      <svg width="200" height="30" viewBox="0 0 200 30" className="sm:w-[240px]">
        <line x1="100" y1="0" x2="40" y2="30" stroke="#00ff4133" strokeWidth="1" />
        <line x1="100" y1="0" x2="160" y2="30" stroke="#00ff4133" strokeWidth="1" />
      </svg>

      {/* MAGI center label */}
      <div
        className="text-xs sm:text-sm font-bold tracking-[0.5em] -my-1"
        style={{ color: "#00ff4188" }}
      >
        MAGI
      </div>

      {/* Connecting lines bottom */}
      <svg width="200" height="30" viewBox="0 0 200 30" className="sm:w-[240px]">
        <line x1="40" y1="0" x2="40" y2="30" stroke="#00ff4133" strokeWidth="1" />
        <line x1="160" y1="0" x2="160" y2="30" stroke="#00ff4133" strokeWidth="1" />
        <line x1="40" y1="30" x2="160" y2="30" stroke="#00ff4133" strokeWidth="1" />
      </svg>

      {/* CASPER & MELCHIOR — bottom row */}
      <div className="flex justify-between w-full px-2">
        <PanelBox
          name="CASPER"
          state={panelStates[2]}
          agent={agents[2]}
          onClick={() => onPanelClick(2)}
        />
        <PanelBox
          name="MELCHIOR"
          state={panelStates[0]}
          agent={agents[0]}
          onClick={() => onPanelClick(0)}
        />
      </div>
    </div>
  );
}
