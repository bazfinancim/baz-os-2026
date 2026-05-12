"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  { href: "/apps", label: "אפליקציות", hint: "מוצרי BAZ בלבד (baz_companies)", icon: "📱" },
  { href: "/hunter", label: "Hunter", hint: "ציד חיצוני (discovered_tools)", icon: "🎯" },
  { href: "/whatsapp", label: "WhatsApp Hub", hint: "הודעות ו-n8n", icon: "💬" },
  { href: "/wip", label: "WIP — בעבודה", hint: "פיתוח", icon: "🛠️" },
] as const;

export function HubLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <aside
        style={{
          width: "240px",
          flexShrink: 0,
          background: "#ffffff",
          borderLeft: "1px solid #e2e8f0",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ marginBottom: "20px", padding: "0 8px" }}>
          <p style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: "4px" }}>BAZ OS</p>
          <p style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.3 }}>
            Master Hub
          </p>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: active ? 700 : 500,
                  color: active ? "#1d4ed8" : "#475569",
                  background: active ? "#eff6ff" : "transparent",
                  border: active ? "1px solid #bfdbfe" : "1px solid transparent",
                }}
              >
                <span aria-hidden>{item.icon}</span>
                <span style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                  <span>{item.label}</span>
                  <span style={{ fontSize: "0.65rem", fontWeight: 400, color: active ? "#3b82f6" : "#94a3b8", lineHeight: 1.2 }}>
                    {item.hint}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        <p style={{ marginTop: "auto", fontSize: "0.65rem", color: "#94a3b8", padding: "8px" }}>
          Baz-F Tech · 2026
        </p>
      </aside>

      <main
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "auto",
          background: "#f8fafc",
        }}
      >
        {children}
      </main>
    </div>
  );
}
