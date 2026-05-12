"use client";
import React, { useState, useMemo } from "react";
import discoveredTools from "@/src/data/discovered_tools.json";

type Tool = {
  id?: string;
  name?: string;
  category?: string;
  status?: string;
  credit_value?: string;
  url?: string;
  notes?: string;
  registration_email?: string | null;
  priority?: number;
  credit_type?: string;
};

const CAT_LABELS: Record<string, string> = {
  cloud: "☁️ ענן", llm: "🧠 מודלי AI", saas: "⚙️ SaaS",
  infra: "🏗️ תשתית", marketing: "📣 שיווק", finance: "💰 פיננסים", other: "📦 אחר",
};

const STATUS_COLOR: Record<string, string> = {
  active: "#22c55e", registered: "#22c55e",
  discovered: "#3b82f6", pending: "#f59e0b",
  pending_registration: "#f59e0b", inactive: "#6b7280",
};

function parseCreditValue(v: string | null | undefined): number {
  if (!v) return 0;
  const s = String(v).replace(/,/g, "");
  const b = s.match(/\$?([\d.]+)\s*b/i); if (b) return Math.round(parseFloat(b[1]) * 1e9);
  const m = s.match(/\$?([\d.]+)\s*m/i); if (m) return Math.round(parseFloat(m[1]) * 1e6);
  const k = s.match(/\$?([\d.]+)\s*k/i); if (k) return Math.round(parseFloat(k[1]) * 1e3);
  const d = s.match(/\$?([\d.]+)/); if (d) return Math.round(parseFloat(d[1]));
  return 0;
}

function fmtCredits(n: number): string {
  if (n >= 1e9) return `$${(n/1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n/1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n/1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export function LocalHunterView() {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [statusF, setStatusF] = useState("all");

  const tools = useMemo<Tool[]>(() => {
    const raw = discoveredTools as Tool[] | { tools?: Tool[] };
    return Array.isArray(raw) ? raw : (raw.tools ?? []);
  }, []);

  const categories = useMemo(() => ["all", ...Array.from(new Set(tools.map(t => t.category ?? "other")))], [tools]);

  const filtered = useMemo(() => tools.filter(t => {
    const q = search.toLowerCase();
    const matchQ = !q || (t.name ?? "").toLowerCase().includes(q) || (t.notes ?? "").toLowerCase().includes(q);
    const matchC = cat === "all" || t.category === cat;
    const matchS = statusF === "all" || t.status === statusF;
    return matchQ && matchC && matchS;
  }), [tools, search, cat, statusF]);

  const totalCredits = useMemo(() => tools.reduce((s, t) => s + parseCreditValue(t.credit_value), 0), [tools]);
  const activeCount = useMemo(() => tools.filter(t => ["active","registered"].includes(t.status ?? "")).length, [tools]);
  const discoveredCount = useMemo(() => tools.filter(t => ["discovered","pending","pending_registration"].includes(t.status ?? "")).length, [tools]);

  return (
    <div dir="rtl" style={{ padding: "24px", color: "#e2e8f0", fontFamily: "inherit", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "0.6rem", letterSpacing: "0.3em", color: "#facc15", textTransform: "uppercase", marginBottom: "6px", fontWeight: 700 }}>
          CREDIT HUNTER / ארסנל BAZ
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#f8f9fa", margin: 0, letterSpacing: "-0.02em" }}>⚡ מרכז הארסנל</h1>
        <p style={{ color: "#475569", marginTop: "4px", fontSize: "0.82rem" }}>
          {tools.length} כלים · {fmtCredits(totalCredits)} קרדיטים פוטנציאליים
        </p>
      </div>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "20px" }}>
        {[
          { label: 'סה\"כ כלים', value: tools.length, color: "#3b82f6" },
          { label: "פעיל / רשום", value: activeCount, color: "#22c55e" },
          { label: "לגילוי", value: discoveredCount, color: "#f59e0b" },
        ].map(s => (
          <div key={s.label} style={{ background: "#0d1117", border: `1px solid ${s.color}25`, borderRadius: "10px", padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.65rem", color: "#64748b", marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 חפש כלי, קטגוריה, הערה..."
          style={{ flex: 1, minWidth: "200px", background: "#0a0e18", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "8px 12px", color: "#f1f5f9", fontSize: "0.85rem", direction: "rtl" }}
        />
        <select value={cat} onChange={e => setCat(e.target.value)}
          style={{ background: "#0a0e18", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "8px 10px", color: "#f1f5f9", fontSize: "0.82rem" }}>
          {categories.map(c => <option key={c} value={c}>{c === "all" ? "כל הקטגוריות" : (CAT_LABELS[c] ?? c)}</option>)}
        </select>
        <select value={statusF} onChange={e => setStatusF(e.target.value)}
          style={{ background: "#0a0e18", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "8px 10px", color: "#f1f5f9", fontSize: "0.82rem" }}>
          {["all","active","discovered","pending","inactive"].map(s => (
            <option key={s} value={s}>{s === "all" ? "כל הסטטוסים" : s}</option>
          ))}
        </select>
      </div>

      <div style={{ fontSize: "0.7rem", color: "#475569", marginBottom: "12px" }}>
        מציג {Math.min(filtered.length, 150)} מתוך {filtered.length} כלים
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "10px", maxHeight: "65vh", overflowY: "auto" }}>
        {filtered.slice(0, 150).map((tool, i) => {
          const sc = STATUS_COLOR[tool.status ?? ""] ?? "#334155";
          return (
            <div key={tool.id ?? i} style={{
              background: "linear-gradient(135deg,#0d1117,#111827)",
              border: `1px solid ${sc}28`, borderRadius: "10px", padding: "12px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "5px" }}>
                <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: "0.83rem", flex: 1, lineHeight: "1.3" }}>{tool.name ?? "—"}</div>
                <span style={{ background: `${sc}18`, border: `1px solid ${sc}35`, borderRadius: "10px", padding: "2px 7px", fontSize: "0.58rem", color: sc, fontWeight: 700, whiteSpace: "nowrap", marginRight: "6px" }}>
                  {tool.status ?? "—"}
                </span>
              </div>
              {tool.credit_value && (
                <div style={{ fontSize: "0.8rem", color: "#22c55e", fontWeight: 700, marginBottom: "3px" }}>{tool.credit_value}</div>
              )}
              {tool.notes && (
                <div style={{ fontSize: "0.7rem", color: "#64748b", lineHeight: "1.4", marginBottom: "5px" }}>{tool.notes}</div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                <span style={{ fontSize: "0.58rem", color: "#475569", background: "#1e293b", borderRadius: "4px", padding: "2px 6px" }}>
                  {CAT_LABELS[tool.category ?? ""] ?? tool.category ?? "other"}
                </span>
                {tool.url && (
                  <a href={tool.url} target="_blank" rel="noreferrer" style={{ fontSize: "0.62rem", color: "#38bdf8", textDecoration: "none" }}>🔗 פתח</a>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length > 150 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#475569", padding: "20px", fontSize: "0.78rem" }}>
            ... ועוד {filtered.length - 150} כלים — צמצם את החיפוש
          </div>
        )}
      </div>
    </div>
  );
}
