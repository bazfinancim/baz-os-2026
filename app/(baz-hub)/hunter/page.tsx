"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import DISCOVERED_RAW from "@/src/data/discovered_tools.json";
import type { CreditTool } from "@/src/lib/credits-calculator";
import { runComparisonEngine } from "@/src/logic/hunter/comparison-engine";
import { useBazCompanies } from "@/src/components/HubBazCompaniesProvider";
import { buildBotEnvelope, serializeBotPayload } from "@/src/logic/bots/bot-template";

/** ערכת צבעים — Hub כהה (Master Hub) */
const D = {
  page: "#07070f",
  headerBg: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #0f172a 100%)",
  headerBorder: "rgba(99,102,241,0.22)",
  card: "#111118",
  cardBorder: "#1e293b",
  text: "#e2e8f0",
  muted: "#94a3b8",
  dim: "#64748b",
  thead: "rgba(30,27,75,0.55)",
  rowLine: "rgba(51,65,85,0.45)",
  link: "#818cf8",
  accent: "#60a5fa",
};

type Tool = {
  id?: string;
  _id?: string;
  name?: string;
  status?: string;
  credit_value?: string;
  category?: string;
  notes?: string;
  url?: string;
  registration_email?: string;
  company?: string;
  tool_type?: string;
  priority?: number;
  credit_type?: string;
};

const DISCOVERED: Tool[] = Array.isArray(DISCOVERED_RAW) ? (DISCOVERED_RAW as Tool[]) : [];

function parseCreditsValue(cv: string | null | undefined): number {
  if (!cv) return 0;
  const str = String(cv).replace(/,/g, "").trim();
  const b = str.match(/\$?([\d.]+)\s*b/i);
  if (b) return Math.round(parseFloat(b[1]) * 1_000_000_000);
  const m = str.match(/\$?([\d.]+)\s*m/i);
  if (m) return Math.round(parseFloat(m[1]) * 1_000_000);
  const k = str.match(/\$?([\d.]+)\s*k/i);
  if (k) return Math.round(parseFloat(k[1]) * 1_000);
  const d = str.match(/\$?([\d.]+)/);
  if (d) return Math.round(parseFloat(d[1]));
  return 0;
}

