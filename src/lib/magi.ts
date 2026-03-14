import OpenAI from "openai";
import { agents, guardPrompt } from "./agents";

function getClient() {
  return new OpenAI();
}

type Message = { role: "user" | "assistant"; content: string };

type AskResult = {
  agent: string;
  action: "ask";
  question: string;
};

type VoteResult = {
  agent: string;
  action: "vote";
  decision: "찬성" | "반대";
  reason: string;
  advice: string;
};

type AgentResult = AskResult | VoteResult;

export type MagiResponse =
  | { phase: "blocked"; reason: string }
  | { phase: "greeting" }
  | { phase: "ask"; agents: AgentResult[] }
  | {
      phase: "vote";
      decision: string;
      votes: Record<string, number>;
      agents: AgentResult[];
    };

async function checkGuard(message: string): Promise<{ type: string; reason?: string }> {
  const res = await getClient().chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    messages: [
      { role: "system", content: guardPrompt },
      { role: "user", content: message },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(res.choices[0].message.content!);
}

async function callAgent(
  agent: (typeof agents)[number],
  messages: Message[]
): Promise<AgentResult> {
  const res = await getClient().chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    messages: [{ role: "system", content: agent.system }, ...messages],
    response_format: { type: "json_object" },
  });

  return JSON.parse(res.choices[0].message.content!);
}

export async function consult(messages: Message[]): Promise<MagiResponse> {
  const lastMessage = messages[messages.length - 1]?.content;
  // Skip guard when the user is replying to agent questions (history has assistant messages)
  const isFollowUp = messages.some((m) => m.role === "assistant");

  if (lastMessage && !isFollowUp) {
    const guard = await checkGuard(lastMessage);
    if (guard.type === "greeting") {
      return { phase: "greeting" };
    }
    if (guard.type === "blocked") {
      return { phase: "blocked", reason: guard.reason || "MAGI는 고민 상담만 가능합니다." };
    }
  }

  const results = await Promise.all(
    agents.map((agent) => callAgent(agent, messages))
  );

  const hasQuestion = results.some((r) => r.action === "ask");

  if (hasQuestion) {
    return { phase: "ask", agents: results.filter((r) => r.action === "ask") };
  }

  const votes: Record<string, number> = { 찬성: 0, 반대: 0 };
  results.forEach((r) => {
    if (r.action === "vote" && votes[r.decision] !== undefined) {
      votes[r.decision]++;
    }
  });

  const decision = Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];

  return { phase: "vote", decision, votes, agents: results };
}
