"use client";
import React, { useState } from "react";

// ─── Static Data from BAZ_ALL_APPS_EXPORT.json ───────────────────────────────

const BASE44_APPS = [
  { id: "69f0ecbea8b87cb75fe513c9", name: "BAZ Credit Hunter", description: "מנוע חיפוש וניהול קרדיטים AI — 82 כלים, מעקב קרדיטים, רישום תוכניות סטארטאפ", status: "active", url: "https://app.base44.com/apps/69f0ecbea8b87cb75fe513c9", action: "לשחזר כ-standalone על Hetzner — hunter.baz-f.co.il", priority: "high" },
  { id: "69dd307d9b66b56b793acc13", name: "CodeX Agent", description: "סוכן AI מרכזי — ניהול פרויקטים, משימות, integrations, vault", status: "active", url: "https://app.base44.com/superagent/69dd307d9b66b56b793acc13", action: "נשאר ב-Base44 — הוא המנוע הראשי", priority: "critical" },
  { id: "69f0e56a29498695bbdde207", name: "סופר חשבונית", description: "מערכת חשבוניות חכמה — יצירה, שליחה, מעקב", status: "exists", url: "https://app.base44.com/apps/69f0e56a29498695bbdde207", action: "לבדוק — האם פעיל? להחליט אם לשמר", priority: "medium" },
  { id: "69b71c806e0d14c955cb617a", name: "אורה (Ora)", description: "מנהל קופונים — חיפוש, שמירה, ניהול קופונים", status: "exists", url: "https://app.base44.com/apps/69b71c806e0d14c955cb617a", action: "להחליט אם רלוונטי לארגון", priority: "low" },
  { id: "695e1fc6481739066bc1d193", name: "Client Portfolio Manager", description: "ניהול תיקי לקוחות פיננסיים וביטוחיים — מעקב שינויים, הערות", status: "exists", url: "https://app.base44.com/apps/695e1fc6481739066bc1d193", action: "רלוונטי ל-Baz Finance — לשמר ולפתח", priority: "high" },
  { id: "68b4a9ed2550539a822e56c4", name: "Image2PDF Maestro", description: "צילום מסמכים → Drive + המרת תמונות ל-PDF", status: "exists", url: "https://app.base44.com/apps/68b4a9ed2550539a822e56c4", action: "שימושי ל-Baz Finance — לשמר", priority: "medium" },
  { id: "69b72b9d6dda3f720d5cdd55", name: "CouponFlow", description: "מערכת קופונים עסקית — ניהול, מעקב, אופטימיזציה של מבצעים", status: "exists", url: "https://app.base44.com/apps/69b72b9d6dda3f720d5cdd55", action: "אולי מוצר למכירה לעסקים", priority: "low" },
  { id: "68b4299087a1bb7adfa3a13d", name: "מנהל משימות", description: "מנהל משימות פשוט — TaskFlow", status: "exists", url: "https://app.base44.com/apps/68b4299087a1bb7adfa3a13d", action: "מיושן — CodeX מחליף אותו. להשמיד.", priority: "low" },
  { id: "68b48346b385e072762bb5ba", name: "Flowtask", description: "To-do app מינימליסטי — Kanban, XP, streaks", status: "exists", url: "https://app.base44.com/apps/68b48346b385e072762bb5ba", action: "מוצר מוכן למכירה — לשמר כ-template", priority: "medium" },
  { id: "69b8160183c571bdf76cf649", name: "BazPresent", description: "בונה מצגות AI לאנשי פיננסים וביטוח — תוך דקות", status: "exists", url: "https://app.base44.com/apps/69b8160183c571bdf76cf649", action: "מוצר מצוין — לשמר ולמכור", priority: "high" },
  { id: "697ce1215a6af19d5b61dff5", name: "מומחה העל של בז פיננסים", description: "גיבורי על ממותגים — יצירת תמונות, סצנות, תוכן", status: "exists", url: "https://app.base44.com/apps/697ce1215a6af19d5b61dff5", action: "חלק מ-Baz Marketing — לשמר לשיווק", priority: "medium" },
  { id: "69b2d37c7686c233fcdebc42", name: "FinMaster IL", description: "ניהול הון אישי, השקעות, תכנון פיננסי — עברית", status: "exists", url: "https://app.base44.com/apps/69b2d37c7686c233fcdebc42", action: "מוצר למכירה — לשמר", priority: "medium" },
  { id: "69b5af326059097d08a0e670", name: "Baz Solutions — Financial Intelligence", description: "Dashboard פיננסי מתקדם — insights, פוליסות, תכנון", status: "exists", url: "https://app.base44.com/apps/69b5af326059097d08a0e670", action: "לבדוק — אם ריק להשמיד", priority: "low" },
];

