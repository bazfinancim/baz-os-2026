"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import DISCOVERED_RAW from "@/src/data/discovered_tools.json";
import HUNTER_TOOLS_FILE from "@/src/data/hunter_tools.json";

/** יעד סריקה Master Hub — לא קשור ל-60 אפליקציות BAZ */
const SCAN_PLAN_TOTAL = 2775;

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

/** כלים מתוך hunter_tools.json (מערך tools) — בנפרד מ-baz_companies */
function toolsFromHunterFile(raw: unknown): Tool[] {
  if (!raw || typeof raw !== "object") return [];
  const tools = (raw as { tools?: unknown }).tools;
  if (!Array.isArray(tools)) return [];
  return tools.filter((t) => t && typeof t === "object") as Tool[];
}

const DISCOVERED_TOOLS: Tool[] = Array.isArray(DISCOVERED_RAW) ? (DISCOVERED_RAW as Tool[]) : [];
const FILE_EXTRA_TOOLS: Tool[] = toolsFromHunterFile(HUNTER_TOOLS_FILE);

const JOB_TYPES = [
  "credits_hunt",
  "new_tools",
  "llm_models",
  "image_deep",
  "video_deep",
  "cloud_credits",
  "startup_programs",
  "high_value_applications",
  "whatsapp_automation",
  "ai_news_innovations",
  "code_dev",
];

const ST: Record<string, { label: string; bg: string; color: string }> = {
  active: { label: "פעיל", bg: "#dcfce7", color: "#166534" },
  registered: { label: "נרשם", bg: "#dbeafe", color: "#1d4ed8" },
  discovered: { label: "התגלה", bg: "#fef9c3", color: "#a16207" },
  pending_registration: { label: "ממתין לרישום", bg: "#ffedd5", color: "#c2410c" },
  failed: { label: "נכשל", bg: "#fee2e2", color: "#b91c1c" },
};

const CAT_COLOR: Record<string, string> = {
  llm: "#6366f1",
  cloud: "#0284c7",
  image: "#db2777",
  audio: "#9333ea",
  memory: "#059669",
  data: "#ea580c",
  server: "#ca8a04",
  devtools: "#2563eb",
};

/** טאבים רק לתחום Hunter — בלי שכבת «אפליקציות המותג» */
const TABS = [
  { id: "library", label: "📦 ספריית הציד" },
  { id: "credits", label: "💰 קרדיטים" },
  { id: "bots", label: "🤖 Bots" },
] as const;

