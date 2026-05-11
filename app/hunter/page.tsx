"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── Credit Calculator (ported from creditCalculator.js) ──────────────────────
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
  id?: string; _id?: string; name?: string; status?: string;
  credit_value?: string; category?: string; notes?: string;
  url?: string; registration_email?: string; company?: string;
  tool_type?: string; priority?: number; credit_type?: string;
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

// ─── Static fallback from ai_programs_export.json ─────────────────────────────
const STATIC_PROGRAMS: Tool[] = [
  { id: "1", name: "NVIDIA NIM / NGC Credits", status: "discovered", credit_value: "$1,000+", category: "cloud", notes: "NVIDIA Inception לסטארטאפים", url: "https://build.nvidia.com" },
  { id: "2", name: "xAI Grok API", status: "active", credit_value: "$25/חשבון", category: "llm", notes: "kredit1/2/3@baz-f.co.il", url: "https://console.x.ai" },
  { id: "3", name: "Google AI Studio (Gemini API)", status: "active", credit_value: "חינם", category: "llm", notes: "Gemini 2.0 Flash", url: "https://aistudio.google.com" },
  { id: "4", name: "Anthropic Claude API", status: "discovered", credit_value: "$5 חינם", category: "llm", notes: "Claude 3.5 Sonnet", url: "https://console.anthropic.com" },
  { id: "5", name: "OpenAI API", status: "active", credit_value: "$5", category: "llm", notes: "GPT-4o-mini", url: "https://platform.openai.com" },
  { id: "6", name: "Groq API", status: "discovered", credit_value: "חינם", category: "llm", notes: "Llama 3.3 70B — מהיר פי 100", url: "https://console.groq.com" },
  { id: "7", name: "Together AI", status: "discovered", credit_value: "$5 חינם", category: "llm", notes: "100+ מודלים Open Source", url: "https://api.together.xyz" },
  { id: "8", name: "Cloudflare Workers AI", status: "active", credit_value: "10,000 neurons/יום", category: "llm", notes: "Edge AI — חינמי", url: "https://developers.cloudflare.com/workers-ai" },
  { id: "9", name: "AWS Bedrock", status: "discovered", credit_value: "$1,000–$100,000", category: "cloud", notes: "AWS Activate לסטארטאפים", url: "https://aws.amazon.com/bedrock" },
  { id: "10", name: "Google Cloud (Vertex AI)", status: "discovered", credit_value: "$350 + עד $200,000", category: "cloud", notes: "Google for Startups", url: "https://cloud.google.com/vertex-ai" },
  { id: "11", name: "Microsoft Azure OpenAI", status: "discovered", credit_value: "$150–$150,000", category: "cloud", notes: "Microsoft for Startups", url: "https://azure.microsoft.com" },
  { id: "12", name: "DeepSeek API", status: "discovered", credit_value: "זול פי 20 מ-GPT-4", category: "llm", notes: "V3: $0.27/M tokens", url: "https://platform.deepseek.com" },
  { id: "13", name: "Fal.ai", status: "registered", credit_value: "$5 חינם", category: "image", notes: "FLUX.1 Schnell — $0.003/תמונה", url: "https://fal.ai" },
  { id: "14", name: "ElevenLabs", status: "discovered", credit_value: "10,000 תווים/חודש", category: "audio", notes: "קול AI — 29 שפות", url: "https://elevenlabs.io" },
  { id: "15", name: "Cloudflare Pages + Workers", status: "active", credit_value: "100K requests/יום", category: "server", notes: "R2, D1, KV — חינם", url: "https://pages.cloudflare.com" },
  { id: "16", name: "GitHub Actions + Copilot", status: "active", credit_value: "2,000 דקות/חודש", category: "devtools", notes: "CI/CD חינם", url: "https://github.com/features/actions" },
  { id: "17", name: "Supabase", status: "discovered", credit_value: "Free + $300 Startup", category: "data", notes: "PostgreSQL + pgvector", url: "https://supabase.com" },
  { id: "18", name: "Pinecone", status: "discovered", credit_value: "Starter חינם", category: "memory", notes: "100K vectors, 5GB", url: "https://pinecone.io" },
  { id: "19", name: "Anthropic", status: "active", credit_value: "$5", category: "llm", notes: "חשבון פעיל", url: "https://console.anthropic.com" },
  { id: "20", name: "Mistral AI", status: "active", credit_value: "$5", category: "llm", notes: "חשבון פעיל", url: "https://console.mistral.ai" },
];

