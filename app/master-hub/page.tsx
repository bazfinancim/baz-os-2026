"use client";
import React, { useState, useMemo } from "react";
import RAW from "../../src/data/ai_export.json";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tool = {
  id: string; name: string; category: string; status: string;
  credit_value?: string; notes?: string; url?: string;
  registration_email?: string; priority?: number; credit_type?: string;
};

type Company = {
  id: number; name: string; icon: string; status: string;
  sector: string; color: string;
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const TOOLS: Tool[] = (RAW as { programs: Tool[] }).programs ?? [];

const COMPANIES: Company[] = [
  { id: 48, name: "Baz Finance Pro",    icon: "💼", status: "active",   sector: "פיננסים",      color: "#1d4ed8" },
  { id: 49, name: "Baz AI Studio",      icon: "🎨", status: "active",   sector: "יצירתי",       color: "#7c3aed" },
  { id: 50, name: "ReguCheck AI",       icon: "♿", status: "new",      sector: "נגישות / ציות", color: "#059669" },
];

const WA_CHANNELS = [
  { label: "שיווק 829",     phone: "054-829-4343", webhook: "https://n8n.baz-f.co.il/webhook/whatsapp-meta-829", color: "#16a34a", accent: "#4ade80", icon: "📣" },
  { label: "שירות 555",     phone: "054-555-9934", webhook: "https://n8n.baz-f.co.il/webhook/whatsapp-meta-555", color: "#1d4ed8", accent: "#60a5fa", icon: "🏢" },
];

// ─── Credit calculator ────────────────────────────────────────────────────────
function parseVal(cv: string | undefined): number {
  if (!cv) return 0;
  const s = String(cv).replace(/,/g, "");
  const b = s.match(/\$?([\d.]+)\s*b/i); if (b) return parseFloat(b[1]) * 1e9;
  const m = s.match(/\$?([\d.]+)\s*m/i); if (m) return parseFloat(m[1]) * 1e6;
  const k = s.match(/\$?([\d.]+)\s*k/i); if (k) return parseFloat(k[1]) * 1e3;
  const d = s.match(/\$?([\d.]+)/);      if (d) return parseFloat(d[1]);
  return 0;
}
function fmt(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

// ─── Status / Category styles ─────────────────────────────────────────────────
const ST: Record<string, { label: string; bg: string; color: string }> = {
  active:               { label: "פעיל",        bg: "#14532d", color: "#4ade80" },
  registered:           { label: "נרשם",         bg: "#1e3a5f", color: "#60a5fa" },
  discovered:           { label: "התגלה",        bg: "#1c1a00", color: "#facc15" },
  pending_registration: { label: "ממתין",        bg: "#1c0a00", color: "#fb923c" },
  failed:               { label: "נכשל",         bg: "#2d0a0a", color: "#f87171" },
};
const CAT_CLR: Record<string, string> = {
  llm: "#818cf8", cloud: "#38bdf8", image: "#f472b6", audio: "#a78bfa",
  memory: "#34d399", data: "#fb923c", server: "#facc15", devtools: "#60a5fa",
  video: "#e879f9", code: "#4ade80", design: "#f9a8d4", other: "#94a3b8",
};

type Section = "hunter" | "whatsapp" | "companies";

export default function MasterHub() {
  const [section, setSection] = useState<Section>("hunter");
  const [search, setSearch] = useState("");
  const [catFilter, setCat] = useState("הכל");
  const [statFilter, setStat] = useState("הכל");
  const [waStatus, setWaStatus] = useState<Record<string, string>>({});

  // Credits
  const activeCredits  = useMemo(() => TOOLS.filter(t => ["active","registered"].includes(t.status)).reduce((s,t) => s + parseVal(t.credit_value), 0), []);
  const totalCredits   = useMemo(() => TOOLS.reduce((s,t) => s + parseVal(t.credit_value), 0), []);
  const activeCount    = TOOLS.filter(t => ["active","registered"].includes(t.status)).length;

  // Filtered tools
  const cats = ["הכל", ...Array.from(new Set(TOOLS.map(t => t.category)))];
  const filtered = useMemo(() => {
    let list = [...TOOLS];
    if (catFilter !== "הכל")  list = list.filter(t => t.category === catFilter);
    if (statFilter !== "הכל") list = list.filter(t => t.status === statFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.name.toLowerCase().includes(q) || (t.notes ?? "").toLowerCase().includes(q));
    }
    return list.sort((a,b) => (b.priority ?? 0) - (a.priority ?? 0));
  }, [catFilter, statFilter, search]);

  // WhatsApp trigger
  const triggerWA = async (ch: typeof WA_CHANNELS[0]) => {
    setWaStatus(p => ({ ...p, [ch.phone]: "שולח..." }));
    try {
      await fetch(ch.webhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: "master-hub", channel: ch.label, ts: Date.now() }) });
      setWaStatus(p => ({ ...p, [ch.phone]: "✅ נשלח!" }));
    } catch {
      setWaStatus(p => ({ ...p, [ch.phone]: "❌ שגיאה" }));
    }
    setTimeout(() => setWaStatus(p => { const n = { ...p }; delete n[ch.phone]; return n; }), 3000);
  };

  // Helpers
  const navBtn = (id: Section, label: string, accent: string) => (
    <button key={id} onClick={() => setSection(id)} style={{
      padding: "9px 22px", borderRadius: "10px", fontWeight: "bold", fontSize: "0.88rem",
      cursor: "pointer", border: "none", transition: "all 0.15s",
      background: section === id ? accent : "#0f172a",
      color: section === id ? "#000" : "#64748b",
      boxShadow: section === id ? `0 0 12px ${accent}55` : "none",
    }}>{label}</button>
  );

  return (
    <div dir="rtl" style={{ background: "#07070f", minHeight: "100vh", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)", borderBottom: "1px solid #1e1e2e", padding: "18px 24px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h1 style={{ fontSize: "1.6rem", fontWeight: "900", margin: 0 }}>
                <span style={{ color: "#facc15" }}>⚡ BAZ</span>
                <span style={{ color: "#818cf8" }}> Master Hub</span>
              </h1>
              <p style={{ color: "#334155", fontSize: "0.78rem", margin: "4px 0 0" }}>
                {TOOLS.length} כלי AI · {COMPANIES.length} חברות · WhatsApp Live · אפס API
              </p>
            </div>

            {/* Stats strip */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {[
                { label: "כלים", val: TOOLS.length, color: "#60a5fa" },
                { label: "פעילים", val: activeCount, color: "#4ade80" },
                { label: "קרדיטים פעילים", val: fmt(activeCredits), color: "#4ade80" },
                { label: "פוטנציאל", val: fmt(totalCredits), color: "#a78bfa" },
              ].map(s => (
                <div key={s.label} style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: "10px", padding: "8px 14px", textAlign: "center", minWidth: "80px" }}>
                  <div style={{ color: s.color, fontWeight: "900", fontFamily: "monospace", fontSize: "1rem" }}>{s.val}</div>
                  <div style={{ color: "#334155", fontSize: "0.65rem", marginTop: "2px" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
            {navBtn("hunter",    "🎯 Hunter — כלי AI",    "#facc15")}
            {navBtn("whatsapp",  "💬 WhatsApp Live",       "#4ade80")}
            {navBtn("companies", "🏢 חברות האימפריה",      "#818cf8")}
            <a href="/" style={{ padding: "9px 16px", borderRadius: "10px", background: "#0f172a", color: "#334155", textDecoration: "none", fontSize: "0.82rem", border: "1px solid #1e1e2e", alignSelf: "center" }}>← ראשי</a>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px" }}>

        {/* ════════════════ HUNTER SECTION ════════════════ */}
        {section === "hunter" && (
          <>
            {/* Filters */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap", alignItems: "center" }}>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="🔍 חיפוש כלי..."
                style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: "8px", padding: "7px 14px", color: "#e2e8f0", fontSize: "0.85rem", minWidth: "200px", flex: 1, outline: "none" }}
              />
              {["הכל", "active", "registered", "discovered"].map(s => (
                <button key={s} onClick={() => setStat(s)} style={{
                  padding: "5px 12px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "bold", cursor: "pointer",
                  background: statFilter === s ? "#1d4ed8" : "#0f172a",
                  color: statFilter === s ? "white" : "#64748b",
                  border: statFilter === s ? "none" : "1px solid #1e1e2e",
                }}>
                  {s === "הכל" ? "הכל" : (ST[s]?.label ?? s)}
                </button>
              ))}
            </div>

            {/* Category pills */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
              {cats.map(c => (
                <button key={c} onClick={() => setCat(c)} style={{
                  padding: "3px 10px", borderRadius: "99px", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer",
                  background: catFilter === c ? (CAT_CLR[c] ?? "#818cf8") + "33" : "#0f172a",
                  color: catFilter === c ? (CAT_CLR[c] ?? "#818cf8") : "#475569",
                  border: `1px solid ${catFilter === c ? (CAT_CLR[c] ?? "#818cf8") + "66" : "#1e1e2e"}`,
                }}>{c}</button>
              ))}
              <span style={{ color: "#1e3a5f", fontSize: "0.7rem", alignSelf: "center", marginRight: "auto" }}>
                📁 {filtered.length} / {TOOLS.length} · קובץ מקומי
              </span>
            </div>

            {/* Tools grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "10px" }}>
              {filtered.map((t, i) => {
                const st = ST[t.status] ?? ST.discovered;
                const cc = CAT_CLR[t.category] ?? "#64748b";
                return (
                  <div key={t.id ?? i} style={{ background: "#111118", border: `1px solid ${cc}22`, borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", gap: "7px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                      <p style={{ fontWeight: "700", fontSize: "0.85rem", lineHeight: 1.35, flex: 1, margin: 0 }}>{t.name}</p>
                      <span style={{ fontSize: "0.6rem", fontWeight: "bold", padding: "2px 7px", borderRadius: "99px", background: st.bg, color: st.color, whiteSpace: "nowrap" }}>{st.label}</span>
                    </div>
                    {t.credit_value && (
                      <p style={{ color: "#34d399", fontFamily: "monospace", fontSize: "0.78rem", margin: 0 }}>💰 {t.credit_value}</p>
                    )}
                    {t.notes && (
                      <p style={{ color: "#475569", fontSize: "0.7rem", lineHeight: 1.4, margin: 0 }}>{t.notes}</p>
                    )}
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "auto", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.62rem", color: cc, background: `${cc}18`, padding: "1px 7px", borderRadius: "99px" }}>{t.category}</span>
                      {t.registration_email && (
                        <span style={{ fontSize: "0.6rem", color: "#334155" }}>📧 {t.registration_email}</span>
                      )}
                      {t.url && (
                        <a href={t.url} target="_blank" rel="noreferrer" style={{ marginRight: "auto", fontSize: "0.7rem", color: "#334155", textDecoration: "none" }}>↗</a>
                      )}
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p style={{ color: "#334155", gridColumn: "1/-1", textAlign: "center", padding: "60px 0" }}>אין תוצאות</p>
              )}
            </div>
          </>
        )}

        {/* ════════════════ WHATSAPP SECTION ════════════════ */}
        {section === "whatsapp" && (
          <div style={{ maxWidth: "560px" }}>
            <div style={{ background: "#0f1f0f", border: "1px solid #16a34a33", borderRadius: "12px", padding: "14px 18px", marginBottom: "24px" }}>
              <p style={{ color: "#4ade80", fontWeight: "bold", fontSize: "0.9rem", margin: "0 0 4px" }}>✅ WhatsApp — מחוברת לN8N באופן ישיר</p>
              <p style={{ color: "#334155", fontSize: "0.75rem", margin: 0 }}>לחיצה על "הפעל" שולחת POST webhook מיידי — ללא Base44, ללא Login.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {WA_CHANNELS.map(ch => (
                <div key={ch.phone} style={{ background: "#0f172a", border: `2px solid ${ch.color}44`, borderRadius: "16px", padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <span style={{ fontSize: "1.6rem" }}>{ch.icon}</span>
                    <div>
                      <p style={{ fontWeight: "bold", fontSize: "1rem", color: ch.accent, margin: 0 }}>{ch.label}</p>
                      <p style={{ color: "#475569", fontSize: "0.78rem", margin: 0 }}>{ch.phone}</p>
                    </div>
                    {waStatus[ch.phone] && (
                      <span style={{ marginRight: "auto", fontSize: "0.82rem", color: waStatus[ch.phone]?.startsWith("✅") ? "#4ade80" : "#f87171", fontWeight: "bold" }}>
                        {waStatus[ch.phone]}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button onClick={() => triggerWA(ch)} style={{
                      background: ch.color, color: "white", border: "none", borderRadius: "8px",
                      padding: "9px 18px", fontWeight: "bold", fontSize: "0.85rem", cursor: "pointer",
                    }}>
                      ⚡ הפעל Webhook
                    </button>
                    <a href={`https://wa.me/${ch.phone.replace(/-/g, "").replace("0", "972")}`} target="_blank" rel="noreferrer" style={{
                      background: "#16a34a", color: "white", borderRadius: "8px",
                      padding: "9px 18px", fontWeight: "bold", fontSize: "0.85rem", textDecoration: "none",
                    }}>
                      📱 פתח WhatsApp
                    </a>
                    <a href={ch.webhook.replace("/webhook/", "/workflow/")} target="_blank" rel="noreferrer" style={{
                      background: "#0f172a", color: "#64748b", border: "1px solid #1e1e2e", borderRadius: "8px",
                      padding: "9px 14px", fontSize: "0.78rem", textDecoration: "none",
                    }}>
                      N8N Flow ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════ COMPANIES SECTION ════════════════ */}
        {section === "companies" && (
          <div>
            <div style={{ background: "#0a0a1a", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "12px 18px", marginBottom: "20px" }}>
              <p style={{ color: "#334155", fontSize: "0.78rem", margin: 0 }}>
                ⚠️ רשימת 48 החברות הראשונות ממתינה לייצוא רשמי. מוצגות כאן חברות 48–50.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
              {COMPANIES.map(c => (
                <div key={c.id} style={{ background: "#111118", border: `2px solid ${c.color}44`, borderRadius: "16px", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "2rem", background: `${c.color}22`, borderRadius: "10px", padding: "8px 10px" }}>{c.icon}</span>
                    <div>
                      <p style={{ fontWeight: "900", fontSize: "1rem", margin: 0 }}>{c.name}</p>
                      <p style={{ color: "#475569", fontSize: "0.75rem", margin: "2px 0 0" }}>חברה #{c.id} · {c.sector}</p>
                    </div>
                    <span style={{
                      marginRight: "auto", fontSize: "0.65rem", fontWeight: "bold",
                      padding: "3px 8px", borderRadius: "99px",
                      background: c.status === "new" ? "#14532d" : "#1e3a5f",
                      color: c.status === "new" ? "#4ade80" : "#60a5fa",
                    }}>
                      {c.status === "new" ? "🆕 חדשה" : "✅ פעילה"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "24px", background: "#0f172a", border: "1px dashed #1e3a5f", borderRadius: "12px", padding: "16px 20px", textAlign: "center" }}>
              <p style={{ color: "#1e3a5f", fontSize: "0.8rem", margin: 0 }}>
                + חברות 1–47 ממתינות לייצוא מ-Base44 · שלח את הקובץ ואעדכן מיד
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
