"use client";

interface MagiHeaderProps {
  loading: boolean;
  deliberation?: string;
}

export function MagiHeader({ loading, deliberation }: MagiHeaderProps) {
  return (
    <div className="px-3 pt-2 pb-1" style={{ color: "#ff6a00" }}>
      {/* Top system info — matching the anime screen */}
      <div className="flex items-start justify-between">
        <div className="text-[9px] leading-relaxed" style={{ color: "#ff6a00cc" }}>
          <div className="font-bold text-[11px]" style={{ color: "#ff6a00" }}>定期検診</div>
          <div>CODE : <span style={{ color: "#ff6a00" }}>127</span></div>
          <div>FILE : AKAGI_CHK</div>
          <div>EX_MODE : ON</div>
          <div>PRIORITY : A──</div>
        </div>
        <div className="text-right text-[9px] leading-relaxed">
          <div className="font-bold text-[11px]" style={{ color: "#ff6a00" }}>定期検診</div>
          <div style={{ color: "#ff6a00aa" }}>
            STATUS: {loading ? (
              <span className="blink" style={{ color: "#ff3333" }}>ACTIVE</span>
            ) : (
              <span>STANDBY</span>
            )}
          </div>
          {deliberation && (
            <div
              className="mt-0.5 px-1.5 py-0.5 border text-[8px] tracking-wider inline-block"
              style={{
                borderColor: "#ff6a0066",
                color: loading ? "#ff6a00" : "#5cff8a",
                background: "#ff6a0011",
              }}
            >
              {deliberation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
