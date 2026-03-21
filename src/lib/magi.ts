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

function parseOptions(message: string): string[] {
  return message
    .split(/\s+vs\s+/i)
    .map((s) => s.replace(/[?.!，。？！]+$/, "").trim())
    .filter(Boolean);
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

  const options = lastMessage ? parseOptions(lastMessage) : [];
  const isMultiOption = options.length >= 3;

  let results: AgentResult[];

  if (isMultiOption) {
    // Step 1: First 2 agents vote in parallel
    const [first, second] = await Promise.all([
      callAgent(agents[0], messages),
      callAgent(agents[1], messages),
    ]);

    // Step 2: If they picked the same option, 3rd agent votes freely
    if (first.decision === second.decision) {
      const third = await callAgent(agents[2], messages);
      results = [first, second, third];
    } else {
      // Step 3: Restrict 3rd agent to only the 2 options chosen by first 2
      const twoOptions = [first.decision, second.decision];
      const restrictedMessages: Message[] = [
        ...messages.slice(0, -1),
        {
          role: "user" as const,
          content: `${twoOptions[0]} vs ${twoOptions[1]}`,
        },
      ];
      const third = await callAgent(agents[2], restrictedMessages);
      results = [first, second, third];
    }
  } else {
    // 2 options: all 3 agents vote in parallel as before
    results = await Promise.all(
      agents.map((agent) => callAgent(agent, messages))
    );
  }

  // Count votes by decision
  const votes: Record<string, number> = {};
  results.forEach((r) => {
    votes[r.decision] = (votes[r.decision] || 0) + 1;
  });

  const decision = Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];

  return { phase: "vote", decision, votes, agents: results };
}
