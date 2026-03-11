"use client";

import { useState, useRef, useEffect } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "system";
  content: string;
};

interface MagiChatProps {
  onSend: (message: string) => void;
  loading: boolean;
  messages: ChatMessage[];
}

export function MagiChat({ onSend, loading, messages }: MagiChatProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleSubmit() {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  }

  return (
    <div
      className="flex flex-col border-t flex-shrink-0"
      style={{ borderColor: "#1a3a1a", background: "#060e06", height: "40vh", minHeight: "200px" }}
    >
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 && !loading && (
          <div className="text-[10px] text-center py-6" style={{ color: "#00ff4133" }}>
            고민을 입력하면 MAGI가 분석을 시작합니다
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[85%] px-3 py-2 rounded text-xs sm:text-sm"
              style={{
                background: msg.role === "user" ? "#00ff4115" : "#ffffff08",
                color: msg.role === "user" ? "#00ff41" : "#00ff41aa",
                border: `1px solid ${msg.role === "user" ? "#00ff4133" : "#ffffff11"}`,
              }}
            >
              {msg.role === "system" && (
                <span className="text-[10px] block mb-1" style={{ color: "#00ff4155" }}>
                  MAGI &gt;
                </span>
              )}
              <span className="whitespace-pre-wrap">{msg.content}</span>
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex justify-start">
            <div
              className="px-3 py-2 rounded text-xs sm:text-sm"
              style={{ background: "#ffffff08", border: "1px solid #ffffff11" }}
            >
              <span className="text-[10px] block mb-1" style={{ color: "#00ff4155" }}>
                MAGI &gt;
              </span>
              <span style={{ color: "#00ff41aa" }}>MAGI가 답변을 준비중입니다</span>
              <span className="inline-flex ml-1 gap-[2px] align-middle">
                <span className="dot-1 inline-block w-1 h-1 rounded-full" style={{ background: "#00ff41aa" }} />
                <span className="dot-2 inline-block w-1 h-1 rounded-full" style={{ background: "#00ff41aa" }} />
                <span className="dot-3 inline-block w-1 h-1 rounded-full" style={{ background: "#00ff41aa" }} />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-t"
        style={{ borderColor: "#1a3a1a" }}
      >
        <span className="text-[10px]" style={{ color: "#00ff4144" }}>{">"}</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="고민을 입력하세요..."
          disabled={loading}
          className="flex-1 bg-transparent outline-none text-sm placeholder:opacity-30"
          style={{ color: "#00ff41", caretColor: "#00ff41" }}
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !input.trim()}
          className="px-3 py-1.5 text-[10px] tracking-widest border rounded-sm disabled:opacity-20 active:opacity-60"
          style={{ borderColor: "#00ff4144", color: "#00ff41" }}
        >
          SEND
        </button>
      </div>
    </div>
  );
}

export type { ChatMessage };