const EMPIRE_PROJECTS = [
  { name: "BAZ Credit Hunter",    status: "active",       category: "AI Tools" },
  { name: "Baz Finance",          status: "active",       category: "Finance" },
  { name: "Baz Automation",       status: "in_progress",  category: "Automation" },
  { name: "Baz Arsenal",          status: "in_progress",  category: "Tools" },
  { name: "Baz Multi-Sites",      status: "in_progress",  category: "Web" },
  { name: "Baz Knowledge",        status: "in_progress",  category: "AI" },
  { name: "Baz Sites",            status: "planning",     category: "Web" },
  { name: "Baz Marketing",        status: "planning",     category: "Marketing" },
  { name: "Baz Content",          status: "planning",     category: "Content" },
  { name: "Baz Design",           status: "planning",     category: "Design" },
  { name: "Baz Video",            status: "planning",     category: "Media" },
  { name: "Baz CRM",              status: "planning",     category: "Sales" },
  { name: "Baz Sales",            status: "planning",     category: "Sales" },
  { name: "Baz HR",               status: "planning",     category: "Operations" },
  { name: "Baz Legal",            status: "planning",     category: "Legal" },
  { name: "Baz Dev",              status: "planning",     category: "Dev" },
  { name: "Baz Data",             status: "planning",     category: "Data" },
  { name: "Baz Agents",           status: "planning",     category: "AI" },
  { name: "Baz Analytics",        status: "planning",     category: "Analytics" },
  { name: "Baz Forms",            status: "planning",     category: "Tools" },
  { name: "Baz Support",          status: "planning",     category: "Support" },
  { name: "Baz Systems",          status: "planning",     category: "Ops" },
  { name: "Baz Intelligence",     status: "planning",     category: "AI" },
  { name: "Baz Research",         status: "planning",     category: "Research" },
  { name: "Baz Helpdesk",         status: "planning",     category: "Support" },
  { name: "Baz Security",         status: "planning",     category: "Security" },
  { name: "Baz Learning",         status: "planning",     category: "Education" },
  { name: "Baz Events",           status: "planning",     category: "Events" },
  { name: "Baz Community",        status: "planning",     category: "Community" },
];

const AI_CREDITS = [
  { name: "Google Cloud Startup",    value: "$200,000",  status: "discovered" },
  { name: "Microsoft Azure Startup", value: "$150,000",  status: "discovered" },
  { name: "AWS Activate",            value: "$100,000",  status: "discovered" },
  { name: "xAI Grok (3 חשבונות)",   value: "$75",       status: "active" },
  { name: "NVIDIA Inception",        value: "$1,000+",   status: "discovered" },
];

// ─── Style Helpers ────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  active:      { label: "פעיל",       bg: "#14532d", color: "#4ade80" },
  in_progress: { label: "בפיתוח",     bg: "#1c2a00", color: "#a3e635" },
  exists:      { label: "קיים",       bg: "#1e3a5f", color: "#60a5fa" },
  planning:    { label: "תכנון",      bg: "#1c1a00", color: "#facc15" },
  discovered:  { label: "מזוהה",      bg: "#1c1a00", color: "#facc15" },
  critical:    { label: "קריטי",      bg: "#450a0a", color: "#f87171" },
};
const PRIORITY_COLOR: Record<string, string> = {
  critical: "#f87171", high: "#fb923c", medium: "#facc15", low: "#64748b",
};

type Tab = "apps" | "empire" | "credits";

