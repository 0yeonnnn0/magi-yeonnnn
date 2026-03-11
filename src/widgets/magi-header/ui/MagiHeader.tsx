"use client";

interface MagiHeaderProps {
  loading: boolean;
  deliberation?: string;
}

export function MagiHeader({ loading, deliberation }: MagiHeaderProps) {
  return (
    <div className="px-3 pt-2 pb-1 text-[9px] sm:text-[10px] leading-relaxed" style={{ color: "#00ff4188" }}>
      {/* Top system info — matching the anime screen */}
      <div className="border-b pb-1 mb-1" style={{ borderColor: "#00ff4122" }}>
        <div style={{ color: "#00ff4155" }}>DIRECT LINE CONNECTION — MAGI</div>
        <div>ACCESS MODE : <span style={{ color: "#00ff41" }}>SUPERUSER</span></div>
      </div>
      <div className="border-b pb-1 mb-1" style={{ borderColor: "#00ff4122" }}>
        <div style={{ color: "#00ff4155" }}>RESULT OF THE DELIBERATION</div>
        <div>MOTION : <span style={{ color: loading ? "#ff9100" : "#00ff41" }}>
          {loading ? "ANALYZING..." : deliberation ?? "AWAITING INPUT"}
        </span></div>
      </div>
      <div className="flex gap-4" style={{ color: "#00ff4144" }}>
        <span>MAGI.SYS</span>
        <span>STATUS: {loading ? <span className="blink" style={{ color: "#ff9100" }}>ACTIVE</span> : "STANDBY"}</span>
        <span>PRIORITY: AAA</span>
      </div>
    </div>
  );
}
