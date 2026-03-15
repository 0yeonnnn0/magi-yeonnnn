import OpenAI from "openai";
import { agents, guardPrompt } from "./agents";

function getClient() {
  return new OpenAI();
}

type Message = { role: "user" | "assistant"; content: string };

type VoteResult = {
  agent: string;
  action: "vote";
  decision: string;
  reason: string;
  advice: string;
};

type AgentResult = VoteResult;

export type MagiResponse =
  | { phase: "blocked"; reason: string }
  | { phase: "greeting" }
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

  if (lastMessage) {
    const guard = await checkGuard(lastMessage);
    if (guard.type === "greeting") {
      return { phase: "greeting" };
    }
    if (guard.type === "blocked") {
      return { phase: "blocked", reason: guard.reason || "밸런스게임 질문을 입력해주세요." };
    }
  }

  // All 3 agents vote in parallel
  const results = await Promise.all(
    agents.map((agent) => callAgent(agent, messages))
  );

  // Count votes by decision
  const votes: Record<string, number> = {};
  results.forEach((r) => {
    votes[r.decision] = (votes[r.decision] || 0) + 1;
  });

  const decision = Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];

  return { phase: "vote", decision, votes, agents: results };
}
