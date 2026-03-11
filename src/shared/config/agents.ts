export const AGENT_NAMES = ["MELCHIOR", "BALTHASAR", "CASPER"] as const;
export type AgentName = (typeof AGENT_NAMES)[number];

export const AGENT_COLORS: Record<
  AgentName,
  {
    border: string;
    bg: string;
    text: string;
    glow: string;
    thinking: string;
    winner: string;
    readyPulse: string;
  }
> = {
  MELCHIOR: {
    border: "#ff1744",
    bg: "#1a0008",
    text: "#ff1744",
    glow: "glow-red",
    thinking: "thinking-red",
    winner: "winner-red",
    readyPulse: "ready-pulse-red",
  },
  BALTHASAR: {
    border: "#2979ff",
    bg: "#000a1a",
    text: "#2979ff",
    glow: "glow-blue",
    thinking: "thinking-blue",
    winner: "winner-blue",
    readyPulse: "ready-pulse-blue",
  },
  CASPER: {
    border: "#00ff41",
    bg: "#001a08",
    text: "#00ff41",
    glow: "glow-green",
    thinking: "thinking-green",
    winner: "winner-green",
    readyPulse: "ready-pulse-green",
  },
};

export const AGENT_LABELS: Record<AgentName, string> = {
  MELCHIOR: "MELCHIOR-1",
  BALTHASAR: "BALTHASAR-2",
  CASPER: "CASPER-3",
};

export const DECISION_DISPLAY: Record<string, { text: string; color: string }> = {
  찬성: { text: "APPROVE", color: "#00ff41" },
  반대: { text: "DENY", color: "#ff1744" },
  보류: { text: "HOLD", color: "#ff9100" },
};
