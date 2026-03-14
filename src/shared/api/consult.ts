export type AgentResult = {
  agent: string;
  action: "ask" | "vote";
  question?: string;
  decision?: string;
  reason?: string;
  advice?: string;
  comments?: { agent: string; comment: string }[];
};

export type MagiResponse = {
  sessionId: string;
  phase: "ask" | "vote" | "blocked" | "greeting";
  decision?: string;
  votes?: Record<string, number>;
  agents?: AgentResult[];
  reason?: string;
};

function getDeviceType(): string {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobile|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

export async function consultMagi(
  message: string,
  sessionId: string | null
): Promise<MagiResponse> {
  const res = await fetch("/api/consult", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      sessionId,
      deviceType: getDeviceType(),
    }),
  });

  if (!res.ok) throw new Error("MAGI system malfunction");
  return res.json();
}
