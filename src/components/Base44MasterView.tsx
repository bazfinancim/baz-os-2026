"use client";
import React, { useState } from "react";

const HUNTER_ID = "69f0ecbea8b87cb75fe513c9";
const BASE_URL = "https://app.base44.com/apps";
const AGENT_URL = "https://app.base44.com/superagent";

const apps = [
  { name: "Client Portfolio Manager", id: "695e1fc6481739066bc1d193", desc: "ניהול תיקי לקוחות" },
  { name: "Image2PDF Maestro", id: "68b4a9ed2550539a822e56c4", desc: "צילום מסמכים → PDF" },
  { name: "סופר חשבונית", id: "69f0e56a29498695bbdde207", desc: "ניהול חשבוניות" },
  { name: "BazPresent", id: "69b8160183c571bdf76cf649", desc: "מצגות AI לפיננסים" },
  { name: "מנהל משימות", id: "68b4299087a1bb7adfa3a13d", desc: "ניהול משימות" },
  { name: "מומחה העל של בז פיננסים", id: "697ce1215a6af19d5b61dff5", desc: "צוות מומחים" },
  { name: "FinMaster IL", id: "69b2d37c7686c233fcdebc42", desc: "ניהול הון אישי" },
  { name: "CouponFlow", id: "69b72b9d6dda3f720d5cdd55", desc: "ניהול קופונים" },
  { name: "יצירת גיבורים", id: "696a3fc6571492e56c5f57ed", desc: "פוסטרים וסרטונים" },
  { name: "Baz Heroes Manager", id: "69b2d6deb40117ae3ecee1aa", desc: "ניהול גיבורי בז" },
  { name: "Baz Solutions - Financial Intelligence", id: "69b5af326059097d08a0e670", desc: "ניהול פיננסי מתקדם" },
  { name: "Flowtask", id: "68b48346b385e072762bb5ba", desc: "משימות מינימליסטי" },
  { name: "CodeX — App", id: "69dd50efc0d082b88ab254a2", desc: "CodeX App" },
  { name: "בייס (Base)", id: "69b1b93d4721ba14065bbedc", desc: "גיבורים ולוגים" },
];

const agents = [
  { name: "CodeX", id: "69dd307d9b66b56b793acc13", desc: "הסוכן הראשי של האימפריה" },
  { name: "סופר חשבונית", id: "69f0e56a29498695bbdde207", desc: "סוכן חשבוניות" },
  { name: "הסופר סוכן של בני חבסוב", id: "69b6a494706c1c8dce4eb64d", desc: "סוכן בני" },
  { name: "בייס (Base)", id: "69b1b93d4721ba14065bbedc", desc: "סוכן Base" },
  { name: "אורה (Ora)", id: "69b71c806e0d14c955cb617a", desc: "סוכנת קופונים" },
];

export function Base44MasterView() {
  const [tab, setTab] = useState<"hunter" | "apps" | "agents">("hunter");

  const tabStyle = (active: boolean) => ({
    padding: "8px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" as const,
    background: active ? "#1d4ed8" : "#0f172a", color: active ? "white" : "#64748b",
    border: active ? "none" : "1px solid #1e3a5f", fontSize: "0.95rem",
  });

  return (
    <div dir="rtl" style={{ padding: "24px", color: "#e2e8f0", fontFamily: "inherit" }}>
      <h1 style={{ fontSize: "1.5rem", color: "#facc15", marginBottom: "20px" }}>
        ⚡ Base44 — כל מה שנבנה
      </h1>
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <button style={tabStyle(tab === "hunter")} onClick={() => setTab("hunter")}>🎯 Credit Hunter</button>
        <button style={tabStyle(tab === "apps")} onClick={() => setTab("apps")}>📦 כל האפליקציות</button>
        <button style={tabStyle(tab === "agents")} onClick={() => setTab("agents")}>🤖 סוכנים</button>
      </div>

      {tab === "hunter" && (
        <iframe src={`${BASE_URL}/${HUNTER_ID}`} width="100%" height="780px"
          style={{ border: "none", borderRadius: "12px", display: "block" }} />
      )}

      {tab === "apps" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {apps.map(app => (
            <div key={app.id} style={{ background: "#0f172a", border: "1px solid #1e3a5f",
              borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontWeight: "bold" }}>{app.name}</div>
              <div style={{ color: "#64748b", fontSize: "0.85rem", flexGrow: 1 }}>{app.desc}</div>
              <a href={`${BASE_URL}/${app.id}`} target="_blank" rel="noreferrer"
                style={{ background: "#1d4ed8", color: "white", padding: "8px 14px",
                  borderRadius: "8px", textDecoration: "none", textAlign: "center" }}>
                פתח ←
              </a>
            </div>
          ))}
        </div>
      )}

      {tab === "agents" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {agents.map(agent => (
            <div key={agent.id} style={{ background: "#0f172a", border: "1px solid #7c3aed",
              borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontWeight: "bold" }}>🤖 {agent.name}</div>
              <div style={{ color: "#64748b", fontSize: "0.85rem", flexGrow: 1 }}>{agent.desc}</div>
              <a href={`${AGENT_URL}/${agent.id}`} target="_blank" rel="noreferrer"
                style={{ background: "#7c3aed", color: "white", padding: "8px 14px",
                  borderRadius: "8px", textDecoration: "none", textAlign: "center" }}>
                פתח סוכן ←
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
