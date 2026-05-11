"use client";
import React, { useState, useMemo } from "react";

// ─── Static Data (ai_programs_export.json) ───────────────────────────────────
const EXPORT_META = {
  total: 82,
  source: "Base44 — BAZ Credit Hunter",
  exported: "2026-05-11",
};

const PROGRAMS = [
  { id: "69f5080be7816b4613669ffc", name: "NVIDIA NIM / NGC Credits", category: "cloud", status: "discovered", credit_value: "$1,000+", url: "https://build.nvidia.com", priority: 10, credit_type: "startup_credits", notes: "NVIDIA Inception לסטארטאפים — GPU חינמי", registration_email: null },
  { id: "69f5080be7816b4613669ffd", name: "xAI Grok API", category: "llm", status: "active", credit_value: "$25/חשבון", url: "https://console.x.ai", priority: 9, credit_type: "api_credits", notes: "kredit1/2/3 @baz-f.co.il — כל חשבון $25", registration_email: "kredit1@baz-f.co.il" },
  { id: "69f5080be7816b4613669ffe", name: "Google AI Studio (Gemini API)", category: "llm", status: "active", credit_value: "חינם (rate limited)", url: "https://aistudio.google.com", priority: 9, credit_type: "free_tier", notes: "Gemini 2.0 Flash חינמי לגמרי", registration_email: "avi@baz-f.co.il" },
  { id: "69f5080be7816b4613669fff", name: "Anthropic Claude API", category: "llm", status: "discovered", credit_value: "$5 חינם", url: "https://console.anthropic.com", priority: 8, credit_type: "trial", notes: "Claude 3.5 Sonnet, Claude 3 Haiku — $5 בפתיחת חשבון", registration_email: null },
  { id: "69f5080be7816b461366a000", name: "OpenAI API", category: "llm", status: "discovered", credit_value: "GPT-4o-mini זול מאוד", url: "https://platform.openai.com", priority: 7, credit_type: "trial", notes: "GPT-4o-mini: $0.15/M tokens", registration_email: null },
  { id: "69f5080be7816b461366a001", name: "Mistral AI API", category: "llm", status: "discovered", credit_value: "Mistral 7B חינם", url: "https://console.mistral.ai", priority: 7, credit_type: "free_tier", notes: "Mistral Large, Small, Mixtral 8x7B", registration_email: null },
  { id: "69f5080be7816b461366a002", name: "Groq API (LLM במהירות אור)", category: "llm", status: "discovered", credit_value: "חינם (rate limited)", url: "https://console.groq.com", priority: 9, credit_type: "free_tier", notes: "Llama 3.3 70B — מהיר פי 100 מ-GPT-4", registration_email: null },
  { id: "69f5080be7816b461366a003", name: "Together AI", category: "llm", status: "discovered", credit_value: "$5 חינם", url: "https://api.together.xyz", priority: 8, credit_type: "trial", notes: "100+ מודלים Open Source — Llama, DeepSeek", registration_email: null },
  { id: "69f5080be7816b461366a004", name: "Cloudflare Workers AI", category: "llm", status: "active", credit_value: "10,000 neurons/יום חינם", url: "https://developers.cloudflare.com/workers-ai", priority: 9, credit_type: "free_tier", notes: "Llama, Whisper, SDXL — Edge AI", registration_email: null },
  { id: "69f5080be7816b461366a005", name: "AWS Bedrock", category: "cloud", status: "discovered", credit_value: "$1,000–$100,000", url: "https://aws.amazon.com/bedrock", priority: 9, credit_type: "startup_credits", notes: "AWS Activate לסטארטאפים", registration_email: null },
  { id: "69f5080be7816b461366a006", name: "Google Cloud (Vertex AI)", category: "cloud", status: "discovered", credit_value: "$350 + עד $200,000 Startup", url: "https://cloud.google.com/vertex-ai", priority: 10, credit_type: "startup_credits", notes: "Google for Startups Cloud Program", registration_email: null },
  { id: "69f5080be7816b461366a007", name: "Microsoft Azure OpenAI", category: "cloud", status: "discovered", credit_value: "$150–$150,000", url: "https://azure.microsoft.com", priority: 10, credit_type: "startup_credits", notes: "Microsoft for Startups Founders Hub", registration_email: null },
  { id: "69f5080be7816b461366a008", name: "DeepSeek API", category: "llm", status: "discovered", credit_value: "זול פי 20 מ-GPT-4", url: "https://platform.deepseek.com", priority: 8, credit_type: "trial", notes: "V3: $0.27/M tokens — זול פי 10 מ-Claude", registration_email: null },
  { id: "69f5080be7816b461366a009", name: "Hugging Face Inference API", category: "llm", status: "discovered", credit_value: "Free + Pro $9/חודש", url: "https://huggingface.co/inference-api", priority: 8, credit_type: "free_tier", notes: "Llama, Mistral, Qwen, Flux — מאות מודלים", registration_email: null },
  { id: "69f5080be7816b461366a00a", name: "Replicate", category: "image", status: "discovered", credit_value: "Pay-per-use זול", url: "https://replicate.com", priority: 7, credit_type: "trial", notes: "FLUX.1, SDXL, Whisper — $5 חינמיים", registration_email: null },
  { id: "69f5080be7816b461366a00b", name: "ElevenLabs", category: "audio", status: "discovered", credit_value: "10,000 תווים/חודש חינם", url: "https://elevenlabs.io", priority: 7, credit_type: "free_tier", notes: "קול AI מציאותי — 29 שפות כולל עברית", registration_email: null },
  { id: "69f5080be7816b461366a00c", name: "Pinecone", category: "memory", status: "discovered", credit_value: "Starter חינם", url: "https://pinecone.io", priority: 6, credit_type: "free_tier", notes: "100,000 vectors, 5GB חינם", registration_email: null },
  { id: "69f5080be7816b461366a00d", name: "Supabase", category: "data", status: "discovered", credit_value: "Free + Startup $300", url: "https://supabase.com", priority: 7, credit_type: "free_tier", notes: "500MB DB + pgvector + 50K Auth חינם", registration_email: null },
  { id: "69f5080be7816b461366a00e", name: "Vercel", category: "server", status: "active", credit_value: "Hobby חינם", url: "https://vercel.com", priority: 5, credit_type: "free_tier", notes: "Next.js hosting חינמי", registration_email: null },
  { id: "69f5080be7816b461366a00f", name: "Cloudflare Pages + Workers", category: "server", status: "active", credit_value: "100K requests/יום חינם", url: "https://pages.cloudflare.com", priority: 8, credit_type: "free_tier", notes: "R2: 10GB, D1: SQLite, KV — הכל חינם", registration_email: null },
  { id: "69f5080be7816b461366a010", name: "GitHub Actions + Copilot", category: "devtools", status: "active", credit_value: "2,000 דקות/חודש חינם", url: "https://github.com/features/actions", priority: 7, credit_type: "free_tier", notes: "CI/CD חינם — חשבון קיים", registration_email: null },
  { id: "69f5080be7816b461366a011", name: "RunPod (GPU On-Demand)", category: "cloud", status: "discovered", credit_value: "GPU מ-$0.09/שעה", url: "https://runpod.io", priority: 7, credit_type: "trial", notes: "RTX 4090: $0.44/שעה", registration_email: null },
  { id: "69f5080be7816b461366a012", name: "Alibaba Cloud AI", category: "cloud", status: "discovered", credit_value: "עד $3,000 Startup", url: "https://www.alibabacloud.com", priority: 7, credit_type: "startup_credits", notes: "Qwen API + Tongyi Wanxiang", registration_email: null },
  { id: "69f5080be7816b461366a014", name: "Stability AI", category: "image", status: "discovered", credit_value: "25 קרדיטים חינם", url: "https://platform.stability.ai", priority: 6, credit_type: "trial", notes: "SDXL, SD 3.5 — 3-6 קרדיטים/תמונה", registration_email: null },
  { id: "69f5080be7816b461366a015", name: "Fal.ai", category: "image", status: "registered", credit_value: "$5 חינם", url: "https://fal.ai", priority: 8, credit_type: "trial", notes: "FLUX.1 Schnell — $0.003/תמונה", registration_email: "ins@baz-f.co.il" },
  { id: "69f5080be7816b461366a016", name: "Suno AI", category: "audio", status: "discovered", credit_value: "50 שירים/יום חינם", url: "https://suno.com", priority: 5, credit_type: "free_tier", notes: "מוזיקה מלאה מטקסט", registration_email: null },
  { id: "69f5080be7816b461366a017", name: "Perplexity AI API", category: "llm", status: "discovered", credit_value: "חיפוש + LLM", url: "https://www.perplexity.ai/api", priority: 6, credit_type: "trial", notes: "Sonar — AI + Search בזמן אמת", registration_email: null },
  { id: "69f0edaa7f1f545f1d704edb", name: "OpenAI", category: "llm", status: "active", credit_value: "$5", url: "https://platform.openai.com", priority: 10, credit_type: "api_credits", notes: "חשבון פעיל", registration_email: "ins@baz-f.co.il" },
  { id: "69f0edaa7f1f545f1d704edc", name: "Anthropic", category: "llm", status: "active", credit_value: "$5", url: "https://console.anthropic.com", priority: 10, credit_type: "api_credits", notes: "חשבון פעיל", registration_email: "ins@baz-f.co.il" },
  { id: "69f0edaa7f1f545f1d704edd", name: "Google AI Studio", category: "llm", status: "active", credit_value: "Free", url: "https://aistudio.google.com", priority: 9, credit_type: "free_tier", notes: "חשבון פעיל", registration_email: "ins@baz-f.co.il" },
  { id: "69f0edaa7f1f545f1d704ede", name: "Mistral AI", category: "llm", status: "active", credit_value: "$5", url: "https://console.mistral.ai", priority: 8, credit_type: "api_credits", notes: "חשבון פעיל", registration_email: "ins@baz-f.co.il" },
];

