"use client";
import { useState } from "react";

const WA_LINES = [
  {
    id: "marketing",
    name: "שיווק / לידים",
    number: "+972 54-829-4343",
    color: "#22c55e",
    webhook: "https://n8n.baz-f.co.il/webhook/whatsapp-meta-829",
    n8n: "https://n8n.baz-f.co.il",
    icon: "📣",
    status: "connected",
  },
  {
    id: "service",
    name: "שירות לקוחות",
    number: "+972 54-555-9934",
    color: "#3b82f6",
    webhook: "https://n8n.baz-f.co.il/webhook/whatsapp-meta-555",
    n8n: "https://n8n.baz-f.co.il",
    icon: "🏢",
    status: "connected",
  },
];

export default function WhatsAppHub() {
  const [sendTo, setSendTo] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  async function sendMsg(webhookUrl: string) {
    if (!msg.trim()) return;
    setSending(true);
    setLastResult(null);
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: sendTo, message: msg, source: "baz_panel" }),
      });
      const ok = res.ok;
      setLastResult(ok ? "✅ נשלח בהצלחה!" : `❌ שגיאה: ${res.status}`);
    } catch (e: unknown) {
      setLastResult(`❌ ${e instanceof Error ? e.message : "שגיאה"}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div dir="rtl" style={{ padding: "32px", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "0.7rem", letterSpacing: "0.2em", color: "#22c55e", textTransform: "uppercase", marginBottom: "8px", fontWeight: 600 }}>
          COMMUNICATIONS / WHATSAPP META API
        </div>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em", margin: 0 }}>
          WhatsApp Hub
        </h1>
        <p style={{ color: "#64748b", marginTop: "6px", fontSize: "0.9rem" }}>
          ניהול 2 ערוצי WhatsApp — שיווק ושירות — מחוברים ל-N8N
        </p>
      </div>

      {/* Lines Status */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "32px" }}>
        {WA_LINES.map(line => (
          <div key={line.id} style={{
            background: "linear-gradient(135deg, #0d1117, #111827)",
            border: `1px solid ${line.color}33`,
            borderRadius: "16px",
            padding: "24px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "1.4rem", marginBottom: "6px" }}>{line.icon}</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9" }}>{line.name}</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: line.color, letterSpacing: "0.05em", marginTop: "4px" }}>
                  {line.number}
                </div>
              </div>
              <div style={{
                background: line.color + "20",
                border: `1px solid ${line.color}50`,
                borderRadius: "20px",
                padding: "4px 12px",
                fontSize: "0.7rem",
                color: line.color,
                fontWeight: 700,
                letterSpacing: "0.1em",
              }}>CONNECTED</div>
            </div>
            
            {/* Webhook URL */}
            <div style={{ background: "#0a0e18", borderRadius: "8px", padding: "10px 12px", marginBottom: "12px" }}>
              <div style={{ fontSize: "0.6rem", color: "#475569", marginBottom: "4px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Webhook URL</div>
              <div style={{ fontSize: "0.72rem", color: "#22d3ee", fontFamily: "monospace", wordBreak: "break-all" }}>{line.webhook}</div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => window.open(line.n8n, "_blank")}
                style={{
                  flex: 1,
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  borderRadius: "8px",
                  color: "#22c55e",
                  padding: "8px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >🔗 פתח N8N</button>
              <button
                onClick={() => { setSendTo(""); setMsg(""); }}
                style={{
                  flex: 1,
                  background: `${line.color}15`,
                  border: `1px solid ${line.color}40`,
                  borderRadius: "8px",
                  color: line.color,
                  padding: "8px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >📤 שלח הודעה</button>
            </div>
          </div>
        ))}
      </div>

      {/* Send Message Panel */}
      <div style={{
        background: "linear-gradient(135deg, #0d1117, #111827)",
        border: "1px solid rgba(59,130,246,0.2)",
        borderRadius: "16px",
        padding: "28px",
        marginBottom: "24px",
      }}>
        <div style={{ fontSize: "0.7rem", letterSpacing: "0.15em", color: "#3b82f6", textTransform: "uppercase", marginBottom: "16px", fontWeight: 600 }}>
          שלח הודעת WhatsApp
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div>
            <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginBottom: "6px" }}>מספר נמען (עם קידומת +972)</label>
            <input
              value={sendTo}
              onChange={e => setSendTo(e.target.value)}
              placeholder="+972541234567"
              style={{
                width: "100%",
                background: "#0a0e18",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "#f1f5f9",
                fontSize: "0.9rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginBottom: "6px" }}>ערוץ שליחה</label>
            <select
              value={sendTo}
              onChange={e => setSendTo(e.target.value)}
              style={{
                width: "100%",
                background: "#0a0e18",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "#f1f5f9",
                fontSize: "0.9rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            >
              <option value="">בחר ערוץ...</option>
              {WA_LINES.map(l => <option key={l.id} value={l.webhook}>{l.name} ({l.number})</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginBottom: "6px" }}>תוכן ההודעה</label>
          <textarea
            value={msg}
            onChange={e => setMsg(e.target.value)}
            placeholder="כתוב הודעת WhatsApp..."
            rows={4}
            style={{
              width: "100%",
              background: "#0a0e18",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "12px 14px",
              color: "#f1f5f9",
              fontSize: "0.9rem",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {WA_LINES.map(line => (
            <button
              key={line.id}
              onClick={() => sendMsg(line.webhook)}
              disabled={sending || !msg.trim()}
              style={{
                background: `linear-gradient(135deg, ${line.color}30, ${line.color}15)`,
                border: `1px solid ${line.color}50`,
                borderRadius: "10px",
                color: line.color,
                padding: "12px 24px",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                opacity: sending || !msg.trim() ? 0.5 : 1,
              }}
            >
              {sending ? "שולח..." : `📤 שלח דרך ${line.name}`}
            </button>
          ))}
          {lastResult && (
            <div style={{ fontSize: "0.85rem", color: lastResult.startsWith("✅") ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
              {lastResult}
            </div>
          )}
        </div>
      </div>

      {/* N8N Status */}
      <div style={{
        background: "linear-gradient(135deg, #0d1117, #111827)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "16px",
        padding: "20px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f1f5f9" }}>N8N Automations</div>
          <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "2px" }}>https://n8n.baz-f.co.il · 42 Workflows פעילים</div>
        </div>
        <button
          onClick={() => window.open("https://n8n.baz-f.co.il", "_blank")}
          style={{
            background: "rgba(168,85,247,0.1)",
            border: "1px solid rgba(168,85,247,0.3)",
            borderRadius: "10px",
            color: "#a855f7",
            padding: "10px 20px",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >🚀 פתח N8N Console</button>
      </div>
    </div>
  );
}

