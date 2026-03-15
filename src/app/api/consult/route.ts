import { NextRequest, NextResponse } from "next/server";
import { consult } from "@/lib/magi";
import { supabase } from "@/lib/supabase";

type Message = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const { message, sessionId, deviceType } = await req.json();

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  const language = req.headers.get("accept-language")?.split(",")[0] || "unknown";
  const referrer = req.headers.get("referer") || "direct";

  let id = sessionId;
  if (!id) {
    const { data } = await supabase
      .from("sessions")
      .insert({
        ip,
        user_agent: userAgent,
        language,
        referrer,
        device_type: deviceType || "unknown",
        topic: "밸런스게임",
      })
      .select("id")
      .single();
    id = data?.id;
  } else {
    await supabase
      .from("sessions")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", id);
  }

  // Save user message
  await supabase.from("messages").insert({
    session_id: id,
    role: "user",
    content: message,
  });

  try {
    // Load conversation history from DB
    const { data: rows } = await supabase
      .from("messages")
      .select("role, content")
      .eq("session_id", id)
      .order("created_at", { ascending: true });

    const history: Message[] = (rows ?? []).map((r) => ({
      role: r.role as "user" | "assistant",
      content: r.content,
    }));

    const result = await consult(history);

    if (result.phase === "greeting" || result.phase === "blocked") {
      return NextResponse.json({ sessionId: id, ...result });
    }

    // Save votes
    if (result.phase === "vote") {
      for (const agent of result.agents) {
        await supabase.from("messages").insert({
          session_id: id,
          role: "assistant",
          content: agent.decision,
          agent: agent.agent,
          phase: "vote",
          decision: agent.decision,
        });
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