// ─── Config ───────────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  llm: "LLM", cloud: "ענן", image: "תמונה", audio: "אודיו",
  memory: "זיכרון", data: "דאטה", server: "שרתים", devtools: "DevTools",
};
const CATEGORY_COLORS: Record<string, string> = {
  llm: "#818cf8", cloud: "#38bdf8", image: "#f472b6",
  audio: "#a78bfa", memory: "#34d399", data: "#fb923c",
  server: "#facc15", devtools: "#60a5fa",
};
const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  active:     { label: "פעיל",    bg: "#14532d", color: "#4ade80" },
  registered: { label: "רשום",    bg: "#1e3a5f", color: "#60a5fa" },
  discovered: { label: "מזוהה",   bg: "#1c1a00", color: "#facc15" },
};
const CREDIT_TYPE_LABELS: Record<string, string> = {
  api_credits:     "API Credits",
  free_tier:       "Free Tier",
  startup_credits: "Startup Credits",
  trial:           "Trial",
};
const ALL_CATS = ["הכל", ...Object.keys(CATEGORY_LABELS)];

export default function HunterPage() {
  const [search, setSearch]   = useState("");
  const [catFilter, setCat]   = useState("הכל");
  const [statFilter, setStat] = useState("הכל");
  const [sort, setSort]       = useState<"priority" | "name">("priority");
  const [selected, setSelected] = useState<typeof PROGRAMS[0] | null>(null);

  const activeCount     = PROGRAMS.filter((p) => p.status === "active").length;
  const registeredCount = PROGRAMS.filter((p) => p.status === "registered").length;
  const discoveredCount = PROGRAMS.filter((p) => p.status === "discovered").length;
  const startupCredits  = PROGRAMS.filter((p) => p.credit_type === "startup_credits").length;

  const filtered = useMemo(() => {
    let list = [...PROGRAMS];
    if (catFilter !== "הכל") list = list.filter((p) => p.category === catFilter);
    if (statFilter !== "הכל") list = list.filter((p) => p.status === statFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.notes.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) =>
      sort === "priority" ? b.priority - a.priority : a.name.localeCompare(b.name),
    );
    return list;
  }, [catFilter, statFilter, search, sort]);

  const s = (active: boolean, color = "#1d4ed8") => ({
    padding: "6px 14px", borderRadius: "8px", cursor: "pointer",
    fontWeight: "bold" as const, fontSize: "0.8rem",
    background: active ? color : "#0f172a",
    color: active ? "#fff" : "#64748b",
    border: active ? "none" : "1px solid #1e3a5f",
  });

  return (
    <div dir="rtl" style={{ background: "#0a0f1e", minHeight: "100vh", padding: "28px", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
        <div>
          <h1 style={{ fontSize: "1.9rem", color: "#facc15", fontWeight: "900", letterSpacing: "-0.5px" }}>
            🎯 Hunter Hub — Credit Arsenal
          </h1>
          <p style={{ color: "#475569", fontSize: "0.82rem", marginTop: "4px" }}>
            {EXPORT_META.source} · יוצא: {EXPORT_META.exported} · {filtered.length} / {PROGRAMS.length} רשומות מוצגות
          </p>
        </div>
        <a href="/" style={{ color: "#475569", fontSize: "0.78rem", textDecoration: "none", marginTop: "8px" }}>← ראשי</a>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px", marginTop: "20px" }}>
        {[
          { label: "סה״כ במערכת",     value: EXPORT_META.total, color: "#94a3b8" },
          { label: "פעילים (Active)",  value: activeCount,       color: "#4ade80" },
          { label: "רשומים",           value: registeredCount,   color: "#60a5fa" },
          { label: "Startup Credits",  value: startupCredits,    color: "#f59e0b" },
        ].map((c) => (
          <div key={c.label} style={{ background: "#0f172a", border: `1px solid ${c.color}33`, borderRadius: "12px", padding: "16px 20px" }}>
            <p style={{ color: c.color, fontSize: "2rem", fontWeight: "900", fontFamily: "monospace" }}>{c.value}</p>
            <p style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "2px" }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
        {ALL_CATS.map((c) => (
          <button key={c} style={s(catFilter === c, CATEGORY_COLORS[c] ?? "#1d4ed8")} onClick={() => setCat(c)}>
            {c === "הכל" ? "הכל" : CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px", alignItems: "center" }}>
        {["הכל", "active", "registered", "discovered"].map((st) => (
          <button key={st} style={s(statFilter === st)} onClick={() => setStat(st)}>
            {st === "הכל" ? "כל סטטוס" : STATUS_CONFIG[st]?.label ?? st}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש..."
          style={{
            background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: "8px",
            padding: "6px 12px", color: "#e2e8f0", fontSize: "0.82rem", outline: "none",
            marginRight: "auto",
          }}
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "priority" | "name")}
          style={{
            background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: "8px",
            padding: "6px 12px", color: "#94a3b8", fontSize: "0.82rem",
          }}
        >
          <option value="priority">מיון: עדיפות</option>
          <option value="name">מיון: שם</option>
        </select>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
        {filtered.map((p) => {
          const st = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.discovered;
          const catColor = CATEGORY_COLORS[p.category] ?? "#64748b";
          return (
            <div
              key={p.id}
              onClick={() => setSelected(p)}
              style={{
                background: "#0f172a",
                border: `1px solid ${catColor}33`,
                borderRadius: "12px",
                padding: "14px",
                cursor: "pointer",
                display: "flex", flexDirection: "column", gap: "7px",
                transition: "border-color 0.15s",
              }}
            >
              {/* Top row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                <p style={{ fontWeight: "bold", fontSize: "0.88rem", lineHeight: 1.3, flex: 1 }}>{p.name}</p>
                <span style={{
                  fontSize: "0.65rem", fontWeight: "bold", padding: "2px 7px", borderRadius: "99px",
                  background: st.bg, color: st.color, whiteSpace: "nowrap",
                }}>{st.label}</span>
              </div>

              {/* Category + priority */}
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span style={{ fontSize: "0.68rem", color: catColor, background: `${catColor}18`, padding: "1px 7px", borderRadius: "99px" }}>
                  {CATEGORY_LABELS[p.category] ?? p.category}
                </span>
                <span style={{ fontSize: "0.68rem", color: "#475569" }}>
                  {"★".repeat(Math.min(p.priority, 5))}{"☆".repeat(Math.max(0, 5 - p.priority))}
                </span>
              </div>

              {/* Credit */}
              <p style={{ color: "#34d399", fontFamily: "monospace", fontSize: "0.82rem" }}>
                💰 {p.credit_value}
              </p>

              {/* Notes */}
              <p style={{ color: "#64748b", fontSize: "0.72rem", lineHeight: 1.45, flexGrow: 1 }}>{p.notes}</p>

              {/* Email */}
              {p.registration_email && (
                <p style={{ color: "#334155", fontSize: "0.7rem" }}>📧 {p.registration_email}</p>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p style={{ color: "#475569", gridColumn: "1/-1", textAlign: "center", padding: "48px" }}>
            אין תוצאות לחיפוש זה.
          </p>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed", inset: 0, background: "#00000099",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0f172a", border: `1px solid ${CATEGORY_COLORS[selected.category] ?? "#1e3a5f"}`,
              borderRadius: "16px", padding: "28px", maxWidth: "480px", width: "90%",
              display: "flex", flexDirection: "column", gap: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h2 style={{ color: "#facc15", fontSize: "1.15rem", fontWeight: "bold", lineHeight: 1.3 }}>{selected.name}</h2>
              <button onClick={() => setSelected(null)} style={{ color: "#475569", background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { label: "קטגוריה",   value: CATEGORY_LABELS[selected.category] ?? selected.category },
                { label: "סטטוס",     value: STATUS_CONFIG[selected.status]?.label ?? selected.status },
                { label: "קרדיטים",   value: selected.credit_value },
                { label: "סוג קרדיט", value: CREDIT_TYPE_LABELS[selected.credit_type] ?? selected.credit_type },
                { label: "עדיפות",    value: `${selected.priority} / 10` },
                { label: "אימייל",    value: selected.registration_email ?? "—" },
              ].map((row) => (
                <div key={row.label} style={{ background: "#0a0f1e", borderRadius: "8px", padding: "10px 12px" }}>
                  <p style={{ color: "#475569", fontSize: "0.7rem" }}>{row.label}</p>
                  <p style={{ color: "#e2e8f0", fontSize: "0.85rem", fontWeight: "bold", marginTop: "2px" }}>{row.value}</p>
                </div>
              ))}
            </div>

            <div style={{ background: "#0a0f1e", borderRadius: "8px", padding: "12px" }}>
              <p style={{ color: "#475569", fontSize: "0.7rem", marginBottom: "4px" }}>פרטים</p>
              <p style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.55 }}>{selected.notes}</p>
            </div>

            <a
              href={selected.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block", textAlign: "center", background: "#1d4ed8",
                color: "white", padding: "10px", borderRadius: "8px",
                textDecoration: "none", fontWeight: "bold", fontSize: "0.88rem",
              }}
            >
              פתח ← {selected.url.replace("https://", "")}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
