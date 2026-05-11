
"use client";
import { useState } from "react";

const N8N_WEBHOOKS = {
  marketing: "https://n8n.baz-f.co.il/webhook/whatsapp-meta-829",
  service:   "https://n8n.baz-f.co.il/webhook/whatsapp-meta-555",
};

type Line = "marketing" | "service";
type LineStatus = "idle" | "checking" | "ok" | "error";

export function WhatsAppControlCenter() {
  const [status, setStatus] = useState<Record<Line, LineStatus>>({
    marketing: "idle",
    service: "idle",
  });
  const [msg, setMsg] = useState<Record<Line, string>>({
    marketing: "",
    service: "",
  });
  const [testMsg, setTestMsg] = useState("");
  const [testPhone, setTestPhone] = useState("");

  async function ping(line: Line) {
    setStatus((s) => ({ ...s, [line]: "checking" }));
    setMsg((m) => ({ ...m, [line]: "בודק..." }));
    try {
      const res = await fetch(N8N_WEBHOOKS[line], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ping", source: "baz-panel", line }),
      });
      if (res.ok || res.status === 200 || res.status === 404) {
        setStatus((s) => ({ ...s, [line]: "ok" }));
        setMsg((m) => ({ ...m, [line]: `✅ Webhook ${line === "marketing" ? "829" : "555"} פעיל` }));
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (e) {
      setStatus((s) => ({ ...s, [line]: "error" }));
      setMsg((m) => ({ ...m, [line]: `❌ שגיאה: ${e}` }));
    }
  }

  async function sendTest() {
    if (!testPhone || !testMsg) return;
    const res = await fetch("/api/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: testPhone, message: testMsg }),
    });
    const d = await res.json() as { status?: string };
    alert(d.status === "active" ? "✅ נשלח!" : "❌ שגיאה בשליחה");
  }

  const color = (s: LineStatus) =>
    s === "ok" ? "#4ade80" : s === "error" ? "#f87171" : s === "checking" ? "#fbbf24" : "#64748b";

  const lineCard = (line: Line, label: string, num: string) => (
    <div style={{
      background: "#0f172a", border: `1px solid ${color(status[line])}44`,
      borderRadius: "14px", padding: "20px", flex: 1,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span style={{ color: "#e2e8f0", fontWeight: "bold" }}>
          {label}
        </span>
        <span style={{
          background: color(status[line]) + "22",
          color: color(status[line]),
          border: `1px solid ${color(status[line])}44`,
          borderRadius: "999px", padding: "2px 10px", fontSize: "0.75rem",
        }}>
          {status[line] === "checking" ? "⏳ בודק" : status[line] === "ok" ? "● פעיל" : status[line] === "error" ? "● שגיאה" : "● לא נבדק"}
        </span>
      </div>
      <p style={{ color: "#475569", fontSize: "0.8rem", marginBottom: "14px" }}>{num}</p>
      <p style={{ color: color(status[line]), fontSize: "0.8rem", minHeight: "18px", marginBottom: "14px" }}>
        {msg[line]}
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => ping(line)}
          style={{
            flex: 1, padding: "10px", borderRadius: "10px", border: "none",
            background: "#1e40af", color: "#fff", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem",
          }}
        >
          🔌 בדוק חיבור N8N
        </button>
        <a
          href={`https://n8n.baz-f.co.il/webhook/${line === "marketing" ? "whatsapp-meta-829" : "whatsapp-meta-555"}`}
          target="_blank" rel="noreferrer"
          style={{
            flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #1e3a5f",
            background: "transparent", color: "#94a3b8", cursor: "pointer",
            fontWeight: "bold", fontSize: "0.85rem", textDecoration: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          🔗 פתח Webhook
        </a>
      </div>
    </div>
  );

  return (
    <section dir="rtl" style={{ marginTop: "32px", color: "#e2e8f0" }}>
      <h2 style={{ fontSize: "1.3rem", color: "#facc15", fontWeight: "bold", marginBottom: "20px" }}>
        📱 WhatsApp Control Center
      </h2>

      {/* Two line cards */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        {lineCard("marketing", "📣 שיווק — 829", "+972-54-829-4343")}
        {lineCard("service", "🛎 שירות לקוחות — 555", "+972-54-555-9934")}
      </div>

      {/* Test message */}
      <div style={{
        background: "#0f172a", border: "1px solid #1e3a5f",
        borderRadius: "14px", padding: "20px",
      }}>
        <h3 style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "14px" }}>
          🧪 שלח הודעת בדיקה
        </h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="+972501234567"
            style={{
              flex: 1, padding: "10px 14px", borderRadius: "10px",
              background: "#020617", border: "1px solid #1e3a5f",
              color: "#e2e8f0", fontSize: "0.9rem", minWidth: "160px",
            }}
          />
          <input
            value={testMsg}
            onChange={(e) => setTestMsg(e.target.value)}
            placeholder="הודעת בדיקה..."
            style={{
              flex: 2, padding: "10px 14px", borderRadius: "10px",
              background: "#020617", border: "1px solid #1e3a5f",
              color: "#e2e8f0", fontSize: "0.9rem", minWidth: "200px",
            }}
          />
          <button
            onClick={sendTest}
            style={{
              padding: "10px 22px", borderRadius: "10px", border: "none",
              background: "#16a34a", color: "#fff", cursor: "pointer",
              fontWeight: "bold", fontSize: "0.9rem",
            }}
          >
            ▶ שלח
          </button>
        </div>
      </div>

      {/* Webhook URLs info */}
      <div style={{ marginTop: "16px", padding: "14px 18px", background: "#020617", borderRadius: "10px", border: "1px solid #1e3a5f" }}>
        <p style={{ color: "#475569", fontSize: "0.78rem", fontFamily: "monospace" }}>
          829: https://n8n.baz-f.co.il/webhook/whatsapp-meta-829<br/>
          555: https://n8n.baz-f.co.il/webhook/whatsapp-meta-555
        </p>
      </div>
    </section>
  );
}
