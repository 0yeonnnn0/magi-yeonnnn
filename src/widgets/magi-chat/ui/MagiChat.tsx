"use client";

import { useState, useRef, useEffect } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "system";
  content: string;
  agent?: string;
  tappable?: boolean;
  hint?: boolean;
};

interface MagiChatProps {
  onSend: (message: string) => void;
  loading: boolean;
  messages: ChatMessage[];
  onTappableClick?: () => void;
}

export function MagiChat({ onSend, loading, messages, onTappableClick }: MagiChatProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 60) + "px";
    }
  }, [input]);

  function handleSubmit() {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div
      className="flex flex-col border-t flex-1 min-h-0"
      style={{
        borderColor: "#ff6a0033",
        background: "#050505",
      }}
    >
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 && !loading && (
          <div className="text-[12px] text-center py-6" style={{ color: "#ff6a0033" }}>
            당신의 고민은 무엇인가요? MAGI가 분석해드립니다.
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded text-xs ${msg.tappable ? "cursor-pointer active:opacity-70" : ""}`}
              style={{
                background: msg.role === "user" ? "#ff6a0012" : "#ffffff06",
                color: msg.role === "user" ? "#ff6a00" : "#ff6a00aa",
                border: `1px solid ${msg.role === "user" ? "#ff6a0033" : (msg.tappable || msg.hint) ? "#ff6a0033" : "#ffffff0e"}`,
              }}
              onClick={msg.tappable ? onTappableClick : undefined}
            >
              {msg.role === "system" && (
                <span className="text-[10px] block mb-1" style={{ color: "#ff6a0044" }}>
                  MAGI &gt;
                </span>
              )}
              <span className="whitespace-pre-wrap">{msg.content}</span>
              {msg.tappable && (
                <span className="text-[10px] block mt-1.5" style={{ color: "#ff6a0055" }}>
                  ▶ 탭하여 답변
                </span>
              )}
              {msg.hint && (
                <span className="text-[10px] block mt-1.5" style={{ color: "#ff6a0055" }}>
                  ▶ 모델을 탭하여 상세 의견 보기
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex justify-start">
            <div
              className="px-3 py-2 rounded text-xs"
              style={{ background: "#ffffff06", border: "1px solid #ffffff0e" }}
            >
              <span className="text-[10px] block mb-1" style={{ color: "#ff6a0044" }}>
                MAGI &gt;
              </span>
              <span style={{ color: "#ff6a00aa" }}>분석중</span>
              <span className="inline-flex ml-1 gap-[2px] align-middle">
                <span className="dot-1 inline-block w-1 h-1 rounded-full" style={{ background: "#ff6a00aa" }} />
                <span className="dot-2 inline-block w-1 h-1 rounded-full" style={{ background: "#ff6a00aa" }} />
                <span className="dot-3 inline-block w-1 h-1 rounded-full" style={{ background: "#ff6a00aa" }} />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="flex items-end gap-2 px-3 py-2 border-t"
        style={{ borderColor: "#ff6a0022", paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
      >
        <span className="text-[10px] py-1" style={{ color: "#ff6a0033" }}>{">"}</span>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="고민을 입력하세요..."
          disabled={loading}
          rows={1}
          className="flex-1 bg-transparent text-sm placeholder:opacity-20 resize-none leading-snug overflow-y-auto"
          style={{ color: "#ff6a00", caretColor: "#ff6a00", outline: "none", maxHeight: "60px" }}
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !input.trim()}
          className="px-3 py-1.5 text-[10px] tracking-widest border rounded-sm disabled:opacity-20 active:opacity-60 flex-shrink-0"
          style={{ borderColor: "#ff6a0044", color: "#ff6a00" }}
        >
          SEND
        </button>
      </div>
    </div>
  );
}

export type { ChatMessage };
