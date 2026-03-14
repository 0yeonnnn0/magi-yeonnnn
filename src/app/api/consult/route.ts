import { NextRequest, NextResponse } from "next/server";
import { consult } from "@/lib/magi";
import { supabase } from "@/lib/supabase";

type Message = { role: "user" | "assistant"; content: string };

function classifyTopic(message: string): string {
  const m = message.toLowerCase();
  if (/연애|썸|고백|이별|재회|여자친구|남자친구|여친|남친|짝사랑|데이트/.test(m)) return "연애";
  if (/취업|이직|진로|직장|면접|회사|퇴사|커리어/.test(m)) return "진로/취업";
  if (/돈|투자|주식|코인|저축|대출|재정|월급/.test(m)) return "재정/투자";
  if (/공부|시험|학교|대학|수능|자격증|학업/.test(m)) return "학업";
  if (/건강|운동|다이어트|식단|병원|수면/.test(m)) return "건강";
  if (/친구|가족|부모|형제|인간관계|갈등/.test(m)) return "인간관계";
  return "기타";
}

export async function POST(req: NextRequest) {
  const { message, sessionId, deviceType } = await req.json();

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  // Extract headers
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  const language = req.headers.get("accept-language")?.split(",")[0] || "unknown";
  const referrer = req.headers.get("referer") || "direct";

  // Get or create session
  let id = sessionId;
  if (!id) {
    const topic = classifyTopic(message);
    const { data } = await supabase
      .from("sessions")
      .insert({
        ip,
        user_agent: userAgent,
        language,
        referrer,
        device_type: deviceType || "unknown",
        topic,
      })
      .select("id")
      .single();
    id = data?.id;
  } else {
    // Update last active
    await supabase
      .from("sessions")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", id);
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

      // Update session topic if not set
      const topic = classifyTopic(history[0]?.content || message);
      await supabase
        .from("sessions")
        .update({ topic })
        .eq("id", id)
        .is("topic", null);
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
