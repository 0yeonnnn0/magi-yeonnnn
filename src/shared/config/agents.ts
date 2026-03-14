export const AGENT_NAMES = ["MELCHIOR", "BALTHASAR", "CASPER"] as const;
export type AgentName = (typeof AGENT_NAMES)[number];

export const AGENT_COLORS: Record<
  AgentName,
  {
    border: string;
    bg: string;
    text: string;
    panelBg: string;
    glow: string;
    thinking: string;
    winner: string;
    readyPulse: string;
  }
> = {
  MELCHIOR: {
    border: "#ff3333",
    bg: "#1a0008",
    text: "#ff3333",
    panelBg: "#8de8a0",
    glow: "glow-green",
    thinking: "thinking-pulse",
    winner: "winner-green",
    readyPulse: "ready-pulse",
  },
  BALTHASAR: {
    border: "#6ec6ff",
    bg: "#000a1a",
    text: "#6ec6ff",
    panelBg: "#7db8e0",
    glow: "glow-blue",
    thinking: "thinking-pulse",
    winner: "winner-blue",
    readyPulse: "ready-pulse",
  },
  CASPER: {
    border: "#5cff8a",
    bg: "#001a08",
    text: "#5cff8a",
    panelBg: "#8de8a0",
    glow: "glow-green",
    thinking: "thinking-pulse",
    winner: "winner-green",
    readyPulse: "ready-pulse",
  },
};

export const AGENT_LABELS: Record<AgentName, string> = {
  MELCHIOR: "MELCHIOR·1",
  BALTHASAR: "BALTHASAR·2",
  CASPER: "CASPER·3",
};

export const DECISION_DISPLAY: Record<string, { text: string; color: string }> = {
  찬성: { text: "APPROVE", color: "#5cff8a" },
  반대: { text: "DENY", color: "#ff3333" },
};
