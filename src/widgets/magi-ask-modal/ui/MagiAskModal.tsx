"use client";

import { useState, useRef, useEffect } from "react";

export type AgentQuestion = {
  agent: string;
  question: string;
};

interface MagiAskModalProps {
  questions: AgentQuestion[];
  onComplete: (answers: string) => void;
  onClose: () => void;
}

export function MagiAskModal({ questions, onComplete, onClose }: MagiAskModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(""));
  const [transitioning, setTransitioning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const current = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const progress = `${currentIndex + 1} / ${questions.length}`;

  useEffect(() => {
    textareaRef.current?.focus();
  }, [currentIndex]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 100) + "px";
    }
  }, [answers, currentIndex]);

  function handleNext() {
    if (!answers[currentIndex].trim() || transitioning) return;

    if (isLast) {
      const combined = questions
        .map((q, i) => `[${q.agent}] ${q.question}\n→ ${answers[i].trim()}`)
        .join("\n\n");
      onComplete(combined);
    } else {
      setTransitioning(true);
      setCurrentIndex((i) => i + 1);
      setTimeout(() => setTransitioning(false), 100);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80" />

      <div
        className="relative w-full max-w-md rounded-t-lg border-t border-x p-4 pb-6 animate-[slideUp_0.3s_ease-out]"
        style={{
          borderColor: "#ff6a0033",
          background: "#0a0a0a",
          paddingBottom: "max(24px, env(safe-area-inset-bottom))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full" style={{ background: "#ff6a0033" }} />
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] tracking-wider" style={{ color: "#ff6a0066" }}>
            QUESTION {progress}
          </span>
          <button
            onClick={onClose}
            className="text-[10px] px-2 py-1 active:opacity-60"
            style={{ color: "#ffffff44" }}
          >
            CLOSE
          </button>
        </div>

        {/* Agent name */}
        <div
          className="text-[12px] font-bold tracking-wider mb-2"
          style={{ color: "#ff6a00" }}
        >
          {current.agent}
        </div>

        {/* Question */}
        <div
          className="text-[14px] leading-relaxed mb-4"
          style={{ color: "#ffffffcc" }}
        >
          {current.question}
        </div>

        {/* Answer input */}
        <div
          className="flex items-end gap-2 border rounded px-3 py-2"
          style={{ borderColor: "#ff6a0033", background: "#ff6a0008" }}
        >
          <textarea
            ref={textareaRef}
            value={answers[currentIndex]}
            onChange={(e) => {
              const next = [...answers];
              next[currentIndex] = e.target.value;
              setAnswers(next);
            }}
            onKeyDown={handleKeyDown}
            placeholder="답변을 입력하세요..."
            rows={1}
            className="flex-1 bg-transparent text-[14px] placeholder:opacity-20 resize-none leading-snug"
            style={{ color: "#ff6a00", caretColor: "#ff6a00", outline: "none" }}
          />
          <button
            onClick={handleNext}
            disabled={!answers[currentIndex].trim()}
            className="px-3 py-1.5 text-[10px] tracking-widest border rounded-sm disabled:opacity-20 active:opacity-60 flex-shrink-0"
            style={{ borderColor: "#ff6a0044", color: "#ff6a00" }}
          >
            {isLast ? "SUBMIT" : "NEXT"}
          </button>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mt-3">
          {questions.map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                background: i < currentIndex ? "#ff6a00" : i === currentIndex ? "#ff6a00aa" : "#ff6a0033",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