// ─── JOB TYPES (from original engine) ─────────────────────────────────────────
const JOB_TYPES = [
  "credits_hunt", "new_tools", "llm_models", "image_deep", "video_deep",
  "cloud_credits", "startup_programs", "high_value_applications",
  "whatsapp_automation", "ai_news_innovations", "code_dev",
];

// ─── Status Config ─────────────────────────────────────────────────────────────
const ST: Record<string, { label: string; bg: string; color: string }> = {
  active:               { label: "פעיל",        bg: "#14532d", color: "#4ade80" },
  registered:           { label: "נרשם",         bg: "#1e3a5f", color: "#60a5fa" },
  discovered:           { label: "התגלה",        bg: "#1c1a00", color: "#facc15" },
  pending_registration: { label: "ממתין לרישום", bg: "#1c0a00", color: "#fb923c" },
  failed:               { label: "נכשל",         bg: "#2d0a0a", color: "#f87171" },
};

const CAT_COLOR: Record<string, string> = {
  llm: "#818cf8", cloud: "#38bdf8", image: "#f472b6",
  audio: "#a78bfa", memory: "#34d399", data: "#fb923c",
  server: "#facc15", devtools: "#60a5fa",
};

// ─── TABS ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "programs",   label: "🧠 כלי AI" },
  { id: "discovered", label: "🔍 נמצאו" },
  { id: "credits",    label: "💰 קרדיטים" },
  { id: "bots",       label: "🤖 Bots" },
];

