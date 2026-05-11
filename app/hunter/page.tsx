
"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────
type Tool = {
  id: string;
  name: string;
  company?: string;
  category?: string;
  status?: string;
  credit_value?: string;
  credit_details?: string;
  url?: string;
  signup_url?: string;
  priority?: number;
  needs_registration?: boolean;
  registration_email?: string;
  has_free_api?: boolean;
  region?: string;
  source?: string;
};

type HunterData = {
  ok: boolean;
  tools: Tool[];
  programs: Tool[];
  totals: { tools: number; programs: number; bots: number };
  error?: string;
};

const CATEGORIES = [
  "הכל","cloud","llm","server","startup_program","devtools","video",
  "image","audio","data","monitoring","automation","connections",
  "ui_builder","scraping","search","payments","analytics","forms",
  "scheduling","support","memory","other"
];

const STATUS_LABELS: Record<string, string> = {
  all: "הכל",
  active: "פעיל ✅",
  pending_registration: "בתהליך 🟡",
  discovered: "מגלה 🔵",
  registered: "נרשם 🟢",
};

function statusColor(s?: string) {
  if (s === "active" || s === "running") return "#4ade80";
  if (s === "pending_registration") return "#fbbf24";
  if (s === "registered") return "#34d399";
  return "#60a5fa";
}

function priorityStars(p?: number) {
  if (!p) return "";
  const stars = Math.round(p / 2);
  return "★".repeat(stars) + "☆".repeat(5 - stars);
}

function ScanAnimation({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(0,0,0,0.85)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "24px",
    }}>
      <div style={{ fontSize: "3rem" }}>🔍</div>
      <div style={{ color: "#4ade80", fontSize: "1.2rem", fontWeight: "bold", letterSpacing: "2px" }}>
        סורק כלים חדשים...
      </div>
      <div style={{ width: "300px", height: "4px", background: "#1e293b", borderRadius: "999px", overflow: "hidden" }}>
        <div style={{
          height: "100%", background: "linear-gradient(90deg, #4ade80, #06b6d4)",
          borderRadius: "999px", animation: "scanBar 2s ease-in-out infinite",
          width: "60%",
        }} />
      </div>
      <style>{`@keyframes scanBar { 0%{transform:translateX(-100%)} 100%{transform:translateX(500%)} }`}</style>
    </div>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <div style={{
      background: "#0f172a",
      border: `1px solid ${statusColor(tool.status)}33`,
      borderRadius: "14px", padding: "16px",
      display: "flex", flexDirection: "column", gap: "8px",
      transition: "all 0.2s", cursor: "default",
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLElement).style.borderColor = "#06b6d4";
      (e.currentTarget as HTMLElement).style.boxShadow = "0 0 18px rgba(6,182,212,0.15)";
      (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLElement).style.borderColor = `${statusColor(tool.status)}33`;
      (e.currentTarget as HTMLElement).style.boxShadow = "none";
      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
    }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
        <span style={{ color: "#e2e8f0", fontWeight: "bold", fontSize: "0.92rem", lineHeight: 1.3 }}>
          {tool.name || tool.company || "—"}
        </span>
        <span style={{
          background: statusColor(tool.status) + "22",
          color: statusColor(tool.status),
          border: `1px solid ${statusColor(tool.status)}44`,
          borderRadius: "999px", padding: "1px 8px", fontSize: "0.68rem",
          whiteSpace: "nowrap", flexShrink: 0,
        }}>
          {tool.status || "discovered"}
        </span>
      </div>

      {tool.credit_value && (
        <div style={{ color: "#facc15", fontWeight: "bold", fontSize: "1rem" }}>
          💰 {tool.credit_value}
        </div>
      )}

      {tool.credit_details && (
        <p style={{ color: "#64748b", fontSize: "0.75rem", lineHeight: 1.5 }}>
          {tool.credit_details.slice(0, 120)}{tool.credit_details.length > 120 ? "…" : ""}
        </p>
      )}

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
        {tool.category && (
          <span style={{ background: "#1e3a5f", color: "#93c5fd", borderRadius: "6px", padding: "2px 8px", fontSize: "0.7rem" }}>
            {tool.category}
          </span>
        )}
        {tool.region && (
          <span style={{ background: "#1e293b", color: "#64748b", borderRadius: "6px", padding: "2px 8px", fontSize: "0.7rem" }}>
            🌍 {tool.region}
          </span>
        )}
        {tool.priority && (
          <span style={{ color: "#fbbf24", fontSize: "0.72rem" }} title={`Priority: ${tool.priority}`}>
            {priorityStars(tool.priority)}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
        {tool.url && (
          <a href={tool.url} target="_blank" rel="noreferrer" style={{
            flex: 1, padding: "7px", borderRadius: "8px",
            background: "#1e40af", color: "#fff",
            fontSize: "0.78rem", fontWeight: "bold",
            textDecoration: "none", textAlign: "center",
          }}>
            🔗 פתח
          </a>
        )}
        {tool.signup_url && tool.status !== "active" && (
          <a href={tool.signup_url} target="_blank" rel="noreferrer" style={{
            flex: 1, padding: "7px", borderRadius: "8px",
            background: "#14532d", color: "#4ade80",
            fontSize: "0.78rem", fontWeight: "bold",
            textDecoration: "none", textAlign: "center",
          }}>
            ✍️ הרשם
          </a>
        )}
      </div>
    </div>
  );
}

