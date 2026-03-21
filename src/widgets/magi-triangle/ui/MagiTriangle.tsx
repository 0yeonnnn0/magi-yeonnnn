"use client";

import { AGENT_LABELS, DECISION_DISPLAY, type AgentName } from "@/shared/config";
import type { AgentResult } from "@/shared/api";
import type { PanelState } from "@/widgets/magi-panel";

interface MagiTriangleProps {
  panelStates: PanelState[];
  agents: (AgentResult | undefined)[];
  onPanelClick: (index: number) => void;
  winnerIndex: number | null;
  loading: boolean;
  deliberation?: string;
  onRetry?: () => void;
  showRetry?: boolean;
  winnerDecision?: string;
}

const NEUTRAL = { panelBg: "#b0b0b0" };
const COLOR_A = { bg: "#7db8e0", text: "#6ec6ff", winner: "winner-blue", dark: "#003366" };
const COLOR_B = { bg: "#e08080", text: "#ff4444", winner: "winner-red", dark: "#660000" };

function getTeamColor(agent?: AgentResult, winnerDecision?: string) {
  if (!agent || agent.action !== "vote") return null;
  // First unique decision = A (blue), other = B (red)
  if (agent.decision === winnerDecision) return COLOR_A;
  return COLOR_B;
}

// Clip paths matching the anime:
// BALTHASAR: rectangle with bottom-left & bottom-right corners cut (shield pointing down)
// CASPER: rectangle with top-right corner cut
// MELCHIOR: rectangle with top-left corner cut
const CLIP_PATHS = {
  top: "polygon(0% 0%, 100% 0%, 100% 65%, 70% 100%, 30% 100%, 0% 65%)",
  "bottom-left": "polygon(0% 0%, 64% 0%, 100% 35%, 100% 100%, 0% 100%)",
  "bottom-right": "polygon(36% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 35%)",
};

function PanelBox({
  name,
  state,
  agent,
  onClick,
  variant,
  winnerDecision,
}: {
  name: AgentName;
  state: PanelState;
  agent?: AgentResult;
  onClick: () => void;
  variant: "top" | "bottom-left" | "bottom-right";
  winnerDecision?: string;
}) {
  const label = AGENT_LABELS[name];
  const clickable = state === "ready" || state === "selected" || state === "winner";

  const isThinking = state === "thinking";
  const isWinner = state === "winner";
  const isReady = state === "ready";
  const isRevealed = state === "selected" || state === "winner";

  const team = getTeamColor(agent, winnerDecision);
  const panelBg = isRevealed && team ? team.bg : NEUTRAL.panelBg;
  const clip = CLIP_PATHS[variant];

  return (
    <div
      className={`relative w-full h-full ${clickable ? "cursor-pointer active:scale-[0.97]" : ""} transition-transform duration-150`}
      onClick={clickable ? onClick : undefined}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {/* Outer shape (border effect) */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          clipPath: clip,
          background: isThinking
            ? `linear-gradient(135deg, ${NEUTRAL.panelBg}44, ${NEUTRAL.panelBg}22)`
            : isRevealed
              ? panelBg
              : isReady
                ? `${NEUTRAL.panelBg}88`
                : `${NEUTRAL.panelBg}22`,
          animation: isThinking
            ? "thinking-pulse 1.2s ease-in-out infinite"
            : isWinner
              ? `${team?.winner ?? "winner-green"} 1.5s ease-in-out infinite`
              : isReady
                ? "ready-pulse 1.5s ease-in-out infinite"
                : undefined,
        }}
      />

      {/* Inner panel */}
      <div
        className="absolute inset-[3px] flex flex-col items-center justify-center transition-all duration-500"
        style={{
          clipPath: clip,
          background: isThinking
            ? `${NEUTRAL.panelBg}11`
            : isRevealed
              ? `${panelBg}dd`
              : isReady
                ? `${NEUTRAL.panelBg}55`
                : `${NEUTRAL.panelBg}15`,
        }}
      >
        {/* Agent label */}
        <div
          className="text-[12px] font-bold tracking-wider mb-1"
          style={{
            color: isRevealed ? "#000000cc" : isReady ? "#ffffffaa" : "#ffffff33",
          }}
        >
          {label}
        </div>

        {/* Status content */}
        {state === "idle" && (
          <span className="text-[10px]" style={{ color: "#ffffff22" }}>—</span>
        )}

        {state === "thinking" && (
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: "#ffffff22", borderTopColor: "#ffffffaa" }}
          />
        )}

        {state === "ready" && (
          <span className="blink text-lg font-bold" style={{ color: "#ffffffaa" }}>▶</span>
        )}

        {isRevealed && agent?.action === "vote" && (
          <div
            className="text-[10px] font-black tracking-wider stamp-in text-center px-1"
            style={{ color: team?.dark ?? "#003322" }}
          >
            {agent.decision}
          </div>
        )}

        {/* Winner badge */}
        {isWinner && (
          <div
            className="text-[8px] tracking-[0.2em] mt-1 stamp-in"
            style={{ color: team?.text ?? "#5cff8a" }}
          >
            ★ SELECTED
          </div>
        )}
      </div>
    </div>
  );
}