export default function HunterPage() {
  // ── Data state ──
  const [programs, setPrograms] = useState<Tool[]>(STATIC_PROGRAMS);
  const [discovered, setDiscovered] = useState<Tool[]>([]);
  const [bots, setBots] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<string | null>(null);

  // ── UI state ──
  const [activeTab, setActiveTab] = useState("programs");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("הכל");
  const [isRunning, setIsRunning] = useState(false);
  const [scanLog, setScanLog] = useState<string[]>([]);
  const [jobIdx, setJobIdx] = useState(0);
  const [runsCount, setRunsCount] = useState(0);
  const isRunningRef = useRef(false);

  // ── Fetch live data from our API proxy ──
  const fetchLiveData = useCallback(() => {
    setLoading(true);
    setApiError(null);
    fetch("/api/hunter/data")
      .then((r) => r.json())
      .then((d: { ok: boolean; programs?: Tool[]; tools?: Tool[]; bots?: Tool[]; error?: string }) => {
        if (d.ok) {
          if (d.programs && d.programs.length > 0) setPrograms(d.programs);
          if (d.tools) setDiscovered(d.tools);
          if (d.bots) setBots(d.bots);
          setLastFetch(new Date().toLocaleTimeString("he-IL"));
        } else {
          setApiError(d.error ?? "שגיאה בטעינת נתונים");
        }
      })
      .catch((e: Error) => setApiError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLiveData(); }, [fetchLiveData]);

  // ── Scan simulation (visual engine from original) ──
  useEffect(() => {
    isRunningRef.current = isRunning;
    if (!isRunning) return;

    const runScan = () => {
      if (!isRunningRef.current) return;
      const type = JOB_TYPES[jobIdx % JOB_TYPES.length];
      setJobIdx((i) => i + 1);
      setRunsCount((c) => c + 1);
      setScanLog((prev) => [
        `[${new Date().toLocaleTimeString("he-IL")}] ⚡ סריקה: ${type}`,
        ...prev,
      ].slice(0, 12));
      // refresh data every 3 scans
      if (runsCount % 3 === 0) fetchLiveData();
    };

    runScan();
    const interval = setInterval(runScan, 30_000);
    return () => clearInterval(interval);
  }, [isRunning, jobIdx, runsCount, fetchLiveData]);

  // ── Credits calculation ──
  const allTools = useMemo(() => [...programs, ...discovered], [programs, discovered]);
  const credits = useMemo(() => calculateCredits(allTools), [allTools]);

  // ── Filtered list for current tab ──
  const baseList = useMemo(() =>
    activeTab === "discovered" ? discovered :
    activeTab === "bots"       ? bots :
    programs,
  [activeTab, programs, discovered, bots]);

  const filtered = useMemo(() => {
    let list = [...baseList];
    if (statusFilter !== "הכל") list = list.filter((t) => t.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        (t.name ?? "").toLowerCase().includes(q) ||
        (t.notes ?? "").toLowerCase().includes(q) ||
        (t.company ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [baseList, statusFilter, search]);

  // ── UI helpers ──
  const tabBtn = (id: string, label: string) => (
    <button key={id} onClick={() => setActiveTab(id)} style={{
      padding: "7px 16px", borderRadius: "8px", cursor: "pointer",
      fontWeight: "bold", fontSize: "0.82rem", whiteSpace: "nowrap",
      background: activeTab === id ? "#f59e0b" : "#0f172a",
      color: activeTab === id ? "#000" : "#64748b",
      border: activeTab === id ? "none" : "1px solid #1e1e2e",
    }}>
      {label}
    </button>
  );

  const stBtn = (st: string) => (
    <button key={st} onClick={() => setStatusFilter(st)} style={{
      padding: "4px 12px", borderRadius: "6px", cursor: "pointer",
      fontSize: "0.75rem", fontWeight: "bold",
      background: statusFilter === st ? "#1d4ed8" : "#0f172a",
      color: statusFilter === st ? "white" : "#64748b",
      border: statusFilter === st ? "none" : "1px solid #1e1e2e",
    }}>
      {st === "הכל" ? "הכל" : (ST[st]?.label ?? st)}
    </button>
  );

  return (
    <div dir="rtl" style={{ background: "#07070f", minHeight: "100vh", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>

      {/* ── HEADER (from original HunterHeader) ── */}
      <div style={{ background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #7c3aed 100%)", position: "relative", overflow: "hidden" }}>
        {/* Animated dots */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.2 }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} style={{
              position: "absolute", width: "4px", height: "4px",
              background: "white", borderRadius: "50%",
              left: `${(i * 17 + 5) % 100}%`, top: `${(i * 13 + 3) % 100}%`,
              animation: `pulse 2s ease-in-out ${i * 0.3}s infinite`,
            }} />
          ))}
        </div>

        <div dir="rtl" style={{ position: "relative", maxWidth: "1400px", margin: "0 auto", padding: "14px 20px" }}>
          {/* Row 1: Title + buttons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", background: "rgba(0,0,0,0.3)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
                ⚡
              </div>
              <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: "900", color: "white", margin: 0 }}>BAZ Credit Hunter</h1>
                <p style={{ color: "rgba(255,255,220,0.8)", fontSize: "0.78rem", margin: 0 }}>מכונת דלק דיגיטלית — סורקת, מוצאת, שואבת מכל העולם</p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Runs counter */}
              <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: "10px", padding: "8px 14px", textAlign: "center" }}>
                <div style={{ color: "#facc15", fontWeight: "bold", fontSize: "1.2rem", fontFamily: "monospace" }}>{runsCount.toLocaleString()}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.65rem" }}>ריצות</div>
              </div>

              <button onClick={fetchLiveData} disabled={loading} style={{
                background: "rgba(0,0,0,0.3)", color: "white", border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px", padding: "8px 14px", cursor: "pointer", fontWeight: "bold", fontSize: "0.82rem",
              }}>
                {loading ? "⏳ טוען..." : "🔍 סרוק"}
              </button>

              <button onClick={() => setIsRunning((r) => !r)} style={{
                padding: "8px 18px", borderRadius: "8px", fontWeight: "bold", fontSize: "0.88rem",
                cursor: "pointer", border: "none",
                background: isRunning ? "#dc2626" : "#16a34a",
                color: "white",
              }}>
                {isRunning ? "⏸ עצור" : "▶ הפעל"}
              </button>
            </div>
          </div>

          {/* Status bar */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", flexWrap: "wrap", gap: "8px" }}>
            <span>⚡ סורק: קרדיטים • שרתים • פאנלים • LLM • ענן • מענקי סטארטאפ</span>
            {isRunning
              ? <span style={{ color: "#86efac" }}>● פעיל — סריקה כל 30 שניות</span>
              : <span style={{ color: "rgba(255,255,255,0.3)" }}>● מופסק — לחץ הפעל</span>
            }
          </div>

          {/* Running progress bar */}
          {isRunning && (
            <div style={{ height: "3px", background: "rgba(0,0,0,0.2)", marginTop: "8px", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", background: "#4ade80", animation: "scan-bar 2s ease-in-out infinite" }} />
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px" }}>

        {/* API error notice */}
        {apiError && (
          <div style={{ background: "#1c0a0a", border: "1px solid #7f1d1d", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", fontSize: "0.82rem" }}>
            <span style={{ color: "#f87171" }}>⚠️ API: {apiError}</span>
            <span style={{ color: "#475569", marginRight: "12px" }}> — מציג נתונים סטטיים</span>
          </div>
        )}

        {/* ── STATS (from original HunterStats) ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px", marginBottom: "20px" }}>
          {[
            { label: "סה״כ כלים", value: allTools.length, icon: "🗄️", color: "#60a5fa" },
            { label: "כלים פעילים", value: credits.activeCount, icon: "✅", color: "#4ade80" },
            { label: "נמצאו", value: discovered.length, icon: "🔍", color: "#facc15" },
            { label: "💚 קרדיטים פעילים", value: formatCreditsCompact(credits.active), icon: "🔑", color: "#4ade80" },
            { label: "🟡 פוטנציאלי", value: formatCreditsCompact(credits.potential), icon: "💡", color: "#fbbf24" },
            { label: "💎 סה״כ", value: formatCreditsCompact(credits.total), icon: "💎", color: "#a78bfa" },
            { label: "ריצות", value: runsCount, icon: "⚡", color: "#38bdf8" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", marginBottom: "4px" }}>{s.icon}</div>
              <div style={{ color: s.color, fontSize: "1.3rem", fontWeight: "900", fontFamily: "monospace" }}>{s.value}</div>
              <div style={{ color: "#4b5563", fontSize: "0.68rem", marginTop: "2px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── SCAN LOG ── */}
        {scanLog.length > 0 && (
          <div style={{ background: "#0a0f0a", border: "1px solid #166534", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", fontFamily: "monospace", fontSize: "0.72rem", color: "#4ade80", maxHeight: "120px", overflowY: "auto" }}>
            {scanLog.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        )}

        {/* ── SEARCH + FILTERS ── */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 חיפוש גלובלי..."
            style={{
              background: "#111118", border: "1px solid #1e1e2e", borderRadius: "8px",
              padding: "7px 14px", color: "#e2e8f0", fontSize: "0.85rem", flex: 1,
              minWidth: "200px", outline: "none",
            }}
          />
          {["הכל", "active", "registered", "discovered", "pending_registration"].map(stBtn)}
          {lastFetch && <span style={{ color: "#334155", fontSize: "0.7rem", marginRight: "auto" }}>עדכון: {lastFetch}</span>}
        </div>

        {/* ── TABS ── */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap", borderBottom: "1px solid #1e1e2e", paddingBottom: "12px" }}>
          {TABS.map((t) => tabBtn(t.id, t.label))}
          <span style={{ color: "#334155", fontSize: "0.75rem", alignSelf: "center", marginRight: "auto" }}>
            {filtered.length} רשומות
          </span>
        </div>

        {/* ── CREDITS TAB ── */}
        {activeTab === "credits" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "520px" }}>
            <div style={{ background: "#0f172a", border: "1px solid #166534", borderRadius: "12px", padding: "20px" }}>
              <p style={{ color: "#4ade80", fontWeight: "bold", fontSize: "1.1rem", marginBottom: "12px" }}>
                💎 סיכום קרדיטים
              </p>
              {[
                { label: "קרדיטים פעילים (registered + active)", value: formatCreditsCompact(credits.active), color: "#4ade80" },
                { label: "פוטנציאל (discovered + pending)", value: formatCreditsCompact(credits.potential), color: "#fbbf24" },
                { label: "סה״כ אפשרי", value: formatCreditsCompact(credits.total), color: "#a78bfa" },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #0f172a" }}>
                  <span style={{ color: "#64748b", fontSize: "0.85rem" }}>{row.label}</span>
                  <span style={{ color: row.color, fontFamily: "monospace", fontWeight: "bold", fontSize: "1.1rem" }}>{row.value}</span>
                </div>
              ))}
            </div>
            <a href="/hunter" style={{ display: "none" }} />
          </div>
        )}

        {/* ── TOOLS GRID ── */}
        {activeTab !== "credits" && (
          <>
            {loading && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: "10px", height: "110px", opacity: 0.4 }} />
                ))}
              </div>
            )}

            {!loading && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
                {filtered.map((t, i) => {
                  const st = ST[t.status ?? "discovered"] ?? ST.discovered;
                  const catColor = CAT_COLOR[t.category ?? ""] ?? "#64748b";
                  return (
                    <div key={t.id ?? t._id ?? i} style={{
                      background: "#111118", border: `1px solid ${catColor}22`,
                      borderRadius: "10px", padding: "12px",
                      display: "flex", flexDirection: "column", gap: "6px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "6px" }}>
                        <p style={{ fontWeight: "bold", fontSize: "0.85rem", lineHeight: 1.3, flex: 1 }}>
                          {t.name ?? t.company ?? "—"}
                        </p>
                        <span style={{ fontSize: "0.6rem", fontWeight: "bold", padding: "2px 6px", borderRadius: "99px", background: st.bg, color: st.color, whiteSpace: "nowrap", alignSelf: "flex-start" }}>
                          {st.label}
                        </span>
                      </div>
                      {t.credit_value && (
                        <p style={{ color: "#34d399", fontFamily: "monospace", fontSize: "0.78rem" }}>💰 {t.credit_value}</p>
                      )}
                      {(t.notes ?? t.tool_type) && (
                        <p style={{ color: "#475569", fontSize: "0.7rem", lineHeight: 1.4 }}>{t.notes ?? t.tool_type}</p>
                      )}
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "auto" }}>
                        {t.category && (
                          <span style={{ fontSize: "0.62rem", color: catColor, background: `${catColor}18`, padding: "1px 6px", borderRadius: "99px" }}>
                            {t.category}
                          </span>
                        )}
                        {t.url && (
                          <a href={t.url} target="_blank" rel="noreferrer" style={{ fontSize: "0.65rem", color: "#334155", marginRight: "auto", textDecoration: "none" }}>
                            ↗
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filtered.length === 0 && (
                  <p style={{ color: "#334155", gridColumn: "1/-1", textAlign: "center", padding: "48px" }}>
                    {loading ? "טוען..." : "אין תוצאות"}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* Back */}
        <div style={{ marginTop: "32px", textAlign: "center" }}>
          <a href="/" style={{ color: "#334155", fontSize: "0.75rem", textDecoration: "none" }}>← חזור לראשי</a>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
        @keyframes scan-bar { 0%{width:0%} 50%{width:100%} 100%{width:0%;margin-right:100%} }
      `}</style>
    </div>
  );
}
