"use client";
import React, { useState } from "react";

const BASE_URL = "https://app.base44.com/apps";
const AGENT_URL = "https://app.base44.com/superagent";

const APPS = [
  { name: "Client Portfolio Manager", id: "695e1fc6481739066bc1d193", desc: "ניהול תיקי לקוחות" },
  { name: "Image2PDF Maestro",        id: "68b4a9ed2550539a822e56c4", desc: "צילום מסמכים → PDF" },
  { name: "סופר חשבונית",            id: "69f0e56a29498695bbdde207", desc: "ניהול חשבוניות" },
  { name: "BazPresent",               id: "69b8160183c571bdf76cf649", desc: "מצגות AI לפיננסים" },
  { name: "מנהל משימות",             id: "68b4299087a1bb7adfa3a13d", desc: "ניהול משימות" },
  { name: "מומחה העל של בז פיננסים", id: "697ce1215a6af19d5b61dff5", desc: "צוות מומחים" },
  { name: "FinMaster IL",             id: "69b2d37c7686c233fcdebc42", desc: "ניהול הון אישי" },
  { name: "CouponFlow",               id: "69b72b9d6dda3f720d5cdd55", desc: "ניהול קופונים" },
  { name: "יצירת גיבורים",           id: "696a3fc6571492e56c5f57ed", desc: "פוסטרים וסרטונים" },
  { name: "Baz Heroes Manager",       id: "69b2d6deb40117ae3ecee1aa", desc: "ניהול גיבורי בז" },
  { name: "Baz Solutions — Financial Intelligence", id: "69b5af326059097d08a0e670", desc: "ניהול פיננסי מתקדם" },
  { name: "Flowtask",                 id: "68b48346b385e072762bb5ba", desc: "משימות מינימליסטי" },
  { name: "CodeX — App",              id: "69dd50efc0d082b88ab254a2", desc: "CodeX App" },
  { name: "בייס (Base)",              id: "69b1b93d4721ba14065bbedc", desc: "גיבורים ולוגים" },
];

const AGENTS = [
  { name: "CodeX",                     id: "69dd307d9b66b56b793acc13", desc: "הסוכן הראשי של האימפריה" },
  { name: "סופר חשבונית",             id: "69f0e56a29498695bbdde207", desc: "סוכן חשבוניות" },
  { name: "הסופר סוכן של בני חבסוב",  id: "69b6a494706c1c8dce4eb64d", desc: "סוכן בני" },
  { name: "בייס (Base)",               id: "69b1b93d4721ba14065bbedc", desc: "סוכן Base" },
  { name: "אורה (Ora)",               id: "69b71c806e0d14c955cb617a", desc: "סוכנת קופונים" },
];

type Tab = "apps" | "agents";

export function Base44Dashboard() {
  const [tab, setTab] = useState<Tab>("apps");

  const tabBtn = (id: Tab, label: string) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: "8px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold",
        fontSize: "0.92rem",
        background: tab === id ? "#1d4ed8" : "#0f172a",
        color: tab === id ? "white" : "#64748b",
        border: tab === id ? "none" : "1px solid #1e3a5f",
      }}
    >
      {label}
    </button>
  );

  const card: React.CSSProperties = {
    background: "#0f172a",
    borderRadius: "12px", padding: "16px",
    display: "flex", flexDirection: "column", gap: "8px",
  };

  return (
    <div dir="rtl" style={{ padding: "28px", color: "#e2e8f0", fontFamily: "inherit", minHeight: "100vh" }}>
      <div style={{ marginBottom: "8px" }}>
        <h1 style={{ fontSize: "1.8rem", color: "#818cf8", fontWeight: "bold" }}>
          📦 Base44 Ecosystem
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "4px" }}>
          כל האפליקציות והסוכנים — ללא Hunter. Hunter פועל בנפרד.
        </p>
      </div>
      <a href="/" style={{ color: "#475569", fontSize: "0.8rem", textDecoration: "none", display: "inline-block", marginBottom: "24px" }}>
        ← חזור לפאנל ראשי
      </a>

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        {tabBtn("apps", "📦 כל האפליקציות")}
        {tabBtn("agents", "🤖 סוכנים")}
      </div>

      {tab === "apps" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
          {APPS.map((app) => (
            <div key={app.id} style={{ ...card, border: "1px solid #1e3a5f" }}>
              <p style={{ fontWeight: "bold", fontSize: "0.92rem" }}>{app.name}</p>
              <p style={{ color: "#64748b", fontSize: "0.82rem", flexGrow: 1 }}>{app.desc}</p>
              <a
                href={`${BASE_URL}/${app.id}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: "#1d4ed8", color: "white",
                  padding: "7px 14px", borderRadius: "8px",
                  textDecoration: "none", textAlign: "center",
                  fontSize: "0.85rem",
                }}
              >
                פתח ←
              </a>
            </div>
          ))}
        </div>
      )}

      {tab === "agents" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
          {AGENTS.map((agent) => (
            <div key={agent.id} style={{ ...card, border: "1px solid #4c1d95" }}>
              <p style={{ fontWeight: "bold", fontSize: "0.92rem" }}>🤖 {agent.name}</p>
              <p style={{ color: "#64748b", fontSize: "0.82rem", flexGrow: 1 }}>{agent.desc}</p>
              <a
                href={`${AGENT_URL}/${agent.id}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: "#7c3aed", color: "white",
                  padding: "7px 14px", borderRadius: "8px",
                  textDecoration: "none", textAlign: "center",
                  fontSize: "0.85rem",
                }}
              >
                פתח סוכן ←
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