export function MagiTriangle({ panelStates, agents, onPanelClick, winnerIndex, loading, deliberation, onRetry, showRetry, winnerDecision }: MagiTriangleProps) {
  return (
    <div className="relative w-full" style={{ height: "min(280px, 40dvh)" }}>
      {/* System info — left of BALTHASAR */}
      <div
        className="absolute z-20 text-[10px] leading-relaxed"
        style={{ top: 4, left: 6, color: "#ff6a00cc" }}
      >
        <div className="font-bold text-[14px]" style={{ color: "#ff6a00" }}>苦悩解決</div>
        <div>CODE : 127</div>
        <div>FILE : AKAGI_CHK</div>
        <div>PRIORITY : A──</div>
      </div>

      {/* System info — right of BALTHASAR */}
      <div
        className="absolute z-20 text-[10px] leading-relaxed text-right"
        style={{ top: 4, right: 6, color: "#ff6a00aa" }}
      >
        <div className="font-bold text-[14px]" style={{ color: "#ff6a00" }}>苦悩解決</div>
        <div>
          STATUS: {loading ? (
            <span className="blink" style={{ color: "#ff3333" }}>ACTIVE</span>
          ) : "STANDBY"}
        </div>
        {deliberation && (
          <div
            className="mt-0.5 px-1 py-0.5 border text-[8px] tracking-wider inline-block"
            style={{
              borderColor: "#ff6a0066",
              color: loading ? "#ff6a00" : "#5cff8a",
              background: "#ff6a0011",
            }}
          >
            {deliberation}
          </div>
        )}
        {showRetry && onRetry && (
          <button
            className="mt-1.5 px-2 py-1 border text-[8px] tracking-wider block ml-auto active:opacity-60"
            style={{ borderColor: "#ff6a0066", color: "#ff6a00", background: "#ff6a0011" }}
            onClick={onRetry}
          >
            RESET ⟲
          </button>
        )}
      </div>

      {/* SVG connecting lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1, pointerEvents: "none" }}
      >
        {/* BALTHASAR bottom-left cut → CASPER top-right cut */}
        <line x1="38%" y1="47%" x2="33.5%" y2="57.5%" stroke="#ff6a00" strokeWidth="2.5" />
        {/* BALTHASAR bottom-right cut → MELCHIOR top-left cut */}
        <line x1="62%" y1="47%" x2="66.5%" y2="57.5%" stroke="#ff6a00" strokeWidth="2.5" />
        {/* CASPER right edge → MELCHIOR left edge */}
        <line x1="43.6%" y1="75%" x2="56.4%" y2="75%" stroke="#ff6a00" strokeWidth="2.5" />
        <text
          x="50%"
          y="64%"
          textAnchor="middle"
          fill="#ff3333"
          fontSize="13"
          fontWeight="bold"
          fontFamily="Courier New, monospace"
          letterSpacing="3"
        >
          MAGI
        </text>
      </svg>

      {/* BALTHASAR — top center */}
      <div
        className="absolute z-10"
        style={{ top: 20, left: "50%", transform: "translateX(-50%)", width: "42%", height: "46%" }}
      >
        <PanelBox
          name="BALTHASAR"
          state={panelStates[1]}
          agent={agents[1]}
          onClick={() => onPanelClick(1)}
          variant="top"
          winnerDecision={winnerDecision}
        />
      </div>

      {/* CASPER — bottom left */}
      <div
        className="absolute z-10"
        style={{ bottom: 16, left: "2%", width: "42%", height: "42%" }}
      >
        <PanelBox
          name="CASPER"
          state={panelStates[2]}
          agent={agents[2]}
          onClick={() => onPanelClick(2)}
          variant="bottom-left"
          winnerDecision={winnerDecision}
        />
      </div>

      {/* MELCHIOR — bottom right */}
      <div
        className="absolute z-10"
        style={{ bottom: 16, right: "2%", width: "42%", height: "42%" }}
      >
        <PanelBox
          name="MELCHIOR"
          state={panelStates[0]}
          agent={agents[0]}
          onClick={() => onPanelClick(0)}
          variant="bottom-right"
          winnerDecision={winnerDecision}
        />
      </div>
    </div>
  );
}
