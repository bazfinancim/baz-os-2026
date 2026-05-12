"use client";

import React, { useState, useCallback } from "react";

const CHANNELS = [
  {
    id: "829",
    label: "ערוץ שיווק",
    phone: "054-829-4343",
    webhook: "https://n8n.baz-f.co.il/webhook/whatsapp-meta-829",
    color: "#16a34a",
    accent: "#16a34a",
    icon: "📣",
    desc: "קמפיינים, לידים, מבצעים, WhatsApp Marketing",
  },
  {
    id: "555",
    label: "ערוץ שירות",
    phone: "054-555-9934",
    webhook: "https://n8n.baz-f.co.il/webhook/whatsapp-meta-555",
    color: "#1d4ed8",
    accent: "#2563eb",
    icon: "🏢",
    desc: "תמיכת לקוחות, תפעול פנים-ארגוני, שירות",
  },
] as const;

type Status = "idle" | "sending" | "ok" | "error";

function buildStatusPayload(message: string, channel: (typeof CHANNELS)[number], extra?: Record<string, unknown>) {
  return {
    event: "status_update" as const,
    source: "baz-os-whatsapp-hub",
    channel: channel.label,
    phone: channel.phone,
    message: message.trim() || "עדכון סטטוס מ-WhatsApp Hub",
    ts: Date.now(),
    ...extra,
  };
}

