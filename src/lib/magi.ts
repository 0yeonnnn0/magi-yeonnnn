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
  comments?: { agent: string; comment: string }[];
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

async function checkGuard(message: string, context?: string): Promise<{ type: string; reason?: string }> {
  const userContent = context
    ? `[context: 이전 질문들]\n${context}\n\n[사용자 답변]\n${message}`
    : message;

  const res = await getClient().chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    messages: [
      { role: "system", content: guardPrompt },
      { role: "user", content: userContent },
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

async function getCrossComment(
  commenterAgent: (typeof agents)[number],
  targetAgent: string,
  targetDecision: string,
  targetReason: string,
): Promise<string> {
  const res = await getClient().chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    messages: [
      {
        role: "system",
        content: `너는 ${commenterAgent.name}이다. 다른 시스템의 의견에 대해 한 줄로 짧게 첨언해. 네 관점(${commenterAgent.name === "MELCHIOR" ? "찬성" : commenterAgent.name === "CASPER" ? "반대" : "중립"})에서 코멘트해. 반드시 JSON으로 응답: {"comment": "한 줄 첨언"}`,
      },
      {
        role: "user",
        content: `${targetAgent}의 의견 (${targetDecision}): ${targetReason}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(res.choices[0].message.content!);
  return parsed.comment;
}

export async function consult(messages: Message[]): Promise<MagiResponse> {
  const lastMessage = messages[messages.length - 1]?.content;
  const isFollowUp = messages.some((m) => m.role === "assistant");

  if (lastMessage) {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    const guard = await checkGuard(lastMessage, isFollowUp ? lastAssistant?.content : undefined);

    if (guard.type === "greeting" && !isFollowUp) {
      return { phase: "greeting" };
    }
    if (guard.type === "blocked") {
      return {
        phase: "blocked",
        reason: isFollowUp ? "정상적인 답변을 작성해주세요." : (guard.reason || "MAGI는 고민 상담만 가능합니다."),
      };
    }
  }

  // Call agents sequentially: MELCHIOR → CASPER → BALTHASAR
  const order = [0, 2, 1];
  const results: AgentResult[] = [undefined!, undefined!, undefined!];
  const priorQuestions: string[] = [];

  for (const idx of order) {
    const agent = agents[idx];
    const agentMessages = [...messages];

    if (priorQuestions.length > 0) {
      agentMessages.push({
        role: "assistant",
        content: `다른 시스템이 이미 한 질문 (중복하지 마):\n${priorQuestions.join("\n")}`,
      });
    }

    const result = await callAgent(agent, agentMessages);
    results[idx] = result;

    if (result.action === "ask") {
      priorQuestions.push(`- ${result.agent}: ${result.question}`);
    }
  }

  const hasQuestion = results.some((r) => r.action === "ask");

  if (hasQuestion) {
    return { phase: "ask", agents: results.filter((r) => r.action === "ask") };
  }

  // Cross-comment round: for each agent's opinion, other agents comment on it
  for (let targetIdx = 0; targetIdx < 3; targetIdx++) {
    const target = results[targetIdx];
    if (target.action !== "vote") continue;

    const comments: { agent: string; comment: string }[] = [];
    const otherIndices = [0, 1, 2].filter((i) => i !== targetIdx);

    const commentResults = await Promise.all(
      otherIndices.map(async (commenterIdx) => {
        const comment = await getCrossComment(
          agents[commenterIdx],
          target.agent,
          target.decision,
          target.reason,
        );
        return { agent: agents[commenterIdx].name, comment };
      })
    );

    comments.push(...commentResults);
    (target as VoteResult).comments = comments;
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
