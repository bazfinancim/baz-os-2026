import type { ReactNode } from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div
      dir="rtl"
      lang="he"
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse 120% 80% at 50% -20%, #1e1b4b 0%, #06060f 45%, #020208 100%)",
        color: "#e2e8f0",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid rgba(99,102,241,0.25)",
          padding: "14px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          background: "rgba(6,6,15,0.85)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "1.4rem" }} aria-hidden>
            ◆
          </span>
          <div>
            <p style={{ margin: 0, fontWeight: 900, fontSize: "1.05rem", letterSpacing: "0.02em" }}>
              Gemini Control Center
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "#64748b" }}>Eyes · Hands · Knowledge</p>
          </div>
        </div>
        <Link
          href="/apps"
          style={{
            color: "#94a3b8",
            textDecoration: "none",
            fontSize: "0.82rem",
            border: "1px solid rgba(148,163,184,0.35)",
            borderRadius: "8px",
            padding: "6px 14px",
          }}
        >
          ← Hub
        </Link>
      </header>
      <div style={{ padding: "22px 20px 40px", maxWidth: "1280px", margin: "0 auto" }}>{children}</div>
    </div>
  );
}
