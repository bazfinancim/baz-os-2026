"use client";
import React, { useState } from "react";

const CHANNELS = [
  {
    id: "829",
    label: "ערוץ שיווק",
    phone: "054-829-4343",
    webhook: "https://n8n.baz-f.co.il/webhook/whatsapp-meta-829",
    color: "#16a34a",
    accent: "#4ade80",
    icon: "📣",
    desc: "קמפיינים, לידים, מבצעים, WhatsApp Marketing",
  },
  {
    id: "555",
    label: "ערוץ שירות",
    phone: "054-555-9934",
    webhook: "https://n8n.baz-f.co.il/webhook/whatsapp-meta-555",
    color: "#1d4ed8",
    accent: "#60a5fa",
    icon: "🏢",
    desc: "תמיכת לקוחות, תפעול פנים-ארגוני, שירות",
  },
];

type Status = "idle" | "sending" | "ok" | "error";

export default function WhatsAppHub() {
  const [statuses, setStatuses] = useState<Record<string, Status>>({
    "829": "idle",
    "555": "idle",
  });
  const [logs, setLogs] = useState<string[]>([]);

  const trigger = async (ch: typeof CHANNELS[0]) => {
    setStatuses(p => ({ ...p, [ch.id]: "sending" }));
    const ts = new Date().toLocaleTimeString("he-IL");
    try {
      const res = await fetch(ch.webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "baz-os-whatsapp-hub", channel: ch.label, phone: ch.phone, ts: Date.now() }),
      });
      if (res.ok) {
        setStatuses(p => ({ ...p, [ch.id]: "ok" }));
        setLogs(l => [`[${ts}] ✅ ${ch.label} — webhook הופעל (${res.status})`, ...l].slice(0, 20));
      } else {
        setStatuses(p => ({ ...p, [ch.id]: "error" }));
        setLogs(l => [`[${ts}] ❌ ${ch.label} — HTTP ${res.status}`, ...l].slice(0, 20));
      }
    } catch (e) {
      setStatuses(p => ({ ...p, [ch.id]: "error" }));
      setLogs(l => [`[${ts}] ❌ ${ch.label} — ${String(e)}`, ...l].slice(0, 20));
    }
    setTimeout(() => setStatuses(p => ({ ...p, [ch.id]: "idle" })), 4000);
  };

  const statusBadge = (s: Status, accent: string) => {
    if (s === "sending") return <span style={{ color: "#facc15", fontSize: "0.78rem" }}>⏳ שולח...</span>;
    if (s === "ok")      return <span style={{ color: "#4ade80", fontSize: "0.78rem" }}>✅ נשלח!</span>;
    if (s === "error")   return <span style={{ color: "#f87171", fontSize: "0.78rem" }}>❌ שגיאה</span>;
    return <span style={{ color: accent, fontSize: "0.75rem" }}>● מוכן</span>;
  };

  return (
    <div dir="rtl" style={{ background: "#07070f", minHeight: "100vh", color: "#e2e8f0", fontFamily: "system-ui, sans-serif", padding: "0" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #052e16 0%, #0f172a 100%)", borderBottom: "1px solid #166534", padding: "18px 24px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "900", margin: 0 }}>
              <span style={{ color: "#4ade80" }}>💬 WhatsApp</span>
              <span style={{ color: "#e2e8f0" }}> Hub</span>
            </h1>
            <p style={{ color: "#166534", fontSize: "0.75rem", margin: "4px 0 0" }}>
              מחובר ישירות ל-N8N · ללא Base44 · ללא Login
            </p>
          </div>
          <a href="/" style={{ color: "#334155", fontSize: "0.78rem", textDecoration: "none", border: "1px solid #1e1e2e", borderRadius: "8px", padding: "6px 14px" }}>← ראשי</a>
        </div>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "24px" }}>

        {/* Status banner */}
        <div style={{ background: "#0f1f0f", border: "1px solid #166534", borderRadius: "12px", padding: "12px 18px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.2rem" }}>🟢</span>
          <div>
            <p style={{ color: "#4ade80", fontWeight: "bold", fontSize: "0.88rem", margin: 0 }}>תשתית פעילה — N8N מחובר</p>
            <p style={{ color: "#334155", fontSize: "0.72rem", margin: "2px 0 0" }}>
              n8n.baz-f.co.il · 2 ערוצים פעילים · Hetzner 178.105.75.214
            </p>
          </div>
        </div>

        {/* Channel cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "28px" }}>
          {CHANNELS.map(ch => (
            <div key={ch.id} style={{
              background: "#0f172a",
              border: `2px solid ${ch.color}55`,
              borderRadius: "16px",
              padding: "20px 24px",
            }}>
              {/* Top row */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                <span style={{ fontSize: "2rem", background: `${ch.color}22`, borderRadius: "10px", padding: "6px 8px" }}>{ch.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: "900", fontSize: "1.05rem", color: ch.accent, margin: 0 }}>{ch.label}</p>
                  <p style={{ color: "#475569", fontSize: "0.76rem", margin: "2px 0 0" }}>{ch.phone} · {ch.desc}</p>
                </div>
                {statusBadge(statuses[ch.id], ch.accent)}
              </div>

              {/* Webhook URL */}
              <div style={{ background: "#07070f", borderRadius: "8px", padding: "8px 12px", marginBottom: "14px", fontFamily: "monospace", fontSize: "0.7rem", color: "#334155", wordBreak: "break-all" }}>
                {ch.webhook}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  onClick={() => trigger(ch)}
                  disabled={statuses[ch.id] === "sending"}
                  style={{
                    background: statuses[ch.id] === "sending" ? "#1e3a1e" : ch.color,
                    color: "white", border: "none", borderRadius: "8px",
                    padding: "10px 20px", fontWeight: "bold", fontSize: "0.85rem",
                    cursor: statuses[ch.id] === "sending" ? "not-allowed" : "pointer",
                  }}
                >
                  {statuses[ch.id] === "sending" ? "⏳ שולח..." : "⚡ הפעל Webhook"}
                </button>

                <a
                  href={`https://wa.me/${ch.phone.replace(/-/g,"").replace(/^0/, "972")}`}
                  target="_blank" rel="noreferrer"
                  style={{ background: "#16a34a", color: "white", borderRadius: "8px", padding: "10px 18px", fontWeight: "bold", fontSize: "0.85rem", textDecoration: "none" }}
                >
                  📱 פתח WhatsApp
                </a>

                <a
                  href={`https://n8n.baz-f.co.il`}
                  target="_blank" rel="noreferrer"
                  style={{ background: "#0f172a", color: "#64748b", border: "1px solid #1e1e2e", borderRadius: "8px", padding: "10px 14px", fontSize: "0.78rem", textDecoration: "none" }}
                >
                  N8N ↗
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Activity log */}
        {logs.length > 0 && (
          <div>
            <p style={{ color: "#334155", fontSize: "0.72rem", marginBottom: "8px", fontWeight: "bold" }}>📋 לוג פעילות</p>
            <div style={{ background: "#0a0f0a", border: "1px solid #166534", borderRadius: "10px", padding: "10px 14px", fontFamily: "monospace", fontSize: "0.72rem", color: "#4ade80", maxHeight: "160px", overflowY: "auto" }}>
              {logs.map((line, i) => <div key={i} style={{ marginBottom: "2px" }}>{line}</div>)}
            </div>
          </div>
        )}

        <p style={{ color: "#1e3a5f", fontSize: "0.65rem", marginTop: "32px", textAlign: "center" }}>
          BAZ OS 2026 · WhatsApp Hub · Hetzner 178.105.75.214
        </p>
      </div>
    </div>
  );
}
