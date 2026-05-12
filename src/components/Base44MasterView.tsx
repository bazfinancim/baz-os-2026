"use client";

import React, { useMemo } from "react";
import discoveredTools from "@/src/data/discovered_tools.json";

/** עומק כמו shell.mainBg — בלי globals.css */
const ENGINE_DEPTH_BG =
  "radial-gradient(ellipse 100% 80% at 50% -10%, rgba(49, 46, 129, 0.35) 0%, #07070f 42%, #040406 100%)";

const HUNTER_INTEL_URL = "https://app.base44.com/apps/69f0ecbea8b87cb75fe513c9";

/**
 * שער Launchpad לטאב Base במסך הראשי — ללא טבלאות/iframe שבורים.
 * מועצת המוחות: מסך יוקרתי + כפתור שיגור ל־Base44 Hunter.
 */
export function Base44MasterView() {
  const toolCount = useMemo(() => {
    const raw = discoveredTools as unknown[] | { tools?: unknown[] };
    if (Array.isArray(raw)) return raw.length;
    return Array.isArray((raw as { tools?: unknown[] }).tools) ? (raw as { tools: unknown[] }).tools.length : 0;
  }, []);

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100%",
        background: ENGINE_DEPTH_BG,
        color: "#e2e8f0",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "clamp(24px, 5vw, 48px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      {/* נקודות עומק עדינות (לא CSS גלובלי) */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.12) 0%, transparent 55%), radial-gradient(1px 1px at 78% 22%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(1px 1px at 55% 80%, rgba(165,180,252,0.15) 0%, transparent 45%)",
          opacity: 0.9,
          zIndex: 0,
        }}
      />

      <section
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "640px",
          borderRadius: "20px",
          padding: "clamp(28px, 4vw, 40px)",
          background: "linear-gradient(145deg, rgba(15,23,42,0.72) 0%, rgba(15,23,42,0.45) 100%)",
          border: "1px solid rgba(129, 140, 248, 0.28)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset",
          backdropFilter: "blur(12px)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "0.65rem",
            letterSpacing: "0.28em",
            fontWeight: 800,
            color: "rgba(250, 204, 21, 0.85)",
            textTransform: "uppercase",
          }}
        >
          Base44 · Hunter Intel
        </p>
        <h1 style={{ margin: "12px 0 0", fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 900, lineHeight: 1.2, color: "#f8fafc" }}>
          שער השיגור
        </h1>
        <p style={{ margin: "14px 0 0", fontSize: "0.92rem", lineHeight: 1.65, color: "#94a3b8", maxWidth: "52ch" }}>
          מאגר המקורי ב־BAZ מסונכרן עם <strong style={{ color: "#cbd5e1" }}>{toolCount}</strong> כלי Intel. פתח את מנוע Base44
          בטאב נפרד — ללא iframe וללא טבלאות שבורות.
        </p>

        <div style={{ marginTop: "28px", display: "flex", flexDirection: "column", gap: "14px", alignItems: "stretch" }}>
          <a
            href={HUNTER_INTEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "16px 22px",
              borderRadius: "14px",
              fontWeight: 800,
              fontSize: "0.95rem",
              textDecoration: "none",
              color: "#0f172a",
              background: "linear-gradient(135deg, #fde047 0%, #facc15 40%, #eab308 100%)",
              border: "1px solid rgba(250, 204, 21, 0.5)",
              boxShadow: "0 12px 40px rgba(234, 179, 8, 0.35)",
            }}
          >
            🚀 פתח Hunter Intel Engine (מנוע מקורי)
          </a>
          <p style={{ margin: 0, fontSize: "0.72rem", color: "#64748b", textAlign: "center" }}>
            נפתח בטאב חדש · app.base44.com
          </p>
        </div>
      </section>
    </div>
  );
}