export default function WhatsAppHub() {
  const [statuses, setStatuses] = useState<Record<string, Status>>({
    "829": "idle",
    "555": "idle",
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState("מצב תקין — Hub פעיל");
  const [broadcastState, setBroadcastState] = useState<Status>("idle");

  const pushLog = useCallback((line: string) => {
    setLogs((l) => [line, ...l].slice(0, 24));
  }, []);

  const trigger = async (ch: (typeof CHANNELS)[number]) => {
    setStatuses((p) => ({ ...p, [ch.id]: "sending" }));
    const ts = new Date().toLocaleTimeString("he-IL");
    const body = buildStatusPayload(statusMessage, ch, { trigger: "manual_webhook" });
    try {
      const res = await fetch(ch.webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setStatuses((p) => ({ ...p, [ch.id]: "ok" }));
        pushLog(`[${ts}] ✅ ${ch.label} (${ch.phone}) — נשלח ל-n8n (${res.status})`);
      } else {
        setStatuses((p) => ({ ...p, [ch.id]: "error" }));
        pushLog(`[${ts}] ❌ ${ch.label} — HTTP ${res.status}`);
      }
    } catch (e) {
      setStatuses((p) => ({ ...p, [ch.id]: "error" }));
      pushLog(`[${ts}] ❌ ${ch.label} — ${String(e)}`);
    }
    setTimeout(() => setStatuses((p) => ({ ...p, [ch.id]: "idle" })), 4000);
  };

  /** עדכון סטטוס לשני ה-Webhooks (054-829-4343 ו-054-555-9934) */
  const sendStatusToBoth = async () => {
    setBroadcastState("sending");
    const ts = new Date().toLocaleTimeString("he-IL");
    const results: string[] = [];
    for (const ch of CHANNELS) {
      setStatuses((p) => ({ ...p, [ch.id]: "sending" }));
      const body = buildStatusPayload(statusMessage, ch, { trigger: "status_broadcast" });
      try {
        const res = await fetch(ch.webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          setStatuses((p) => ({ ...p, [ch.id]: "ok" }));
          results.push(`${ch.phone}: OK`);
        } else {
          setStatuses((p) => ({ ...p, [ch.id]: "error" }));
          results.push(`${ch.phone}: HTTP ${res.status}`);
        }
      } catch (e) {
        setStatuses((p) => ({ ...p, [ch.id]: "error" }));
        results.push(`${ch.phone}: ${String(e)}`);
      }
    }
    pushLog(`[${ts}] 📡 שידור סטטוס — ${results.join(" · ")}`);
    setBroadcastState("idle");
    setTimeout(() => {
      setStatuses({ "829": "idle", "555": "idle" });
    }, 4000);
  };

  const statusBadge = (s: Status, accent: string) => {
    if (s === "sending") return <span style={{ color: "#ca8a04", fontSize: "0.78rem" }}>⏳ שולח...</span>;
    if (s === "ok") return <span style={{ color: "#16a34a", fontSize: "0.78rem" }}>✅ נשלח!</span>;
    if (s === "error") return <span style={{ color: "#dc2626", fontSize: "0.78rem" }}>❌ שגיאה</span>;
    return <span style={{ color: accent, fontSize: "0.75rem" }}>● מוכן</span>;
  };

  return (
    <div dir="rtl" style={{ color: "#0f172a" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 50%, #eff6ff 100%)",
          borderBottom: "1px solid #e2e8f0",
          padding: "18px 22px",
        }}
      >
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.45rem", fontWeight: 800, margin: 0 }}>
            <span style={{ color: "#16a34a" }}>💬 WhatsApp</span>
            <span> Hub</span>
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.8rem", margin: "6px 0 0" }}>
            Webhooks n8n · 054-829-4343 · 054-555-9934
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "24px 22px 40px" }}>
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "12px",
            padding: "12px 16px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "1.2rem" }} aria-hidden>
            🟢
          </span>
          <div>
            <p style={{ color: "#166534", fontWeight: "bold", fontSize: "0.88rem", margin: 0 }}>תשתית מחוברת ל-n8n</p>
            <p style={{ color: "#64748b", fontSize: "0.74rem", margin: "4px 0 0" }}>
              כל שליחה היא POST JSON ל-workflow המתאים לכל מספר.
            </p>
          </div>
        </div>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "16px 18px",
            marginBottom: "22px",
          }}
        >
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 10px", color: "#0f172a" }}>
            עדכוני סטטוס לשני הערוצים
          </h2>
          <label htmlFor="wa-status-msg" style={{ fontSize: "0.78rem", color: "#64748b", display: "block", marginBottom: "6px" }}>
            טקסט העדכון (יישלח בגוף הבקשה לשני ה-webhooks)
          </label>
          <textarea
            id="wa-status-msg"
            value={statusMessage}
            onChange={(e) => setStatusMessage(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              resize: "vertical",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              padding: "10px 12px",
              fontSize: "0.88rem",
              fontFamily: "inherit",
              marginBottom: "12px",
            }}
          />
          <button
            type="button"
            onClick={() => void sendStatusToBoth()}
            disabled={broadcastState === "sending"}
            style={{
              background: broadcastState === "sending" ? "#94a3b8" : "#0f172a",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 18px",
              fontWeight: 700,
              fontSize: "0.88rem",
              cursor: broadcastState === "sending" ? "not-allowed" : "pointer",
            }}
          >
            {broadcastState === "sending" ? "⏳ שולח לשני הערוצים..." : "📡 שלח עדכון סטטוס (שני ה-Webhooks)"}
          </button>
        </section>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
          {CHANNELS.map((ch) => (
            <div
              key={ch.id}
              style={{
                background: "#ffffff",
                border: `2px solid ${ch.color}33`,
                borderRadius: "16px",
                padding: "18px 20px",
                boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <span
                  style={{
                    fontSize: "1.75rem",
                    background: `${ch.color}18`,
                    borderRadius: "10px",
                    padding: "6px 8px",
                  }}
                  aria-hidden
                >
                  {ch.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 800, fontSize: "1.02rem", color: ch.accent, margin: 0 }}>{ch.label}</p>
                  <p style={{ color: "#64748b", fontSize: "0.76rem", margin: "4px 0 0" }}>
                    {ch.phone} · {ch.desc}
                  </p>
                </div>
                {statusBadge(statuses[ch.id], ch.accent)}
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  marginBottom: "12px",
                  fontFamily: "monospace",
                  fontSize: "0.68rem",
                  color: "#64748b",
                  wordBreak: "break-all",
                }}
              >
                {ch.webhook}
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => void trigger(ch)}
                  disabled={statuses[ch.id] === "sending"}
                  style={{
                    background: statuses[ch.id] === "sending" ? "#cbd5e1" : ch.color,
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 18px",
                    fontWeight: "bold",
                    fontSize: "0.85rem",
                    cursor: statuses[ch.id] === "sending" ? "not-allowed" : "pointer",
                  }}
                >
                  {statuses[ch.id] === "sending" ? "⏳ שולח..." : "⚡ שלח עדכון (ערוץ זה)"}
                </button>

                <a
                  href={`https://wa.me/${ch.phone.replace(/-/g, "").replace(/^0/, "972")}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: "#16a34a",
                    color: "white",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    fontWeight: "bold",
                    fontSize: "0.85rem",
                    textDecoration: "none",
                  }}
                >
                  📱 פתח WhatsApp
                </a>

                <a
                  href="https://n8n.baz-f.co.il"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: "#f8fafc",
                    color: "#64748b",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    fontSize: "0.78rem",
                    textDecoration: "none",
                  }}
                >
                  n8n ↗
                </a>
              </div>
            </div>
          ))}
        </div>

        {logs.length > 0 && (
          <div>
            <p style={{ color: "#64748b", fontSize: "0.72rem", marginBottom: "8px", fontWeight: "bold" }}>📋 לוג פעילות</p>
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "10px 14px",
                fontFamily: "monospace",
                fontSize: "0.72rem",
                color: "#166534",
                maxHeight: "180px",
                overflowY: "auto",
              }}
            >
              {logs.map((line, i) => (
                <div key={i} style={{ marginBottom: "2px" }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{ color: "#94a3b8", fontSize: "0.65rem", marginTop: "28px", textAlign: "center" }}>
          BAZ OS 2026 · WhatsApp Hub
        </p>
      </div>
    </div>
  );
}
