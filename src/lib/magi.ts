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
  persuaded?: boolean;
  finalDecision?: "찬성" | "반대";
  finalReason?: string;
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
  commenterName: string,
  perspective: string,
  targetAgent: string,
  targetDecision: string,
  targetReason: string,
): Promise<string> {
  const res = await getClient().chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    messages: [
      {
        role: "system",
        content: `너는 ${commenterName}이다. ${perspective} 관점의 시스템이다. 상대 시스템의 의견에 대해 한 줄로 짧게 첨언해. 반드시 JSON으로 응답: {"comment": "한 줄 첨언"}`,
      },
      {
        role: "user",
        content: `${targetAgent}의 의견 (${targetDecision}): ${targetReason}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(res.choices[0].message.content!).comment;
}

async function checkPersuasion(
  agentName: string,
  agentSystem: string,
  myDecision: string,
  myReason: string,
  opponentAgent: string,
  opponentDecision: string,
  opponentReason: string,
  opponentComment: string,
): Promise<{ persuaded: boolean; finalDecision: string; finalReason: string }> {
  const res = await getClient().chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    messages: [
      {
        role: "system",
        content: agentSystem + `\n\n추가 규칙: 상대의 논거를 듣고 설득되었는지 판단해. 설득되었으면 의견을 바꿀 수 있다. 반드시 JSON으로 응답:\n{"persuaded": true/false, "finalDecision": "찬성|반대", "finalReason": "한 줄로 최종 입장 정리"}`,
      },
      {
        role: "user",
        content: `네 원래 의견: ${myDecision} — ${myReason}\n\n${opponentAgent}의 반론 (${opponentDecision}): ${opponentReason}\n${opponentAgent}의 네 의견에 대한 첨언: ${opponentComment}\n\n상대의 논거를 듣고 의견이 바뀌었나?`,
      },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(res.choices[0].message.content!);
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

  // === ROUND 1: MELCHIOR(찬성) and CASPER(반대) vote first ===
  const order = [0, 2, 1]; // MELCHIOR, CASPER, BALTHASAR
  const results: AgentResult[] = [undefined!, undefined!, undefined!];
  const priorQuestions: string[] = [];

  // Call MELCHIOR and CASPER (not BALTHASAR yet)
  for (const idx of [0, 2]) {
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

  // BALTHASAR also needs to ask if others are asking
  const melchiorAsks = results[0]?.action === "ask";
  const casperAsks = results[2]?.action === "ask";

  if (melchiorAsks || casperAsks) {
    // BALTHASAR asks too
    const agentMessages = [...messages];
    if (priorQuestions.length > 0) {
      agentMessages.push({
        role: "assistant",
        content: `다른 시스템이 이미 한 질문 (중복하지 마):\n${priorQuestions.join("\n")}`,
      });
    }
    const balthasarResult = await callAgent(agents[1], agentMessages);
    results[1] = balthasarResult;

    return { phase: "ask", agents: results.filter((r) => r.action === "ask") };
  }

  const melchior = results[0] as VoteResult;
  const casper = results[2] as VoteResult;

  // === ROUND 2: Cross-comments ===
  const [melchiorOnCasper, casperOnMelchior] = await Promise.all([
    getCrossComment("MELCHIOR", "찬성", "CASPER", casper.decision, casper.reason),
    getCrossComment("CASPER", "반대", "MELCHIOR", melchior.decision, melchior.reason),
  ]);

  melchior.comments = [{ agent: "CASPER", comment: casperOnMelchior }];
  casper.comments = [{ agent: "MELCHIOR", comment: melchiorOnCasper }];

  // === ROUND 3: Persuasion check ===
  const [melchiorPersuasion, casperPersuasion] = await Promise.all([
    checkPersuasion(
      "MELCHIOR", agents[0].system,
      melchior.decision, melchior.reason,
      "CASPER", casper.decision, casper.reason, casperOnMelchior,
    ),
    checkPersuasion(
      "CASPER", agents[2].system,
      casper.decision, casper.reason,
      "MELCHIOR", melchior.decision, melchior.reason, melchiorOnCasper,
    ),
  ]);

  melchior.persuaded = melchiorPersuasion.persuaded;
  melchior.finalDecision = melchiorPersuasion.finalDecision as "찬성" | "반대";
  melchior.finalReason = melchiorPersuasion.finalReason;

  casper.persuaded = casperPersuasion.persuaded;
  casper.finalDecision = casperPersuasion.finalDecision as "찬성" | "반대";
  casper.finalReason = casperPersuasion.finalReason;

  // === ROUND 4: BALTHASAR sees everything and makes final judgment ===
  const debateTranscript = [
    ...messages,
    {
      role: "assistant" as const,
      content: [
        `[토론 기록]`,
        `MELCHIOR (초기: ${melchior.decision}): ${melchior.reason}`,
        `CASPER (초기: ${casper.decision}): ${casper.reason}`,
        ``,
        `[상호 첨언]`,
        `CASPER → MELCHIOR에 대해: ${casperOnMelchior}`,
        `MELCHIOR → CASPER에 대해: ${melchiorOnCasper}`,
        ``,
        `[설득 결과]`,
        `MELCHIOR 최종: ${melchior.finalDecision} (${melchior.persuaded ? "설득됨" : "유지"}) — ${melchior.finalReason}`,
        `CASPER 최종: ${casper.finalDecision} (${casper.persuaded ? "설득됨" : "유지"}) — ${casper.finalReason}`,
      ].join("\n"),
    },
  ];

  const balthasarResult = await callAgent(agents[1], debateTranscript) as VoteResult;
  results[1] = balthasarResult;

  // BALTHASAR gets comments from both sides about his judgment
  balthasarResult.comments = [
    { agent: "MELCHIOR", comment: `최종 입장: ${melchior.finalDecision} — ${melchior.finalReason}` },
    { agent: "CASPER", comment: `최종 입장: ${casper.finalDecision} — ${casper.finalReason}` },
  ];

  // === Final tally based on final decisions ===
  const votes: Record<string, number> = { 찬성: 0, 반대: 0 };
  votes[melchior.finalDecision!]++;
  votes[casper.finalDecision!]++;
  votes[balthasarResult.decision]++;

  const decision = Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];

  return { phase: "vote", decision, votes, agents: results };
}
