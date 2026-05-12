import React from "react";
import COMPANIES_RAW from "@/src/data/baz_companies.json";

type Company = {
  id: number;
  name: string;
  icon: string;
  status: string;
  group: string;
  desc: string;
};

const COMPANIES = COMPANIES_RAW as Company[];

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
  return (
    <div dir="rtl" style={{ padding: "24px 28px 48px", maxWidth: "1280px", margin: "0 auto" }}>
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginBottom: "6px" }}>
          אפליקציות BAZ
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
          {COMPANIES.length} ישויות מקומיות מ־<code style={{ fontSize: "0.8rem" }}>baz_companies.json</code> — כל
          שורה היא מוצר/אפליקציה באימפריה.
        </p>
      </header>

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
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
            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
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
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{group.length} אפליקציות</span>
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
                    background: "#ffffff",
                    border: `1px solid ${meta.color}33`,
                    borderRadius: "12px",
                    padding: "14px 16px",
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                    boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                  }}
                >
                  <span style={{ fontSize: "1.5rem", lineHeight: 1 }} aria-hidden>
                    {c.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: "0.92rem", fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>
                      {c.name}
                    </h3>
                    <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0, lineHeight: 1.45 }}>
                      {c.desc}
                    </p>
                    <p style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: "8px" }}>
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
