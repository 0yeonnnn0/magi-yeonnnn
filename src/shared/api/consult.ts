export type AgentResult = {
  agent: string;
  action: "ask" | "vote";
  question?: string;
  decision?: string;
  reason?: string;
  advice?: string;
};

export type MagiResponse = {
  sessionId: string;
  phase: "ask" | "vote" | "blocked";
  decision?: string;
  votes?: Record<string, number>;
  agents?: AgentResult[];
  reason?: string;
};

export async function consultMagi(
  message: string,
  sessionId: string | null
): Promise<MagiResponse> {
  const res = await fetch("/api/consult", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId }),
  });

  if (!res.ok) throw new Error("MAGI system malfunction");
  return res.json();
}