export function Base44MasterView() {
  const [tab, setTab] = useState<Tab>("apps");

  const tabBtn = (id: Tab, label: string, accent: string) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: "8px 20px", borderRadius: "8px", cursor: "pointer",
        fontWeight: "bold", fontSize: "0.9rem",
        background: tab === id ? accent : "#0f172a",
        color: tab === id ? "#fff" : "#64748b",
        border: tab === id ? "none" : "1px solid #1e3a5f",
      }}
    >
      {label}
    </button>
  );

  const card: React.CSSProperties = {
    background: "#0f172a", borderRadius: "12px", padding: "16px",
    display: "flex", flexDirection: "column", gap: "8px",
  };

  return (
    <div dir="rtl" style={{ padding: "24px", color: "#e2e8f0", fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "#0a0f1e" }}>

      {/* Header */}
      <h1 style={{ fontSize: "1.6rem", color: "#facc15", fontWeight: "900", marginBottom: "4px" }}>
        ⚡ BAZ Empire — מרכז שליטה
      </h1>
      <p style={{ color: "#475569", fontSize: "0.8rem", marginBottom: "22px" }}>
        13 אפליקציות · 34 חברות · נתונים סטטיים · ללא API · ללא Login
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
        {tabBtn("apps",    "📦 13 אפליקציות",   "#1d4ed8")}
        {tabBtn("empire",  "🏛️ 34 חברות Empire", "#7c3aed")}
        {tabBtn("credits", "💰 קרדיטים AI",      "#d97706")}
      </div>

      {/* ── TAB: APPS ── */}
      {tab === "apps" && (
        <>
          <div style={{ display: "flex", gap: "12px", marginBottom: "18px", flexWrap: "wrap" }}>
            {[
              { label: "סה״כ", val: BASE44_APPS.length, color: "#94a3b8" },
              { label: "פעילות", val: BASE44_APPS.filter(a => a.status === "active").length, color: "#4ade80" },
              { label: "עדיפות גבוהה", val: BASE44_APPS.filter(a => a.priority === "high" || a.priority === "critical").length, color: "#fb923c" },
            ].map(s => (
              <div key={s.label} style={{ background: "#0f172a", border: `1px solid ${s.color}33`, borderRadius: "10px", padding: "10px 18px" }}>
                <p style={{ color: s.color, fontSize: "1.6rem", fontWeight: "900", fontFamily: "monospace" }}>{s.val}</p>
                <p style={{ color: "#475569", fontSize: "0.72rem" }}>{s.label}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
            {BASE44_APPS.map((app) => {
              const st = STATUS_STYLE[app.status] ?? STATUS_STYLE.exists;
              const pc = PRIORITY_COLOR[app.priority] ?? "#64748b";
              return (
                <div key={app.id} style={{ ...card, border: `1px solid ${pc}33` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <p style={{ fontWeight: "bold", fontSize: "0.92rem", lineHeight: 1.3, flex: 1 }}>{app.name}</p>
                    <span style={{ fontSize: "0.65rem", fontWeight: "bold", padding: "2px 7px", borderRadius: "99px", background: st.bg, color: st.color, whiteSpace: "nowrap" }}>
                      {st.label}
                    </span>
                  </div>
                  <p style={{ color: "#64748b", fontSize: "0.78rem", lineHeight: 1.45, flexGrow: 1 }}>{app.description}</p>
                  <p style={{ color: pc, fontSize: "0.72rem", borderTop: "1px solid #1e293b", paddingTop: "6px" }}>
                    ▶ {app.action}
                  </p>
                  <a
                    href={app.url} target="_blank" rel="noreferrer"
                    style={{ display: "block", textAlign: "center", background: "#1d4ed8", color: "white", padding: "7px", borderRadius: "8px", textDecoration: "none", fontSize: "0.82rem", fontWeight: "bold" }}
                  >
                    פתח אפליקציה ←
                  </a>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── TAB: EMPIRE ── */}
      {tab === "empire" && (
        <>
          <div style={{ display: "flex", gap: "12px", marginBottom: "18px", flexWrap: "wrap" }}>
            {[
              { label: "סה״כ חברות", val: EMPIRE_PROJECTS.length, color: "#818cf8" },
              { label: "פעילות",      val: EMPIRE_PROJECTS.filter(p => p.status === "active").length,      color: "#4ade80" },
              { label: "בפיתוח",      val: EMPIRE_PROJECTS.filter(p => p.status === "in_progress").length, color: "#a3e635" },
              { label: "תכנון",       val: EMPIRE_PROJECTS.filter(p => p.status === "planning").length,    color: "#facc15" },
            ].map(s => (
              <div key={s.label} style={{ background: "#0f172a", border: `1px solid ${s.color}33`, borderRadius: "10px", padding: "10px 18px" }}>
                <p style={{ color: s.color, fontSize: "1.6rem", fontWeight: "900", fontFamily: "monospace" }}>{s.val}</p>
                <p style={{ color: "#475569", fontSize: "0.72rem" }}>{s.label}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
            {EMPIRE_PROJECTS.map((proj) => {
              const st = STATUS_STYLE[proj.status] ?? STATUS_STYLE.planning;
              return (
                <div key={proj.name} style={{ ...card, border: `1px solid ${st.color}22`, flexDirection: "row", alignItems: "center", gap: "12px", padding: "12px 14px" }}>
                  <div style={{ flexGrow: 1 }}>
                    <p style={{ fontWeight: "bold", fontSize: "0.85rem" }}>{proj.name}</p>
                    <p style={{ color: "#475569", fontSize: "0.7rem", marginTop: "2px" }}>{proj.category}</p>
                  </div>
                  <span style={{ fontSize: "0.62rem", fontWeight: "bold", padding: "2px 7px", borderRadius: "99px", background: st.bg, color: st.color, whiteSpace: "nowrap" }}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── TAB: CREDITS ── */}
      {tab === "credits" && (
        <>
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
            {[
              { label: "סה״כ כלים",     val: "82",    color: "#facc15" },
              { label: "פעילים",         val: "8",     color: "#4ade80" },
              { label: "שווי משוערך",    val: "$807",  color: "#34d399" },
              { label: "Startup Credits", val: "3",    color: "#f59e0b" },
            ].map(s => (
              <div key={s.label} style={{ background: "#0f172a", border: `1px solid ${s.color}33`, borderRadius: "10px", padding: "10px 18px" }}>
                <p style={{ color: s.color, fontSize: "1.6rem", fontWeight: "900", fontFamily: "monospace" }}>{s.val}</p>
                <p style={{ color: "#475569", fontSize: "0.72rem" }}>{s.label}</p>
              </div>
            ))}
          </div>

          <h2 style={{ color: "#94a3b8", fontSize: "0.9rem", fontWeight: "bold", marginBottom: "14px" }}>
            🏆 הזדמנויות מובילות
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "560px" }}>
            {AI_CREDITS.map((c, i) => {
              const st = STATUS_STYLE[c.status] ?? STATUS_STYLE.discovered;
              return (
                <div key={c.name} style={{ ...card, border: "1px solid #1e3a5f", flexDirection: "row", alignItems: "center", gap: "14px", padding: "14px 16px" }}>
                  <span style={{ color: "#475569", fontFamily: "monospace", fontSize: "0.9rem", minWidth: "20px" }}>#{i + 1}</span>
                  <div style={{ flexGrow: 1 }}>
                    <p style={{ fontWeight: "bold", fontSize: "0.9rem" }}>{c.name}</p>
                  </div>
                  <p style={{ color: "#34d399", fontFamily: "monospace", fontWeight: "bold", fontSize: "1rem" }}>{c.value}</p>
                  <span style={{ fontSize: "0.62rem", fontWeight: "bold", padding: "2px 8px", borderRadius: "99px", background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: "28px", background: "#0f172a", border: "1px solid #134e4a", borderRadius: "12px", padding: "18px" }}>
            <p style={{ color: "#4ade80", fontWeight: "bold", marginBottom: "8px" }}>
              💡 פוטנציאל סה״כ: $450,000+
            </p>
            <p style={{ color: "#475569", fontSize: "0.82rem", lineHeight: 1.6 }}>
              Google Cloud + Azure + AWS Activate יחד = עד $450,000 קרדיטים לסטארטאפים.
              כולם פתוחים ברישום — דורש הגשת בקשה בשם BAZ-F Tech.
            </p>
            <a
              href="/hunter"
              style={{ display: "inline-block", marginTop: "14px", background: "#facc15", color: "#0a0f1e", fontWeight: "bold", padding: "8px 18px", borderRadius: "8px", textDecoration: "none", fontSize: "0.85rem" }}
            >
              🎯 פתח Hunter Hub המלא ←
            </a>
          </div>
        </>
      )}
    </div>
  );
}
