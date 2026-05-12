"use client";

import React, { useMemo } from "react";

/** פסי פעילות זעירים (sparks) — מבוססי seed יציב לכל חברה */
export function ActivitySpark({ seed }: { seed: number }) {
  const bars = useMemo(() => {
    const n = 10;
    const out: number[] = [];
    let x = Math.abs(seed * 9301 + 49297) % 233280;
    for (let i = 0; i < n; i++) {
      x = (x * 1103515245 + 12345) % 2147483647;
      out.push(4 + (x % 22));
    }
    return out;
  }, [seed]);

  return (
    <div
      aria-hidden
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "2px",
        height: "28px",
        opacity: 0.85,
      }}
    >
      {bars.map((h, i) => (
        <span
          key={i}
          style={{
            width: "3px",
            height: `${h}px`,
            borderRadius: "2px",
            background: "linear-gradient(180deg, #22d3ee 0%, #6366f1 100%)",
            animation: `spark-pulse ${1.2 + (i % 4) * 0.15}s ease-in-out infinite`,
            animationDelay: `${i * 0.08}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes spark-pulse {
          0%, 100% { opacity: 0.35; transform: scaleY(0.85); }
          50% { opacity: 1; transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
