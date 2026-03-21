"use client";

import { useState, useRef, useEffect } from "react";

interface MagiChatProps {
  onSend: (message: string) => void;
  onRetry: () => void;
  loading: boolean;
  showRetry: boolean;
}

export function MagiChat({ onSend, onRetry, loading, showRetry }: MagiChatProps) {
  const [choices, setChoices] = useState<string[]>(["", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function updateChoice(index: number, value: string) {
    setChoices((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function removeChoice(index: number) {
    if (choices.length <= 2) return;
    setChoices((prev) => prev.filter((_, i) => i !== index));
  }

  function addChoice() {
    setChoices((prev) => [...prev, ""]);
    setTimeout(() => {
      const lastInput = inputRefs.current[choices.length];
      lastInput?.focus();
    }, 50);
  }

  function buildQuestion(): string {
    const filled = choices.map((c) => c.trim()).filter(Boolean);
    return filled.join(" vs ");
  }

  function handleSubmit() {
    const question = buildQuestion();
    if (!question || loading) return;
    const filledCount = choices.filter((c) => c.trim()).length;
    if (filledCount < 2) return;
    onSend(question);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Enter") {
      e.preventDefault();
      const filledCount = choices.filter((c) => c.trim()).length;
      if (filledCount >= 2) {
        handleSubmit();
      } else {
        if (index === choices.length - 1) {
          addChoice();
        } else {
          inputRefs.current[index + 1]?.focus();
        }
      }
    } else if (e.key === "Backspace" && !choices[index] && choices.length > 2) {
      e.preventDefault();
      removeChoice(index);
      setTimeout(() => {
        inputRefs.current[Math.max(0, index - 1)]?.focus();
      }, 50);
    }
  }

  const question = buildQuestion();
  const filledCount = choices.filter((c) => c.trim()).length;
  const canSend = filledCount >= 2 && !loading;

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      style={{
        borderTop: "1.5px solid #ff6a0066",
        background: "#050505",
      }}
    >
      {/* Choice cards area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
      >
        {/* Question label */}
        <div
          className="text-center text-[12px] tracking-wider pb-1"
          style={{ color: question ? "#ff6a00aa" : "#ff6a0044" }}
        >
          {question ? `${question} ?` : "선택지를 입력하세요"}
        </div>

        {/* Choice inputs */}
        {choices.map((choice, i) => (
          <div key={i} className="relative group">
            <input
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              value={choice}
              onChange={(e) => updateChoice(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              placeholder={`선택지 ${i + 1}`}
              disabled={loading}
              className="w-full px-4 py-3 text-sm bg-transparent rounded-sm outline-none placeholder:opacity-30 disabled:opacity-20"
              style={{
                color: "#ff6a00",
                border: choice.trim()
                  ? "1.5px solid #ff6a0088"
                  : "1.5px solid #ff6a0033",
                caretColor: "#ff6a00",
              }}
            />
            {choices.length > 2 && (
              <button
                onClick={() => removeChoice(i)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] opacity-0 group-hover:opacity-60 active:opacity-100 transition-opacity px-1"
                style={{ color: "#ff6a00" }}
                tabIndex={-1}
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {/* Add choice button */}
        <button
          onClick={addChoice}
          disabled={loading}
          className="w-full py-3 text-sm tracking-wider rounded-sm disabled:opacity-20 active:opacity-60 transition-opacity"
          style={{
            color: "#ff6a0066",
            border: "1.5px dashed #ff6a0033",
          }}
        >
          +
        </button>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2" style={{ paddingBottom: "max(4px, env(safe-area-inset-bottom))" }}>
          {showRetry && (
            <button
              onClick={onRetry}
              disabled={loading}
              className="flex-1 py-3 text-[11px] tracking-widest border rounded-sm disabled:opacity-20 active:opacity-60 transition-opacity"
              style={{ borderColor: "#ff6a0066", color: "#ff6a00" }}
            >
              RETRY
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!canSend}
            className="flex-1 py-3 text-[11px] tracking-widest border rounded-sm disabled:opacity-20 active:opacity-60 transition-opacity"
            style={{
              borderColor: canSend ? "#ff6a00" : "#ff6a0033",
              color: canSend ? "#ff6a00" : "#ff6a0033",
            }}
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  );
}