export default function HunterPage() {
  const [data, setData] = useState<HunterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("הכל");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 60;

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/hunter/data")
      .then(r => r.json())
      .then((d: HunterData) => setData(d))
      .catch(() => setData({ ok: false, tools: [], programs: [], totals: { tools: 0, programs: 0, bots: 0 }, error: "שגיאת טעינה" }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Merge programs + tools
  const allTools: Tool[] = useMemo(() => {
    if (!data) return [];
    const tools = data.tools ?? [];
    const programs = (data.programs ?? []).map(p => ({ ...p, category: p.category ?? "llm" }));
    // deduplicate by id
    const seen = new Set<string>();
    return [...tools, ...programs].filter(t => {
      const k = t.id || t.name || "";
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allTools.filter(t => {
      const matchSearch = !q ||
        (t.name ?? "").toLowerCase().includes(q) ||
        (t.company ?? "").toLowerCase().includes(q) ||
        (t.credit_value ?? "").toLowerCase().includes(q) ||
        (t.credit_details ?? "").toLowerCase().includes(q) ||
        (t.category ?? "").toLowerCase().includes(q);
      const matchCat = catFilter === "הכל" || t.category === catFilter;
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [allTools, search, catFilter, statusFilter]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  const totalValue = allTools.length;
  const activeCount = allTools.filter(t => t.status === "active").length;

  function handleScan() {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      load();
    }, 3000);
  }

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 14px", borderRadius: "8px", cursor: "pointer",
    fontWeight: "bold", fontSize: "0.8rem", border: "none",
    background: active ? "#facc15" : "#0f172a",
    color: active ? "#0a0f1e" : "#64748b",
    outline: active ? "none" : "1px solid #1e3a5f",
  });

  return (
    <div dir="rtl" style={{ padding: "28px", color: "#e2e8f0", fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "#0a0f1e" }}>
      <ScanAnimation active={scanning} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", color: "#facc15", fontWeight: "bold", margin: 0 }}>
            🎯 Hunter Hub — Credit Arsenal
          </h1>
          <p style={{ color: "#475569", fontSize: "0.88rem", margin: "4px 0 0" }}>
            כלי AI + קרדיטים חינמיים + תוכניות Startup
          </p>
        </div>
        <button
          onClick={handleScan}
          style={{
            padding: "12px 24px", borderRadius: "12px", border: "none",
            background: "linear-gradient(135deg, #16a34a, #15803d)",
            color: "#fff", cursor: "pointer", fontWeight: "bold", fontSize: "0.95rem",
          }}
        >
          🔍 סרוק כלים חדשים
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "28px" }}>
        {[
          { label: "סה״כ כלים", value: loading ? "…" : totalValue.toLocaleString(), color: "#facc15" },
          { label: "פעילים", value: loading ? "…" : activeCount, color: "#4ade80" },
          { label: "תוצאות", value: loading ? "…" : filtered.length.toLocaleString(), color: "#60a5fa" },
          { label: "Startup Programs", value: loading ? "…" : allTools.filter(t => t.category === "startup_program").length, color: "#f472b6" },
        ].map(s => (
          <div key={s.label} style={{ background: "#0f172a", border: `1px solid ${s.color}33`, borderRadius: "12px", padding: "16px 20px", textAlign: "center" }}>
            <p style={{ color: s.color, fontSize: "1.8rem", fontWeight: "bold", fontFamily: "monospace", margin: 0 }}>{s.value}</p>
            <p style={{ color: "#64748b", fontSize: "0.76rem", margin: "4px 0 0" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: "16px" }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="🔍 חפש כלי, קטגוריה, ערך קרדיטים..."
          style={{
            width: "100%", padding: "12px 18px", borderRadius: "12px",
            background: "#0f172a", border: "1px solid #1e3a5f",
            color: "#e2e8f0", fontSize: "0.95rem",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Category Filter */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => { setCatFilter(c); setPage(1); }} style={btnStyle(catFilter === c)}>
            {c}
          </button>
        ))}
      </div>

      {/* Status Filter */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <button key={k} onClick={() => { setStatusFilter(k); setPage(1); }} style={btnStyle(statusFilter === k)}>
            {v}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#4ade80", fontSize: "1.2rem", padding: "60px 0" }}>
          ⏳ טוען {totalValue > 0 ? `${totalValue.toLocaleString()} כלים` : "נתונים"}...
        </div>
      ) : data?.error ? (
        <div style={{ textAlign: "center", color: "#f87171", padding: "60px 0" }}>
          ❌ {data.error}<br/>
          <button onClick={load} style={{ marginTop: "16px", padding: "10px 20px", borderRadius: "10px", background: "#1e40af", color: "#fff", border: "none", cursor: "pointer" }}>
            נסה שוב
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
            {paginated.map((t, i) => <ToolCard key={t.id || i} tool={t} />)}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", color: "#475569", padding: "60px 0" }}>
              אין תוצאות לחיפוש "{search}"
            </div>
          )}
          {hasMore && (
            <div style={{ textAlign: "center", marginTop: "32px" }}>
              <button
                onClick={() => setPage(p => p + 1)}
                style={{ padding: "12px 32px", borderRadius: "12px", background: "#1e40af", color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold" }}
              >
                טען עוד ({filtered.length - paginated.length} נותרו)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
