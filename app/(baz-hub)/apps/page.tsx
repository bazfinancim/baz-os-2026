"use client";

import React from "react";
import Link from "next/link";
import { useBazCompanies } from "@/src/components/HubBazCompaniesProvider";

const GROUP_META: Record<string, { label: string; color: string }> = {
  CORE_INFRA: { label: "ליבה", color: "#d97706" },
  DIGITAL_CREATIVE: { label: "דיגיטל ויצירה", color: "#6366f1" },
  AI_AUTOMATION: { label: "AI ואוטומציה", color: "#0284c7" },
  BUSINESS: { label: "שירותים עסקיים", color: "#16a34a" },
  KNOWLEDGE: { label: "ידע ומוצרים", color: "#ea580c" },
  EXPANDED: { label: "אימפריה מורחבת", color: "#c026d3" },
  GATES: { label: "שערים וליבה", color: "#dc2626" },
};

export default function AppsPage() {
  const COMPANIES = useBazCompanies();

  return (
    <div dir="rtl" style={{ padding: "24px 28px 48px", maxWidth: "1280px", margin: "0 auto", color: "#e2e8f0" }}>
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f8fafc", marginBottom: "6px" }}>
          אפליקציות BAZ
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
          {COMPANIES.length} ישויות מקובץ הנתונים baz_companies.json (Knowledge Core ב-Hub) — כל שורה היא מוצר/אפליקציה באימפריה.
        </p>
        <p
          style={{
            marginTop: "12px",
            fontSize: "0.82rem",
            color: "#c7d2fe",
            background: "rgba(30,27,75,0.5)",
            border: "1px solid rgba(99,102,241,0.35)",
            borderRadius: "10px",
            padding: "10px 14px",
            lineHeight: 1.5,
          }}
        >
          <strong>הפרדה מוחלטת:</strong> מסך זה מציג <strong>אך ורק</strong> את מפת המוצרים הפנימיים של BAZ — ללא רשימות ציד
          חיצוניות. לניהול כלים/קרדיטים שנצודו בשוק:{" "}
          <Link href="/hunter" style={{ color: "#a5b4fc", fontWeight: 700 }}>
            טאב Hunter
          </Link>
          . ניטור n8n לכל חברה:{" "}
          <Link href="/admin/status" style={{ color: "#a5b4fc", fontWeight: 700 }}>
            Gemini Eyes
          </Link>
          .
        </p>
      </header>

      <div
        style={{
          background: "#111118",
          border: "1px solid #1e293b",
          borderRadius: "12px",
          padding: "14px 18px",
          marginBottom: "22px",
          display: "flex",
          flexWrap: "wrap",
          gap: "12px 20px",
          alignItems: "center",
        }}
      >
        {Object.entries(GROUP_META).map(([key, meta]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: meta.color }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: meta.color }}>{meta.label}</span>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
              ({COMPANIES.filter((c) => c.group === key).length})
            </span>
          </div>
        ))}
      </div>

      {Object.entries(GROUP_META).map(([groupKey, meta]) => {
        const group = COMPANIES.filter((c) => c.group === groupKey);
        if (group.length === 0) return null;
        return (
          <section key={groupKey} style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ height: "3px", width: "24px", background: meta.color, borderRadius: "2px" }} />
              <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: meta.color, margin: 0 }}>
                {meta.label}
              </h2>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{group.length} אפליקציות</span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "12px",
              }}
            >
              {group.map((c) => (
                <article
                  key={c.id}
                  style={{
                    background: "#111118",
                    border: `1px solid ${meta.color}44`,
                    borderRadius: "12px",
                    padding: "14px 16px",
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                  }}
                >
                  <span style={{ fontSize: "1.5rem", lineHeight: 1 }} aria-hidden>
                    {c.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: "0.92rem", fontWeight: 700, margin: "0 0 4px", color: "#f1f5f9" }}>
                      {c.name}
                    </h3>
                    <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: 0, lineHeight: 1.45 }}>
                      {c.desc}
                    </p>
                    <p style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "8px" }}>
                      סטטוס: {c.status} · #{c.id}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
