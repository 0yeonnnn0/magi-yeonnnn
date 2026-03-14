import { NextRequest, NextResponse } from "next/server";
import { consult } from "@/lib/magi";
import { supabase } from "@/lib/supabase";

type Message = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const { message, sessionId } = await req.json();

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  // Get or create session
  let id = sessionId;
  if (!id) {
    const { data } = await supabase.from("sessions").insert({}).select("id").single();
    id = data?.id;
  }

  // Load history from DB
  const { data: rows } = await supabase
    .from("messages")
    .select("role, content")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  const history: Message[] = (rows ?? []).map((r) => ({
    role: r.role as "user" | "assistant",
    content: r.content,
  }));

  history.push({ role: "user", content: message });

  // Save user message
  await supabase.from("messages").insert({
    session_id: id,
    role: "user",
    content: message,
  });

  try {
    const result = await consult(history);

    if (result.phase === "greeting" || result.phase === "blocked") {
      // Remove user message from DB for non-consultation
      await supabase
        .from("messages")
        .delete()
        .eq("session_id", id)
        .eq("role", "user")
        .eq("content", message)
        .order("created_at", { ascending: false })
        .limit(1);

      return NextResponse.json({ sessionId: id, ...result });
    }

    // Save agent results
    if (result.phase === "ask") {
      const questions = result.agents
        .filter((a) => a.action === "ask")
        .map((a) => `${a.agent}: ${(a as { question: string }).question}`)
        .join("\n");

      await supabase.from("messages").insert({
        session_id: id,
        role: "assistant",
        content: questions,
        phase: "ask",
      });
    } else if (result.phase === "vote") {
      // Save each agent's vote
      for (const agent of result.agents) {
        if (agent.action === "vote") {
          await supabase.from("messages").insert({
            session_id: id,
            role: "assistant",
            content: agent.reason + "\n" + agent.advice,
            agent: agent.agent,
            phase: "vote",
            decision: agent.decision,
          });
        }
      }
    }

    return NextResponse.json({ sessionId: id, ...result });
  } catch (err) {
    console.error("MAGI error:", err);
    return NextResponse.json(
      { error: "MAGI system malfunction" },
      { status: 500 }
    );
  }
}
