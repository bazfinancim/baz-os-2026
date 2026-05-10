"use client";
import React, { Component, useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Program = {
  id?: string; _id?: string; name?: string; status?: string;
  credit_value?: string; category?: string; description?: string;
};
type Tool = {
  id?: string; _id?: string; company?: string; name?: string;
  status?: string; credit_value?: string; tool_type?: string;
};
type Bot = {
  id?: string; _id?: string; name?: string; status?: string; target?: string;
};
type HunterData = {
  ok: boolean;
  programs: Program[];
  tools: Tool[];
  bots: Bot[];
  totals: { programs: number; tools: number; bots: number };
  errors: { programs: string | null; tools: string | null; bots: string | null };
  error?: string;
};

// ─── Error Boundary ───────────────────────────────────────────────────────────
type EBState = { hasError: boolean; message: string };
class HunterErrorBoundary extends Component<{ children: React.ReactNode }, EBState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(err: Error): EBState {
    return { hasError: true, message: err.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: "#1c0a0a", border: "2px solid #7f1d1d",
          borderRadius: "16px", padding: "32px", textAlign: "center", color: "#fca5a5",
        }}>
          <p style={{ fontSize: "1.5rem", marginBottom: "12px" }}>🔴 Hunter — Critical Failure</p>
          <p style={{ fontSize: "0.9rem", color: "#94a3b8" }}>{this.state.message}</p>
          <p style={{ fontSize: "0.8rem", marginTop: "16px", color: "#64748b" }}>
            Base44 ecosystem לא מושפע מכשל זה.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function Badge({ status }: { status?: string }) {
  const active = status === "active" || status === "running";
  return (
    <span style={{
      display: "inline-block", padding: "2px 9px", borderRadius: "999px",
      fontSize: "0.68rem", fontWeight: "bold",
      background: active ? "#14532d" : "#1e293b",
      color: active ? "#4ade80" : "#64748b",
      border: `1px solid ${active ? "#166534" : "#334155"}`,
    }}>
      {active ? "● פעיל" : `● ${status ?? "—"}`}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{
      background: "#0f172a", border: `1px solid ${color}44`,
      borderRadius: "12px", padding: "18px 22px", textAlign: "center",
    }}>
      <p style={{ color, fontSize: "2rem", fontWeight: "bold", fontFamily: "monospace" }}>{value}</p>
      <p style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px" }}>{label}</p>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
function HunterContent() {
  const [data, setData] = useState<HunterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"programs" | "tools" | "bots">("programs");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/hunter/data")
      .then((r) => r.json())
      .then((d: HunterData) => { setData(d); setLastUpdated(new Date().toLocaleTimeString("he-IL")); })
      .catch((e: Error) => setData({ ok: false, error: e.message, programs: [], tools: [], bots: [], totals: { programs: 0, tools: 0, bots: 0 }, errors: { programs: null, tools: null, bots: null } }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const tabBtn = (id: typeof tab, label: string, count: number) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: "7px 18px", borderRadius: "8px", cursor: "pointer",
        fontWeight: "bold", fontSize: "0.88rem",
        background: tab === id ? "#facc15" : "#0f172a",
        color: tab === id ? "#0a0f1e" : "#64748b",
        border: tab === id ? "none" : "1px solid #1e3a5f",
      }}
    >
      {label} ({count})
    </button>
  );

  const card: React.CSSProperties = {
    background: "#0f172a", border: "1px solid #1e3a5f",
    borderRadius: "12px", padding: "14px",
    display: "flex", flexDirection: "column", gap: "6px",
  };

  return (
    <div dir="rtl" style={{ padding: "28px", color: "#e2e8f0", fontFamily: "inherit", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", color: "#facc15", fontWeight: "bold" }}>
            🎯 Hunter Hub — VIP Engine
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "4px" }}>
            מבודד לחלוטין. אם Base44 נופל — Hunter ממשיך לפעול.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
          <button onClick={load} disabled={loading} style={{
            background: "#1d4ed8", color: "white", border: "none",
            borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontWeight: "bold",
          }}>
            {loading ? "⏳ טוען..." : "🔄 רענן"}
          </button>
          {lastUpdated && <span style={{ color: "#475569", fontSize: "0.75rem" }}>עדכון אחרון: {lastUpdated}</span>}
        </div>
      </div>

      {/* Back link */}
      <a href="/" style={{ color: "#475569", fontSize: "0.8rem", textDecoration: "none", display: "inline-block", marginBottom: "24px" }}>
        ← חזור לפאנל ראשי
      </a>

      {/* Error state */}
      {!loading && data && !data.ok && (
        <div style={{
          background: "#1c0a0a", border: "1px solid #7f1d1d", borderRadius: "12px",
          padding: "20px", color: "#fca5a5", marginBottom: "24px",
        }}>
          <p style={{ fontWeight: "bold" }}>❌ Hunter API שגיאה</p>
          <p style={{ fontSize: "0.85rem", marginTop: "8px", color: "#94a3b8" }}>{data.error}</p>
          <p style={{ fontSize: "0.78rem", marginTop: "10px", color: "#64748b" }}>
            ודא: BASE44_API_KEY מוגדר ב-environment variables.
          </p>
        </div>
      )}

      {/* Partial errors */}
      {data?.errors && Object.entries(data.errors).some(([, v]) => v) && (
        <div style={{
          background: "#1c1200", border: "1px solid #78350f", borderRadius: "10px",
          padding: "12px 16px", marginBottom: "20px", fontSize: "0.8rem", color: "#fbbf24",
        }}>
          ⚠️ שגיאה חלקית בטעינה:{" "}
          {Object.entries(data.errors).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(" | ")}
        </div>
      )}

      {/* Stats row */}
      {data?.ok && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "28px" }}>
          <StatCard label="AiPrograms" value={data.totals.programs} color="#facc15" />
          <StatCard label="Discovered Tools" value={data.totals.tools} color="#34d399" />
          <StatCard label="Worker Bots" value={data.totals.bots} color="#818cf8" />
        </div>
      )}

      {/* Tab bar */}
      {data?.ok && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          {tabBtn("programs", "📊 AiPrograms", data.totals.programs)}
          {tabBtn("tools", "🔧 Discovered Tools", data.totals.tools)}
          {tabBtn("bots", "🤖 Worker Bots", data.totals.bots)}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ ...card, height: "90px", background: "#0f172a", opacity: 0.5 }} />
          ))}
        </div>
      )}

      {/* Programs grid */}
      {!loading && tab === "programs" && data?.programs && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "12px" }}>
          {data.programs.map((p, i) => (
            <div key={p.id ?? p._id ?? i} style={card}>
              <p style={{ fontWeight: "bold", fontSize: "0.92rem" }}>{p.name ?? "—"}</p>
              {p.category && <p style={{ color: "#94a3b8", fontSize: "0.72rem" }}>{p.category}</p>}
              {p.credit_value && (
                <p style={{ color: "#34d399", fontFamily: "monospace", fontSize: "0.8rem" }}>
                  💰 {p.credit_value}
                </p>
              )}
              <Badge status={p.status} />
            </div>
          ))}
          {data.programs.length === 0 && (
            <p style={{ color: "#475569", gridColumn: "1/-1", textAlign: "center", padding: "40px" }}>
              אין AiPrograms
            </p>
          )}
        </div>
      )}

      {/* Tools grid */}
      {!loading && tab === "tools" && data?.tools && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "12px" }}>
          {data.tools.map((t, i) => (
            <div key={t.id ?? t._id ?? i} style={{ ...card, borderColor: "#134e4a" }}>
              <p style={{ fontWeight: "bold", fontSize: "0.92rem" }}>{t.company ?? t.name ?? "—"}</p>
              {t.tool_type && <p style={{ color: "#94a3b8", fontSize: "0.72rem" }}>{t.tool_type}</p>}
              {t.credit_value && (
                <p style={{ color: "#34d399", fontFamily: "monospace", fontSize: "0.8rem" }}>💰 {t.credit_value}</p>
              )}
              <Badge status={t.status} />
            </div>
          ))}
          {data.tools.length === 0 && (
            <p style={{ color: "#475569", gridColumn: "1/-1", textAlign: "center", padding: "40px" }}>
              אין Discovered Tools
            </p>
          )}
        </div>
      )}

      {/* Bots grid */}
      {!loading && tab === "bots" && data?.bots && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "12px" }}>
          {data.bots.map((b, i) => (
            <div key={b.id ?? b._id ?? i} style={{ ...card, borderColor: "#312e81" }}>
              <p style={{ fontWeight: "bold", fontSize: "0.92rem" }}>🤖 {b.name ?? "—"}</p>
              {b.target && <p style={{ color: "#94a3b8", fontSize: "0.72rem" }}>{b.target}</p>}
              <Badge status={b.status} />
            </div>
          ))}
          {data.bots.length === 0 && (
            <p style={{ color: "#475569", gridColumn: "1/-1", textAlign: "center", padding: "40px" }}>
              אין Worker Bots
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function HunterDashboard() {
  return (
    <HunterErrorBoundary>
      <HunterContent />
    </HunterErrorBoundary>
  );
}
