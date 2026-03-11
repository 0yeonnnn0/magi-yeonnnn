import { NextRequest, NextResponse } from "next/server";
import { consult } from "@/lib/magi";

type Message = { role: "user" | "assistant"; content: string };

const sessions = new Map<string, Message[]>();

export async function POST(req: NextRequest) {
  const { message, sessionId } = await req.json();

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const id = sessionId || crypto.randomUUID();
  const history = sessions.get(id) || [];

  history.push({ role: "user", content: message });

  try {
    const result = await consult(history);

    if (result.phase === "blocked") {
      // Don't save blocked messages to history
      history.pop();
      return NextResponse.json({ sessionId: id, ...result });
    }

    if (result.phase === "ask") {
      const questions = result.agents
        .filter((a) => a.action === "ask")
        .map((a) => `${a.agent}: ${a.question}`)
        .join("\n");
      history.push({ role: "assistant", content: questions });
    }

    sessions.set(id, history);
    return NextResponse.json({ sessionId: id, ...result });
  } catch (err) {
    console.error("MAGI error:", err);
    return NextResponse.json(
      { error: "MAGI system malfunction" },
      { status: 500 }
    );
  }
}
