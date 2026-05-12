
"use client";
import React, { useState, useMemo } from "react";
import discoveredTools from "@/src/data/discovered_tools.json";
import bazCompanies from "@/src/data/baz_companies.json";

type Tool = {
  id: string;
  name: string;
  category: string;
  status: string;
  credit_value?: string;
  registration_email?: string | null;
  url?: string;
  priority?: number;
  credit_type?: string;
  notes?: string;
};

type Company = {
  id: number;
  name: string;
  group: string;
  icon: string;
  desc: string;
  status: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  cloud: "☁️ ענן",
  llm: "🧠 מודלי AI",
  saas: "⚙️ SaaS",
  infra: "🏗️ תשתית",
  marketing: "📣 שיווק",
  finance: "💰 פיננסים",
  other: "📦 אחר",
};

const STATUS_COLORS: Record<string, string> = {
  active: "#22c55e",
  discovered: "#3b82f6",
  pending: "#f59e0b",
  inactive: "#6b7280",
};

export function Base44MasterView() {
  const [tab, setTab] = useState<"hunter" | "companies" | "agents">("hunter");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const tools = useMemo<Tool[]>(() => {
    const raw = discoveredTools as Tool[] | { tools?: Tool[] };
    return Array.isArray(raw) ? raw : (raw.tools ?? []);
  }, []);

  const companies = useMemo<Company[]>(() => bazCompanies as Company[], []);

  const filtered = useMemo(() => {
    return tools.filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !q || t.name.toLowerCase().includes(q) || (t.notes ?? "").toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
      const matchCat = catFilter === "all" || t.category === catFilter;
      return matchSearch && matchCat;
    });
  }, [tools, search, catFilter]);

  const categories = useMemo(() => ["all", ...Array.from(new Set(tools.map(t => t.category)))], [tools]);

  const tabStyle = (active: boolean) => ({
    padding: "8px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" as const,
    background: active ? "#1d4ed8" : "#0f172a", color: active ? "white" : "#64748b",
    border: active ? "none" : "1px solid #1e3a5f", fontSize: "0.88rem", transition: "all 0.15s",
  });

  return (
    <div dir="rtl" style={{ padding: "24px", color: "#e2e8f0", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "0.6rem", letterSpacing: "0.25em", color: "#facc15", textTransform: "uppercase", marginBottom: "6px", fontWeight: 700 }}>BASE44 / HUNTER</div>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#f8f9fa", margin: 0 }}>⚡ מרכז הארסנל</h1>
        <p style={{ color: "#475569", marginTop: "4px", fontSize: "0.82rem" }}>{tools.length} כלים · {companies.length} חברות</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <button style={tabStyle(tab === "hunter")} onClick={() => setTab("hunter")}>🎯 Credit Hunter ({tools.length})</button>
        <button style={tabStyle(tab === "companies")} onClick={() => setTab("companies")}>🏢 חברות ({companies.length})</button>
        <button style={tabStyle(tab === "agents")} onClick={() => setTab("agents")}>🤖 סוכנים</button>
      </div>

      {/* HUNTER TAB */}
      {tab === "hunter" && (
        <div>
          {/* Search + filter bar */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 חפש כלי..."
              style={{ flex: 1, minWidth: "200px", background: "#0a0e18", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "8px 12px", color: "#f1f5f9", fontSize: "0.85rem", direction: "rtl" }}
            />
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              style={{ background: "#0a0e18", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "8px 12px", color: "#f1f5f9", fontSize: "0.85rem" }}>
              {categories.map(c => <option key={c} value={c}>{c === "all" ? "כל הקטגוריות" : (CATEGORY_LABELS[c] ?? c)}</option>)}
            </select>
          </div>

          <div style={{ fontSize: "0.72rem", color: "#475569", marginBottom: "12px" }}>מציג {filtered.length} מתוך {tools.length}</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px", maxHeight: "600px", overflowY: "auto", paddingLeft: "4px" }}>
            {filtered.slice(0, 120).map(tool => (
              <div key={tool.id} style={{
                background: "linear-gradient(135deg,#0d1117,#111827)",
                border: `1px solid ${(STATUS_COLORS[tool.status] ?? "#334155")}30`,
                borderRadius: "10px", padding: "14px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: "0.85rem", flex: 1 }}>{tool.name}</div>
                  <div style={{ background: (STATUS_COLORS[tool.status] ?? "#334155") + "20", border: `1px solid ${STATUS_COLORS[tool.status] ?? "#334155"}40`, borderRadius: "12px", padding: "2px 8px", fontSize: "0.6rem", color: STATUS_COLORS[tool.status] ?? "#94a3b8", fontWeight: 700, whiteSpace: "nowrap", marginRight: "8px" }}>
                    {tool.status}
                  </div>
                </div>
                {tool.credit_value && <div style={{ fontSize: "0.78rem", color: "#22c55e", fontWeight: 700, marginBottom: "4px" }}>{tool.credit_value}</div>}
                {tool.notes && <div style={{ fontSize: "0.72rem", color: "#64748b", lineHeight: "1.4" }}>{tool.notes}</div>}
                <div style={{ marginTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "0.6rem", color: "#475569", background: "#1e293b", borderRadius: "4px", padding: "2px 6px" }}>{CATEGORY_LABELS[tool.category] ?? tool.category}</div>
                  {tool.url && <a href={tool.url} target="_blank" rel="noreferrer" style={{ fontSize: "0.65rem", color: "#38bdf8", textDecoration: "none" }}>🔗 פתח</a>}
                </div>
              </div>
            ))}
            {filtered.length > 120 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#475569", padding: "20px", fontSize: "0.8rem" }}>
                ... ועוד {filtered.length - 120} כלים — צמצם את החיפוש לראות יותר
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPANIES TAB */}
      {tab === "companies" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
          {companies.map(c => (
            <div key={c.id} style={{
              background: "linear-gradient(135deg,#0d1117,#111827)",
              border: `1px solid ${c.status === "active" ? "#22c55e30" : "#33415530"}`,
              borderRadius: "10px", padding: "14px",
            }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "6px" }}>{c.icon}</div>
              <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: "0.88rem" }}>{c.name}</div>
              <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px", lineHeight: "1.4" }}>{c.desc}</div>
              <div style={{ marginTop: "8px", display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontSize: "0.6rem", color: "#475569", background: "#1e293b", borderRadius: "4px", padding: "2px 6px" }}>{c.group}</div>
                <div style={{ fontSize: "0.6rem", color: c.status === "active" ? "#22c55e" : "#6b7280", fontWeight: 700 }}>{c.status === "active" ? "פעיל" : "לא פעיל"}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AGENTS TAB */}
      {tab === "agents" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
          {[
            { name: "CodeX", id: "69dd307d9b66b56b793acc13", desc: "הסוכן הראשי של האימפריה", icon: "🤖" },
            { name: "סופר חשבונית", id: "69f0e56a29498695bbdde207", desc: "סוכן חשבוניות", icon: "📄" },
            { name: "הסופר סוכן של בני", id: "69b6a494706c1c8dce4eb64d", desc: "סוכן בני חבסוב", icon: "👤" },
            { name: "בייס (Base)", id: "69b1b93d4721ba14065bbedc", desc: "סוכן Base", icon: "🏛️" },
            { name: "אורה (Ora)", id: "69b71c806e0d14c955cb617a", desc: "סוכנת קופונים", icon: "💎" },
          ].map(agent => (
            <div key={agent.id} style={{ background: "linear-gradient(135deg,#0d1117,#0f1f2e)", border: "1px solid #1d4ed830", borderRadius: "10px", padding: "16px" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>{agent.icon}</div>
              <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: "0.9rem" }}>{agent.name}</div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>{agent.desc}</div>
              <button onClick={() => window.open(`https://app.base44.com/superagent/${agent.id}`, "_blank")}
                style={{ marginTop: "12px", background: "rgba(29,78,216,0.1)", border: "1px solid rgba(29,78,216,0.3)", borderRadius: "6px", color: "#60a5fa", padding: "6px 14px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", width: "100%" }}>
                פתח סוכן →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