export default function HunterPage() {
  const [libraryTools] = useState<Tool[]>(() => [...DISCOVERED_TOOLS, ...FILE_EXTRA_TOOLS]);
  const [bots] = useState<Tool[]>([]);
  const [apiError] = useState<string | null>(null);
  const [lastFetch] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>("library");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("הכל");
  const [isRunning, setIsRunning] = useState(false);
  const [scanLog, setScanLog] = useState<string[]>([]);
  const [jobIdx, setJobIdx] = useState(0);
  const [runsCount, setRunsCount] = useState(0);
  const isRunningRef = useRef(false);

  useEffect(() => {
    isRunningRef.current = isRunning;
    if (!isRunning) return;

    const runScan = () => {
      if (!isRunningRef.current) return;
      const type = JOB_TYPES[jobIdx % JOB_TYPES.length];
      setJobIdx((i) => i + 1);
      setRunsCount((c) => c + 1);
      setScanLog((prev) =>
        [`[${new Date().toLocaleTimeString("he-IL")}] ⚡ סריקה: ${type}`, ...prev].slice(0, 12),
      );
    };

    runScan();
    const interval = setInterval(runScan, 30_000);
    return () => clearInterval(interval);
  }, [isRunning, jobIdx]);

  const allTools = useMemo(() => libraryTools, [libraryTools]);
  const credits = useMemo(() => calculateCredits(allTools), [allTools]);
  const scanIndex = Math.min(allTools.length, SCAN_PLAN_TOTAL);
  const scanPct = Math.round((scanIndex / SCAN_PLAN_TOTAL) * 100);

  const baseList = useMemo(() => {
    if (activeTab === "bots") return bots;
    if (activeTab === "library") return libraryTools;
    return [];
  }, [activeTab, libraryTools, bots]);

  const filtered = useMemo(() => {
    if (activeTab === "credits") return [];
    let list = [...baseList];
    if (statusFilter !== "הכל") list = list.filter((t) => t.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          (t.name ?? "").toLowerCase().includes(q) ||
          (t.notes ?? "").toLowerCase().includes(q) ||
          (t.company ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [baseList, statusFilter, search, activeTab]);

  const tabBtn = (id: string, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setActiveTab(id)}
      style={{
        padding: "7px 16px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "0.82rem",
        whiteSpace: "nowrap",
        background: activeTab === id ? "#f59e0b" : "#ffffff",
        color: activeTab === id ? "#fff" : "#64748b",
        border: activeTab === id ? "none" : "1px solid #e2e8f0",
      }}
    >
      {label}
    </button>
  );

  const stBtn = (st: string) => (
    <button
      key={st}
      type="button"
      onClick={() => setStatusFilter(st)}
      style={{
        padding: "4px 12px",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "0.75rem",
        fontWeight: "bold",
        background: statusFilter === st ? "#1d4ed8" : "#ffffff",
        color: statusFilter === st ? "white" : "#64748b",
        border: statusFilter === st ? "none" : "1px solid #e2e8f0",
      }}
    >
      {st === "הכל" ? "הכל" : ST[st]?.label ?? st}
    </button>
  );

  return (
    <div dir="rtl" style={{ color: "#0f172a" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 45%, #eff6ff 100%)",
          borderBottom: "1px solid #e2e8f0",
          padding: "16px 22px",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.35rem",
                }}
              >
                🎯
              </div>
              <div>
                <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Hunter — ציד כלים חיצוניים
                </h1>
                <p style={{ color: "#64748b", fontSize: "0.8rem", margin: "4px 0 0" }}>
                  מקורות מקומיים בלבד: <strong>discovered_tools.json</strong>
                  {FILE_EXTRA_TOOLS.length > 0 ? " + hunter_tools.json" : ""} · יעד סריקה{" "}
                  {SCAN_PLAN_TOTAL.toLocaleString()} כלים — <strong>לא</strong> כולל את 60 אפליקציות BAZ
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "8px 14px",
                  textAlign: "center",
                }}
              >
                <div style={{ color: "#d97706", fontWeight: 800, fontSize: "1.1rem", fontFamily: "monospace" }}>
                  {runsCount.toLocaleString()}
                </div>
                <div style={{ color: "#94a3b8", fontSize: "0.65rem" }}>ריצות</div>
              </div>

              <button
                type="button"
                onClick={() => setIsRunning((r) => !r)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  border: "none",
                  background: isRunning ? "#dc2626" : "#16a34a",
                  color: "white",
                }}
              >
                {isRunning ? "⏸ עצור" : "▶ הפעל סריקה"}
              </button>
            </div>
          </div>

          <p
            style={{
              fontSize: "0.8rem",
              color: "#0f172a",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "10px",
              padding: "10px 14px",
              marginBottom: "12px",
              lineHeight: 1.5,
            }}
          >
            <strong>הפרדה מוחלטת:</strong> כאן רק רשימת ציד (שוק חיצוני). את מפת המוצרים של BAZ רואים ב־
            <Link href="/apps" style={{ color: "#1d4ed8", fontWeight: 700 }}>
              טאב אפליקציות
            </Link>
            .
          </p>

          <div style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b" }}>
              <span>
                התקדמות מול יעד: {allTools.length.toLocaleString()} / {SCAN_PLAN_TOTAL.toLocaleString()}
              </span>
              <span>{scanPct}%</span>
            </div>
            <div
              style={{
                height: "8px",
                background: "#e2e8f0",
                borderRadius: "6px",
                overflow: "hidden",
                marginTop: "6px",
              }}
            >
              <div style={{ height: "100%", width: `${scanPct}%`, background: "#2563eb", borderRadius: "6px" }} />
            </div>
          </div>

          <p style={{ fontSize: "0.72rem", color: "#94a3b8", margin: 0 }}>
            מפתחות API: ב-Vault / משתני סביבה בשרת בלבד — לא בדפדפן.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px 22px 40px" }}>
        {apiError && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "16px",
              fontSize: "0.82rem",
              color: "#b91c1c",
            }}
          >
            ⚠️ API: {apiError}
            <span style={{ color: "#64748b", marginRight: "12px" }}>— מציג נתונים סטטיים</span>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          {[
            { label: "כלי ציד (סה״כ)", value: allTools.length, icon: "🗄️", color: "#2563eb" },
            { label: "מ־discovered_tools.json", value: DISCOVERED_TOOLS.length, icon: "📄", color: "#64748b" },
            { label: "מ־hunter_tools.json", value: FILE_EXTRA_TOOLS.length, icon: "➕", color: "#64748b" },
            { label: "פעילים + נרשמים", value: credits.activeCount, icon: "✅", color: "#16a34a" },
            { label: "קרדיטים פעילים", value: formatCreditsCompact(credits.active), icon: "🔑", color: "#16a34a" },
            { label: "פוטנציאלי", value: formatCreditsCompact(credits.potential), icon: "💡", color: "#ca8a04" },
            { label: "ריצות", value: runsCount, icon: "⚡", color: "#0284c7" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "1.25rem", marginBottom: "4px" }}>{s.icon}</div>
              <div style={{ color: s.color, fontSize: "1.05rem", fontWeight: 800, fontFamily: "monospace" }}>
                {s.value}
              </div>
              <div style={{ color: "#94a3b8", fontSize: "0.68rem", marginTop: "2px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {scanLog.length > 0 && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "10px",
              padding: "10px 14px",
              marginBottom: "16px",
              fontFamily: "monospace",
              fontSize: "0.72rem",
              color: "#166534",
              maxHeight: "120px",
              overflowY: "auto",
            }}
          >
            {scanLog.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}

        {activeTab !== "credits" && (
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 חיפוש ברשימת הציד..."
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "7px 14px",
                color: "#0f172a",
                fontSize: "0.85rem",
                flex: 1,
                minWidth: "200px",
                outline: "none",
              }}
            />
            {["הכל", "active", "registered", "discovered", "pending_registration"].map(stBtn)}
            {lastFetch && (
              <span style={{ color: "#94a3b8", fontSize: "0.7rem", marginRight: "auto" }}>עדכון: {lastFetch}</span>
            )}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "6px",
            marginBottom: "16px",
            flexWrap: "wrap",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "12px",
          }}
        >
          {TABS.map((t) => tabBtn(t.id, t.label))}
          <span style={{ color: "#94a3b8", fontSize: "0.75rem", alignSelf: "center", marginRight: "auto" }}>
            {activeTab === "credits" ? "—" : `${filtered.length} רשומות`}
          </span>
        </div>

        {activeTab === "credits" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "520px" }}>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "20px",
              }}
            >
              <p style={{ color: "#16a34a", fontWeight: "bold", fontSize: "1.05rem", marginBottom: "12px" }}>
                💎 סיכום קרדיטים (רשימת הציד בלבד)
              </p>
              {[
                {
                  label: "קרדיטים פעילים (registered + active)",
                  value: formatCreditsCompact(credits.active),
                  color: "#16a34a",
                },
                {
                  label: "פוטנציאל (discovered + pending)",
                  value: formatCreditsCompact(credits.potential),
                  color: "#ca8a04",
                },
                { label: "סה״כ אפשרי", value: formatCreditsCompact(credits.total), color: "#7c3aed" },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <span style={{ color: "#64748b", fontSize: "0.85rem" }}>{row.label}</span>
                  <span style={{ color: row.color, fontFamily: "monospace", fontWeight: "bold", fontSize: "1.05rem" }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "library" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
            {filtered.map((t, i) => {
              const st = ST[t.status ?? "discovered"] ?? ST.discovered;
              const catColor = CAT_COLOR[t.category ?? ""] ?? "#64748b";
              return (
                <div
                  key={t.id ?? t._id ?? i}
                  style={{
                    background: "#ffffff",
                    border: `1px solid ${catColor}33`,
                    borderRadius: "10px",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "6px" }}>
                    <p style={{ fontWeight: "bold", fontSize: "0.85rem", lineHeight: 1.3, flex: 1, margin: 0 }}>
                      {t.name ?? t.company ?? "—"}
                    </p>
                    <span
                      style={{
                        fontSize: "0.6rem",
                        fontWeight: "bold",
                        padding: "2px 6px",
                        borderRadius: "99px",
                        background: st.bg,
                        color: st.color,
                        whiteSpace: "nowrap",
                        alignSelf: "flex-start",
                      }}
                    >
                      {st.label}
                    </span>
                  </div>
                  {t.credit_value && (
                    <p style={{ color: "#059669", fontFamily: "monospace", fontSize: "0.78rem", margin: 0 }}>
                      💰 {t.credit_value}
                    </p>
                  )}
                  {(t.notes ?? t.tool_type) && (
                    <p style={{ color: "#64748b", fontSize: "0.7rem", lineHeight: 1.4, margin: 0 }}>
                      {t.notes ?? t.tool_type}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "auto" }}>
                    {t.category && (
                      <span
                        style={{
                          fontSize: "0.62rem",
                          color: catColor,
                          background: `${catColor}18`,
                          padding: "1px 6px",
                          borderRadius: "99px",
                        }}
                      >
                        {t.category}
                      </span>
                    )}
                    {t.url && (
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: "0.65rem", color: "#94a3b8", marginRight: "auto", textDecoration: "none" }}
                      >
                        ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div
                style={{
                  gridColumn: "1/-1",
                  textAlign: "center",
                  padding: "40px 20px",
                  background: "#ffffff",
                  border: "1px dashed #cbd5e1",
                  borderRadius: "12px",
                  color: "#64748b",
                  fontSize: "0.88rem",
                }}
              >
                <p style={{ marginBottom: "10px" }}>אין עדיין רשומות ב־discovered_tools.json (והמערך tools ב־hunter_tools.json ריק).</p>
                <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                  זה תקין להפרדה: אפליקציות המותג מופיעות רק ב־
                  <Link href="/apps" style={{ color: "#1d4ed8", fontWeight: 700 }}>
                    /apps
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "bots" && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "28px 20px",
              textAlign: "center",
              color: "#64748b",
              fontSize: "0.88rem",
            }}
          >
            {bots.length === 0 ? (
              <>
                <p style={{ marginBottom: "8px" }}>אין Bots מקומיים בטאב זה — יתווסף כשיהיה מקור נתונים ייעודי ל-Hunter.</p>
                <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>לא מעורבב עם רשימת האפליקציות ב־/apps.</p>
              </>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
                {bots.map((t, i) => (
                  <div key={t.id ?? i} style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px" }}>
                    {t.name ?? "—"}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
