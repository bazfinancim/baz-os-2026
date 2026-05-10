"use client";
import React, { useEffect, useState } from "react";

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
  { name: "Baz Solutions", id: "69b5af326059097d08a0e670", desc: "ניהול פיננסי מתקדם" },
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

const WEBHOOKS = [
  {
    label: "מספר שיווק",
    phone: "054-829-4343",
    url: "https://n8n.baz-f.co.il/webhook/whatsapp-meta-829",
    color: "#16a34a",
  },
  {
    label: "מספר משרד",
    phone: "054-555-9934",
    url: "https://n8n.baz-f.co.il/webhook/whatsapp-meta-555",
    color: "#2563eb",
  },
];

type Program = { id?: string; _id?: string; name?: string; status?: string; credit_value?: string; category?: string };
type Project = { id?: string; _id?: string; name?: string; status?: string; next_step?: string };

function HunterTab() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/base44/projects")
      .then((r) => r.json())
      .then((d: { ok: boolean; programs?: Program[]; projects?: Project[]; error?: string }) => {
        if (d.ok) {
          setPrograms(d.programs ?? []);
          setProjects(d.projects ?? []);
        } else {
          setError(d.error ?? "שגיאה בטעינה");
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const s: React.CSSProperties = {
    background: "#0f172a", border: "1px solid #1e3a5f",
    borderRadius: "12px", padding: "14px",
    display: "flex", flexDirection: "column", gap: "6px",
  };

  if (loading) return <p style={{ color: "#64748b", textAlign: "center", padding: "60px" }}>⏳ טוען נתונים חיים מ-Base44...</p>;
  if (error) return (
    <div style={{ background: "#1c0a0a", border: "1px solid #7f1d1d", borderRadius: "12px", padding: "20px", color: "#fca5a5" }}>
      <p style={{ fontWeight: "bold" }}>❌ שגיאת חיבור ל-Base44</p>
      <p style={{ fontSize: "0.85rem", marginTop: "8px", color: "#94a3b8" }}>{error}</p>
      <p style={{ fontSize: "0.8rem", marginTop: "12px", color: "#64748b" }}>ודא ש-BASE44_API_KEY מוגדר ב-environment variables.</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div>
        <p style={{ color: "#facc15", fontWeight: "bold", marginBottom: "12px" }}>
          🎯 Credit Hunter — AiPrograms ({programs.length})
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
          {programs.map((p) => {
            const key = p.id ?? p._id ?? p.name ?? Math.random().toString();
            const isActive = p.status === "active";
            return (
              <div key={key} style={s}>
                <div style={{ fontWeight: "bold", fontSize: "0.9rem" }}>{p.name ?? "—"}</div>
                {p.category && <div style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{p.category}</div>}
                {p.credit_value && <div style={{ color: "#34d399", fontSize: "0.8rem", fontFamily: "monospace" }}>{p.credit_value}</div>}
                <span style={{
                  display: "inline-block", padding: "2px 8px", borderRadius: "999px", fontSize: "0.7rem",
                  fontWeight: "bold", alignSelf: "flex-start", marginTop: "4px",
                  background: isActive ? "#14532d" : "#1e293b",
                  color: isActive ? "#4ade80" : "#64748b",
                  border: `1px solid ${isActive ? "#166534" : "#334155"}`,
                }}>{p.status ?? "—"}</span>
              </div>
            );
          })}
        </div>
      </div>

      {projects.length > 0 && (
        <div>
          <p style={{ color: "#818cf8", fontWeight: "bold", marginBottom: "12px" }}>
            📁 CodeX — Projects ({projects.length})
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
            {projects.map((p) => {
              const key = p.id ?? p._id ?? p.name ?? Math.random().toString();
              return (
                <div key={key} style={{ ...s, borderColor: "#312e81" }}>
                  <div style={{ fontWeight: "bold", fontSize: "0.9rem" }}>{p.name ?? "—"}</div>
                  {p.next_step && <div style={{ color: "#94a3b8", fontSize: "0.78rem" }}>→ {p.next_step}</div>}
                  <span style={{
                    display: "inline-block", padding: "2px 8px", borderRadius: "999px", fontSize: "0.7rem",
                    fontWeight: "bold", alignSelf: "flex-start", marginTop: "4px",
                    background: "#1e1b4b", color: "#818cf8", border: "1px solid #312e81",
                  }}>{p.status ?? "—"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function WhatsAppTab() {
  const [statuses, setStatuses] = useState<Record<string, "checking" | "online" | "offline">>({});

  useEffect(() => {
    WEBHOOKS.forEach((wh) => {
      setStatuses((s) => ({ ...s, [wh.phone]: "checking" }));
      fetch(wh.url, { method: "GET", signal: AbortSignal.timeout(5000) })
        .then((r) => setStatuses((s) => ({ ...s, [wh.phone]: r.ok || r.status < 500 ? "online" : "offline" })))
        .catch(() => setStatuses((s) => ({ ...s, [wh.phone]: "offline" })));
    });
  }, []);

  const statusColor = (st: string) =>
    st === "online" ? "#4ade80" : st === "offline" ? "#f87171" : "#facc15";
  const statusLabel = (st: string) =>
    st === "online" ? "● פעיל" : st === "offline" ? "● לא מגיב" : "● בודק...";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "600px" }}>
      <div>
        <p style={{ color: "#facc15", fontWeight: "bold", fontSize: "1.1rem", marginBottom: "4px" }}>
          💬 WhatsApp Webhook Hub
        </p>
        <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
          ניתוב הודעות וואטסאפ לפי מספר לעסקים
        </p>
      </div>

      {WEBHOOKS.map((wh) => {
        const st = statuses[wh.phone] ?? "checking";
        return (
          <div key={wh.phone} style={{
            background: "#0f172a", border: `1px solid ${wh.color}44`,
            borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "10px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: "bold", fontSize: "1rem", color: "#e2e8f0" }}>{wh.label}</span>
              <span style={{ color: statusColor(st), fontWeight: "bold", fontSize: "0.85rem", fontFamily: "monospace" }}>
                {statusLabel(st)}
              </span>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "1.2rem", color: wh.color, fontWeight: "bold" }}>
              {wh.phone}
            </div>
            <div style={{ background: "#020617", borderRadius: "8px", padding: "10px" }}>
              <p style={{ color: "#64748b", fontSize: "0.7rem", marginBottom: "4px" }}>Webhook URL</p>
              <p style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#94a3b8", wordBreak: "break-all" }}>
                {wh.url}
              </p>
            </div>
            <a
              href={wh.url}
              target="_blank"
              rel="noreferrer"
              style={{
                background: wh.color + "22", border: `1px solid ${wh.color}44`,
                color: wh.color, padding: "8px 14px", borderRadius: "8px",
                textDecoration: "none", textAlign: "center", fontWeight: "bold", fontSize: "0.85rem",
              }}
            >
              פתח Webhook ↗
            </a>
          </div>
        );
      })}
    </div>
  );
}

export function Base44MasterView() {
  const [tab, setTab] = useState<"hunter" | "apps" | "agents" | "whatsapp">("hunter");

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold",
    background: active ? "#1d4ed8" : "#0f172a", color: active ? "white" : "#64748b",
    border: active ? "none" : "1px solid #1e3a5f", fontSize: "0.95rem",
  });

  return (
    <div dir="rtl" style={{ padding: "24px", color: "#e2e8f0", fontFamily: "inherit", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "1.5rem", color: "#facc15", marginBottom: "20px" }}>
        ⚡ BAZ OS — Command Center
      </h1>
      <div style={{ display: "flex", gap: "10px", marginBottom: "28px", flexWrap: "wrap" }}>
        <button style={tabStyle(tab === "hunter")} onClick={() => setTab("hunter")}>🎯 Hunter Hub</button>
        <button style={tabStyle(tab === "apps")} onClick={() => setTab("apps")}>📦 אפליקציות</button>
        <button style={tabStyle(tab === "agents")} onClick={() => setTab("agents")}>🤖 סוכנים</button>
        <button style={tabStyle(tab === "whatsapp")} onClick={() => setTab("whatsapp")}>💬 וואטסאפ</button>
      </div>

      {tab === "hunter" && <HunterTab />}

      {tab === "apps" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
          {apps.map(app => (
            <div key={app.id} style={{
              background: "#0f172a", border: "1px solid #1e3a5f",
              borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px",
            }}>
              <div style={{ fontWeight: "bold" }}>{app.name}</div>
              <div style={{ color: "#64748b", fontSize: "0.85rem", flexGrow: 1 }}>{app.desc}</div>
              <a href={`${BASE_URL}/${app.id}`} target="_blank" rel="noreferrer"
                style={{
                  background: "#1d4ed8", color: "white", padding: "8px 14px",
                  borderRadius: "8px", textDecoration: "none", textAlign: "center", fontWeight: "bold",
                }}>
                פתח ←
              </a>
            </div>
          ))}
        </div>
      )}

      {tab === "agents" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
          {agents.map(agent => (
            <div key={agent.id} style={{
              background: "#0f172a", border: "1px solid #7c3aed",
              borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px",
            }}>
              <div style={{ fontWeight: "bold" }}>🤖 {agent.name}</div>
              <div style={{ color: "#64748b", fontSize: "0.85rem", flexGrow: 1 }}>{agent.desc}</div>
              <a href={`${AGENT_URL}/${agent.id}`} target="_blank" rel="noreferrer"
                style={{
                  background: "#7c3aed", color: "white", padding: "8px 14px",
                  borderRadius: "8px", textDecoration: "none", textAlign: "center", fontWeight: "bold",
                }}>
                פתח סוכן ←
              </a>
            </div>
          ))}
        </div>
      )}

      {tab === "whatsapp" && <WhatsAppTab />}
    </div>
  );
}