function formatCreditsCompact(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

const ACTIVE_STATUSES = ["active", "registered"];
const POTENTIAL_STATUSES = ["discovered", "pending_registration"];

function calculateCredits(tools: Tool[]) {
  const byStatus: Record<string, { count: number; value: number }> = {};
  for (const tool of tools) {
    const s = tool.status ?? "discovered";
    if (!byStatus[s]) byStatus[s] = { count: 0, value: 0 };
    byStatus[s].count++;
    byStatus[s].value += parseCreditsValue(tool.credit_value);
  }
  const active = ACTIVE_STATUSES.reduce((sum, s) => sum + (byStatus[s]?.value ?? 0), 0);
  const potential = POTENTIAL_STATUSES.reduce((sum, s) => sum + (byStatus[s]?.value ?? 0), 0);
  const activeCount = ACTIVE_STATUSES.reduce((sum, s) => sum + (byStatus[s]?.count ?? 0), 0);
  return { active, potential, total: active + potential, activeCount };
}

const ST: Record<string, { label: string; bg: string; color: string }> = {
  active: { label: "פעיל", bg: "#14532d", color: "#4ade80" },
  registered: { label: "נרשם", bg: "#1e3a5f", color: "#60a5fa" },
  discovered: { label: "התגלה", bg: "#422006", color: "#facc15" },
  pending_registration: { label: "ממתין לרישום", bg: "#431407", color: "#fb923c" },
  failed: { label: "נכשל", bg: "#450a0a", color: "#f87171" },
};

type SortKey = "name" | "category" | "status" | "credit_value" | "priority";
type SortDir = "asc" | "desc";

const TABS = [
  { id: "engine", label: "מנוע discovered" },
  { id: "comparison", label: "מנוע השוואה" },
  { id: "credits", label: "קרדיטים" },
  { id: "bots", label: "Bots" },
] as const;

export default function HunterPage() {
  const companies = useBazCompanies();
  const [activeTab, setActiveTab] = useState<string>("engine");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("הכל");
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const credits = useMemo(() => calculateCredits(DISCOVERED), []);
  const comparison = useMemo(() => runComparisonEngine(DISCOVERED as unknown as CreditTool[]), []);

  const filtered = useMemo(() => {
    let list = [...DISCOVERED];
    if (statusFilter !== "הכל") list = list.filter((t) => t.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          (t.name ?? "").toLowerCase().includes(q) ||
          (t.notes ?? "").toLowerCase().includes(q) ||
          (t.category ?? "").toLowerCase().includes(q) ||
          (t.credit_type ?? "").toLowerCase().includes(q),
      );
    }
    const dirMul = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "credit_value") {
        return (parseCreditsValue(a.credit_value) - parseCreditsValue(b.credit_value)) * dirMul;
      }
      if (sortKey === "priority") {
        const pa = a.priority ?? 0;
        const pb = b.priority ?? 0;
        return (pa - pb) * dirMul;
      }
      const va = String(a[sortKey] ?? "").toLowerCase();
      const vb = String(b[sortKey] ?? "").toLowerCase();
      return va.localeCompare(vb, "he") * dirMul;
    });
    return list;
  }, [search, statusFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "name" || key === "category" || key === "status" ? "asc" : "desc");
    }
  };

  const th = (key: SortKey, label: string) => (
    <th
      key={key}
      style={{
        padding: "10px 12px",
        textAlign: "right",
        fontSize: "0.72rem",
        fontWeight: 800,
        color: D.muted,
        borderBottom: `2px solid ${D.cardBorder}`,
        cursor: "pointer",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
      onClick={() => toggleSort(key)}
    >
      {label}
      {sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
    </th>
  );

  return (
    <div dir="rtl" style={{ color: D.text, minHeight: "100%", background: D.page }}>
      <header
        style={{
          background: D.headerBg,
          borderBottom: `1px solid ${D.headerBorder}`,
          padding: "18px 22px",
        }}
      >
        <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "14px" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: D.text }}>
                <span style={{ color: "#facc15" }}>🎯</span> Hunter — מנוע discovered_tools.json
              </h1>
              <p style={{ margin: "6px 0 0", fontSize: "0.82rem", color: D.muted, maxWidth: "720px", lineHeight: 1.5 }}>
                מקור יחיד:{" "}
                <code style={{ background: D.card, padding: "2px 8px", borderRadius: "6px", border: `1px solid ${D.cardBorder}` }}>
                  src/data/discovered_tools.json
                </code>{" "}
                — {DISCOVERED.length} רשומות · טבלה מקצועית
              </p>
            </div>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "0.78rem", color: D.muted }}>
              <span>
                <strong style={{ color: D.text }}>{DISCOVERED.length}</strong> כלים
              </span>
              <span>
                פעילים: <strong style={{ color: "#4ade80" }}>{credits.activeCount}</strong>
              </span>
              <span>
                קרדיט פעיל: <strong style={{ color: "#facc15" }}>{formatCreditsCompact(credits.active)}</strong>
              </span>
              <Link href="/apps" style={{ color: D.link, fontWeight: 600 }}>
                60 חברות BAZ ←
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "18px 22px 48px" }}>
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "16px",
            flexWrap: "wrap",
            borderBottom: `1px solid ${D.cardBorder}`,
            paddingBottom: "12px",
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.8rem",
                border: activeTab === t.id ? "none" : `1px solid ${D.cardBorder}`,
                background: activeTab === t.id ? "rgba(99,102,241,0.45)" : D.card,
                color: activeTab === t.id ? "#fff" : D.muted,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "engine" && (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "14px", alignItems: "center" }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש..."
                style={{
                  flex: "1 1 240px",
                  minWidth: "200px",
                  padding: "9px 14px",
                  borderRadius: "8px",
                  border: `1px solid ${D.cardBorder}`,
                  fontSize: "0.85rem",
                  background: D.card,
                  color: D.text,
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {["הכל", "active", "registered", "discovered", "pending_registration"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: statusFilter === st ? "none" : `1px solid ${D.cardBorder}`,
                      background: statusFilter === st ? "rgba(99,102,241,0.55)" : D.card,
                      color: statusFilter === st ? "#fff" : D.muted,
                    }}
                  >
                    {st === "הכל" ? "הכל" : ST[st]?.label ?? st}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: "0.72rem", color: D.dim }}>{filtered.length} שורות</span>
            </div>

            <div
              style={{
                background: D.card,
                border: `1px solid ${D.cardBorder}`,
                borderRadius: "12px",
                overflow: "auto",
                boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", minWidth: "900px" }}>
                <thead>
                  <tr style={{ background: D.thead }}>
                    {th("priority", "עדיפות")}
                    {th("name", "שם כלי")}
                    {th("category", "קטגוריה")}
                    {th("status", "סטטוס")}
                    {th("credit_value", "קרדיט")}
                    <th
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        color: D.muted,
                        borderBottom: `2px solid ${D.cardBorder}`,
                      }}
                    >
                      סוג קרדיט
                    </th>
                    <th
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        color: D.muted,
                        borderBottom: `2px solid ${D.cardBorder}`,
                      }}
                    >
                      הערות
                    </th>
                    <th
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        color: D.muted,
                        borderBottom: `2px solid ${D.cardBorder}`,
                      }}
                    >
                      קישור
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => {
                    const st = ST[t.status ?? "discovered"] ?? ST.discovered;
                    const rowKey = t.id ?? t._id ?? `row-${i}`;
                    return (
                      <tr key={rowKey} style={{ borderTop: `1px solid ${D.rowLine}` }}>
                        <td style={{ padding: "8px 12px", fontFamily: "monospace", color: D.dim }}>{t.priority ?? "—"}</td>
                        <td style={{ padding: "8px 12px", fontWeight: 600, color: D.text }}>{t.name ?? "—"}</td>
                        <td style={{ padding: "8px 12px", color: D.muted }}>{t.category ?? "—"}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <span
                            style={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: "6px",
                              background: st.bg,
                              color: st.color,
                            }}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#4ade80" }}>{t.credit_value ?? "—"}</td>
                        <td style={{ padding: "8px 12px", color: D.dim, fontSize: "0.75rem" }}>{t.credit_type ?? "—"}</td>
                        <td style={{ padding: "8px 12px", color: D.muted, fontSize: "0.75rem", maxWidth: "280px", lineHeight: 1.4 }}>
                          {t.notes ?? "—"}
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          {t.url ? (
                            <a href={t.url} target="_blank" rel="noreferrer" style={{ color: D.accent, fontWeight: 600, fontSize: "0.75rem" }}>
                              אתר
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p style={{ padding: "28px", textAlign: "center", color: D.muted, margin: 0 }}>אין תוצאות</p>
              )}
            </div>
          </>
        )}

        {activeTab === "comparison" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: D.card, border: `1px solid rgba(99,102,241,0.35)`, borderRadius: "12px", padding: "16px 18px" }}>
              <p style={{ margin: "0 0 8px", fontWeight: 800, color: D.accent }}>Comparison Engine</p>
              <p style={{ margin: 0, fontSize: "0.82rem", color: D.muted, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                {comparison.narrativeHe.join("\n")}
              </p>
              <p style={{ margin: "10px 0 0", fontSize: "0.72rem", color: D.dim }}>עודכן: {comparison.generatedAt}</p>
            </div>
            <div style={{ background: D.card, border: `1px solid ${D.cardBorder}`, borderRadius: "12px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                <thead>
                  <tr style={{ background: D.thead }}>
                    <th style={{ padding: "10px", textAlign: "right", color: D.muted }}>קטגוריה</th>
                    <th style={{ padding: "10px", textAlign: "right", color: D.muted }}>כמות</th>
                    <th style={{ padding: "10px", textAlign: "right", color: D.muted }}>סכום</th>
                    <th style={{ padding: "10px", textAlign: "right", color: D.muted }}>פעיל</th>
                    <th style={{ padding: "10px", textAlign: "right", color: D.muted }}>פוטנציאל</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.categories.map((c) => (
                    <tr key={c.category} style={{ borderTop: `1px solid ${D.rowLine}` }}>
                      <td style={{ padding: "8px 10px", fontWeight: 600, color: D.text }}>{c.category}</td>
                      <td style={{ padding: "8px 10px", color: D.muted }}>{c.count}</td>
                      <td style={{ padding: "8px 10px", fontFamily: "monospace", color: D.text }}>{formatCreditsCompact(c.creditSum)}</td>
                      <td style={{ padding: "8px 10px", color: "#4ade80", fontFamily: "monospace" }}>{formatCreditsCompact(c.activeCreditSum)}</td>
                      <td style={{ padding: "8px 10px", color: "#fbbf24", fontFamily: "monospace" }}>{formatCreditsCompact(c.potentialCreditSum)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background: D.card, border: `1px solid ${D.cardBorder}`, borderRadius: "12px", padding: "14px 16px" }}>
              <p style={{ margin: "0 0 10px", fontWeight: 700, color: D.text }}>הפרשים בין קטגוריות</p>
              <ul style={{ margin: 0, paddingRight: "18px", color: D.muted, fontSize: "0.8rem", lineHeight: 1.6 }}>
                {comparison.topCategoryGaps.map((g) => (
                  <li key={`${g.a}-${g.b}`}>
                    {g.a} ↔ {g.b}: {g.gapUsdApprox}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === "credits" && (
          <div style={{ maxWidth: "520px", background: D.card, border: `1px solid ${D.cardBorder}`, borderRadius: "12px", padding: "22px" }}>
            <p style={{ fontWeight: 800, marginBottom: "14px", color: D.text }}>סיכום קרדיטים</p>
            {[
              { label: "פעילים + נרשמים", value: formatCreditsCompact(credits.active), color: "#4ade80" },
              { label: "פוטנציאל", value: formatCreditsCompact(credits.potential), color: "#fbbf24" },
              { label: "סה״כ", value: formatCreditsCompact(credits.total), color: "#a78bfa" },
            ].map((row) => (
              <div
                key={row.label}
                style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${D.rowLine}`, gap: "12px" }}
              >
                <span style={{ color: D.muted, fontSize: "0.85rem" }}>{row.label}</span>
                <span style={{ color: row.color, fontFamily: "monospace", fontWeight: 800 }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "bots" && (
          <div style={{ background: D.card, border: `1px solid ${D.cardBorder}`, borderRadius: "12px", padding: "22px" }}>
            <p style={{ fontWeight: 800, marginBottom: "8px", color: D.text }}>תבנית בוט → n8n</p>
            <p style={{ color: D.muted, fontSize: "0.85rem", marginBottom: "14px", lineHeight: 1.5 }}>
              דוגמת JSON לחברה הראשונה מ־baz_companies.
            </p>
            <pre
              style={{
                direction: "ltr",
                textAlign: "left",
                background: "#020617",
                color: "#a5f3fc",
                padding: "14px",
                borderRadius: "10px",
                fontSize: "0.68rem",
                overflow: "auto",
                maxWidth: "800px",
                border: `1px solid ${D.cardBorder}`,
              }}
            >
              {companies[0] ? serializeBotPayload(buildBotEnvelope(companies[0], "ping", { demo: true })) : "{}"}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
