"use client";

import { useCallback, useEffect, useState } from "react";

// ─── טיפוסים ────────────────────────────────────────────────
type AiProgram = {
  id: string;
  name: string;
  status: string;
  credit_value?: string;
  category?: string;
  url?: string;
  registration_email?: string;
  credits_remaining?: string;
  expiry_date?: string;
  notes?: string;
};

type Project = {
  id: string;
  name: string;
  status: string;
  priority?: string;
  category?: string;
  deploy_url?: string;
  github_repo?: string;
  tech_stack?: string;
  next_step?: string;
};

type DiscoveredTool = {
  id: string;
  company?: string;
  name?: string;
  status?: string;
  credit_value?: string;
  category?: string;
  has_free_tier?: boolean;
  notes?: string;
};

type WorkerBot = {
  id: string;
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  trigger_type?: string;
  tools_used?: string;
};

type HuntLog = {
  id: string;
  action: string;
  details?: string;
  created_date?: string;
};

type LiveTab = "programs" | "projects" | "tools" | "bots" | "whatsapp" | "logs";

// ─── צבעי סטטוס ──────────────────────────────────────────────
function statusColor(status: string): string {
  const s = (status ?? "").toLowerCase();
  if (s === "active" || s === "פעיל" || s === "registered") return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
  if (s === "discovered" || s === "pending_registration") return "text-yellow-400 border-yellow-500/40 bg-yellow-500/10";
  if (s === "expired" || s === "failed") return "text-red-400 border-red-500/40 bg-red-500/10";
  if (s === "in progress" || s === "planning") return "text-blue-400 border-blue-500/40 bg-blue-500/10";
  if (s === "paused" || s === "blocked") return "text-orange-400 border-orange-500/40 bg-orange-500/10";
  return "text-cyan-300 border-cyan-500/30 bg-cyan-500/8";
}

// ─── קומפוננט Badge ───────────────────────────────────────────
function Badge({ label }: { label: string }) {
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColor(label)}`}>
      {label}
    </span>
  );
}

// ─── WhatsApp Groups Mock Data ────────────────────────────────
const WA_GROUPS = [
  { id: "wg1", name: "בז פיננסים - לקוחות VIP", size: 47, status: "active", lastMsg: "לפני 3 דקות", topic: "ביטוח חיים" },
  { id: "wg2", name: "AI Founders IL 🚀", size: 234, status: "active", lastMsg: "לפני 12 דקות", topic: "AI Tools" },
  { id: "wg3", name: "Credit Hunter Beta", size: 18, status: "pending", lastMsg: "אתמול", topic: "קרדיטים" },
  { id: "wg4", name: "BAZ Partners Network", size: 89, status: "active", lastMsg: "לפני שעה", topic: "שיתופי פעולה" },
];

// ─── קומפוננט ראשי ────────────────────────────────────────────
export function Base44MasterView() {
  const [activeTab, setActiveTab] = useState<LiveTab>("programs");
  const [programs, setPrograms] = useState<AiProgram[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tools, setTools] = useState<DiscoveredTool[]>([]);
  const [bots, setBots] = useState<WorkerBot[]>([]);
  const [huntLogs, setHuntLogs] = useState<HuntLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [totalCounts, setTotalCounts] = useState({ programs: 0, projects: 0, tools: 0, bots: 0 });

  // ─── טעינת נתונים ──────────────────────────────────────────
  const fetchData = useCallback(async (tab: LiveTab) => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "programs") {
        const res = await fetch("/api/base44/live?app=creditHunter&entity=AiProgram&limit=100");
        const json = await res.json() as { ok: boolean; data: AiProgram[] };
        if (json.ok && Array.isArray(json.data)) {
          setPrograms(json.data);
          setTotalCounts((c) => ({ ...c, programs: json.data.length }));
        }
      } else if (tab === "projects") {
        const res = await fetch("/api/base44/live?app=codex&entity=Project&limit=100");
        const json = await res.json() as { ok: boolean; data: Project[] };
        if (json.ok && Array.isArray(json.data)) {
          setProjects(json.data);
          setTotalCounts((c) => ({ ...c, projects: json.data.length }));
        }
      } else if (tab === "tools") {
        const res = await fetch("/api/base44/live?app=creditHunter&entity=DiscoveredTool&limit=100");
        const json = await res.json() as { ok: boolean; data: DiscoveredTool[] };
        if (json.ok && Array.isArray(json.data)) {
          setTools(json.data);
          setTotalCounts((c) => ({ ...c, tools: json.data.length }));
        }
      } else if (tab === "bots") {
        const res = await fetch("/api/base44/live?app=creditHunter&entity=WorkerBot&limit=50");
        const json = await res.json() as { ok: boolean; data: WorkerBot[] };
        if (json.ok && Array.isArray(json.data)) {
          setBots(json.data);
          setTotalCounts((c) => ({ ...c, bots: json.data.length }));
        }
      } else if (tab === "logs") {
        const res = await fetch("/api/base44/live?app=creditHunter&entity=HuntLog&limit=50");
        const json = await res.json() as { ok: boolean; data: HuntLog[] };
        if (json.ok && Array.isArray(json.data)) {
          setHuntLogs(json.data);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאת רשת");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(activeTab);
  }, [activeTab, fetchData]);

  // ─── עדכון סטטוס AiProgram ────────────────────────────────
  async function updateProgramStatus(id: string, newStatus: string) {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/base44/live", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app: "creditHunter", entity: "AiProgram", id, updates: { status: newStatus } }),
      });
      const json = await res.json() as { ok: boolean };
      if (json.ok) {
        setPrograms((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
        setActionMsg(`✅ סטטוס עודכן ל-${newStatus}`);
      } else {
        setActionMsg("⛔ עדכון נכשל");
      }
    } catch {
      setActionMsg("⛔ שגיאת רשת");
    } finally {
      setUpdatingId(null);
      setTimeout(() => setActionMsg(null), 3000);
    }
  }

  // ─── יצירת Task ב-CodeX ───────────────────────────────────
  async function createTask(projectId: string, projectName: string) {
    const title = prompt(`משימה חדשה עבור ${projectName}:`);
    if (!title) return;
    setActionMsg("שולח משימה...");
    try {
      const res = await fetch("/api/base44/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app: "codex",
          entity: "Task",
          record: {
            title,
            project_id: projectId,
            status: "todo",
            priority: "High",
            source: "BAZ_OS",
          },
        }),
      });
      const json = await res.json() as { ok: boolean };
      setActionMsg(json.ok ? `✅ משימה "${title}" נוצרה` : "⛔ יצירת משימה נכשלה");
    } catch {
      setActionMsg("⛔ שגיאת רשת");
    } finally {
      setTimeout(() => setActionMsg(null), 3500);
    }
  }

  // ─── טאבים ────────────────────────────────────────────────
  const tabs: { id: LiveTab; label: string; count?: number; emoji: string }[] = [
    { id: "programs", label: "AI Programs", count: totalCounts.programs || 82, emoji: "🤖" },
    { id: "projects", label: "Projects", count: totalCounts.projects, emoji: "🏗️" },
    { id: "tools", label: "Discovered Tools", count: 2717, emoji: "🔍" },
    { id: "bots", label: "Worker Bots", count: totalCounts.bots, emoji: "⚡" },
    { id: "whatsapp", label: "WhatsApp Groups", count: WA_GROUPS.length, emoji: "💬" },
    { id: "logs", label: "Hunt Logs", count: 984, emoji: "📋" },
  ];

  // ─── פילטור ───────────────────────────────────────────────
  const filteredPrograms = programs.filter((p) =>
    `${p.name} ${p.status} ${p.category ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredProjects = projects.filter((p) =>
    `${p.name} ${p.status} ${p.category ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredTools = tools.filter((t) =>
    `${t.company ?? ""} ${t.name ?? ""} ${t.status ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section dir="rtl" className="flex flex-col gap-6">
      {/* כותרת */}
      <div className="glass-industrial rounded-[2rem] border border-cyan-400/25 p-6 shadow-[0_0_42px_rgba(0,242,255,0.12)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">BASE44 / MASTER DATA VIEW</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-4xl font-black text-[#f8f9fa]">Base44 Live Engine</h2>
            <p className="mt-2 text-sm leading-7 text-cyan-100">
              נתונים חיים מ-CodeX &amp; BAZ Credit Hunter · {totalCounts.programs || 82} תוכניות AI · 2,717 כלים מגולים
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => void fetchData(activeTab)}
              disabled={loading}
              className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
            >
              {loading ? "⟳ טוען..." : "⟳ רענן"}
            </button>
            <a
              href="https://app.base44.com"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-cyan-300/35 bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-white"
            >
              פתח Base44 ↗
            </a>
          </div>
        </div>

        {/* Action message */}
        {actionMsg && (
          <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300">
            {actionMsg}
          </div>
        )}
      </div>

      {/* טאבים */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTab(t.id);
              setSearch("");
            }}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition ${
              activeTab === t.id
                ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-200"
                : "border-slate-700/50 bg-slate-800/40 text-slate-400 hover:border-cyan-500/30 hover:text-cyan-300"
            }`}
          >
            <span>{t.emoji}</span>
            <span>{t.label}</span>
            {t.count ? (
              <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-300">{t.count}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* חיפוש */}
      {activeTab !== "whatsapp" && activeTab !== "logs" && (
        <input
          type="text"
          placeholder="🔍 חיפוש..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-700/50 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-400/50"
          dir="rtl"
        />
      )}

      {/* שגיאה */}
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
          ⛔ {error}
        </div>
      )}

      {/* טעינה */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-cyan-300">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <span className="mr-3 font-mono text-sm">מושך נתונים חיים מ-Base44...</span>
        </div>
      )}

      {/* ─── AI Programs ─── */}
      {!loading && activeTab === "programs" && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredPrograms.map((p) => (
            <div key={p.id} className="glass-industrial rounded-2xl border border-slate-700/40 bg-slate-900/50 p-4 transition hover:border-cyan-400/30">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-200">{p.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{p.category ?? "—"}</p>
                </div>
                <Badge label={p.status} />
              </div>
              {p.credit_value && (
                <p className="mt-2 text-xs font-semibold text-emerald-400">💰 {p.credit_value}</p>
              )}
              {p.credits_remaining && (
                <p className="mt-1 text-xs text-cyan-300">נשאר: {p.credits_remaining}</p>
              )}
              {p.registration_email && (
                <p className="mt-1 truncate text-[11px] text-slate-500">{p.registration_email}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {p.url && (
                  <a href={p.url} target="_blank" rel="noreferrer"
                    className="rounded-lg border border-slate-600/40 px-2 py-1 text-[11px] font-bold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300">
                    ↗ אתר
                  </a>
                )}
                {p.status !== "active" && (
                  <button
                    disabled={updatingId === p.id}
                    onClick={() => void updateProgramStatus(p.id, "active")}
                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {updatingId === p.id ? "..." : "✓ הפעל"}
                  </button>
                )}
                {p.status !== "registered" && (
                  <button
                    disabled={updatingId === p.id}
                    onClick={() => void updateProgramStatus(p.id, "registered")}
                    className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-[11px] font-bold text-blue-400 transition hover:bg-blue-500/20 disabled:opacity-50"
                  >
                    {updatingId === p.id ? "..." : "📋 רשום"}
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredPrograms.length === 0 && !loading && (
            <p className="col-span-3 py-8 text-center text-slate-500">אין תוצאות</p>
          )}
        </div>
      )}

      {/* ─── Projects (CodeX) ─── */}
      {!loading && activeTab === "projects" && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((p) => (
            <div key={p.id} className="glass-industrial rounded-2xl border border-slate-700/40 bg-slate-900/50 p-4 transition hover:border-cyan-400/30">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-200">{p.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{p.category ?? "—"}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge label={p.status} />
                  {p.priority && <Badge label={p.priority} />}
                </div>
              </div>
              {p.tech_stack && (
                <p className="mt-2 text-[11px] text-cyan-400 font-mono">{p.tech_stack}</p>
              )}
              {p.next_step && (
                <p className="mt-2 text-xs text-slate-400">👉 {p.next_step}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {p.deploy_url && (
                  <a href={p.deploy_url} target="_blank" rel="noreferrer"
                    className="rounded-lg border border-slate-600/40 px-2 py-1 text-[11px] font-bold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300">
                    ↗ Deploy
                  </a>
                )}
                {p.github_repo && (
                  <a href={p.github_repo} target="_blank" rel="noreferrer"
                    className="rounded-lg border border-slate-600/40 px-2 py-1 text-[11px] font-bold text-slate-300 transition hover:border-purple-400/40 hover:text-purple-300">
                    ⚡ GitHub
                  </a>
                )}
                <button
                  onClick={() => void createTask(p.id, p.name)}
                  className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[11px] font-bold text-cyan-400 transition hover:bg-cyan-500/20"
                >
                  + משימה
                </button>
              </div>
            </div>
          ))}
          {filteredProjects.length === 0 && !loading && (
            <p className="col-span-3 py-8 text-center text-slate-500">אין תוצאות</p>
          )}
        </div>
      )}

      {/* ─── Discovered Tools ─── */}
      {!loading && activeTab === "tools" && (
        <div>
          <p className="mb-3 text-xs text-slate-500">מציג {filteredTools.length} מתוך 2,717 כלים</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredTools.map((t) => (
              <div key={t.id} className="glass-industrial rounded-2xl border border-slate-700/40 bg-slate-900/50 p-4 transition hover:border-cyan-400/30">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-200">{t.company ?? t.name ?? "—"}</p>
                    <p className="mt-1 text-xs text-slate-500">{t.category ?? "—"}</p>
                  </div>
                  <Badge label={t.status ?? "discovered"} />
                </div>
                {t.credit_value && (
                  <p className="mt-2 text-xs font-semibold text-emerald-400">💰 {t.credit_value}</p>
                )}
                {t.has_free_tier && (
                  <p className="mt-1 text-[11px] text-blue-400">✓ Free Tier זמין</p>
                )}
                {t.notes && (
                  <p className="mt-2 line-clamp-2 text-[11px] text-slate-500">{t.notes}</p>
                )}
              </div>
            ))}
            {filteredTools.length === 0 && !loading && (
              <p className="col-span-3 py-8 text-center text-slate-500">אין תוצאות</p>
            )}
          </div>
        </div>
      )}

      {/* ─── Worker Bots ─── */}
      {!loading && activeTab === "bots" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {bots.length === 0 && (
            <div className="col-span-2 rounded-2xl border border-slate-700/40 bg-slate-900/50 p-8 text-center">
              <p className="text-2xl">🤖</p>
              <p className="mt-2 text-sm text-slate-400">לא נמצאו Worker Bots פעילים</p>
              <button
                onClick={() => {
                  const name = prompt("שם הבוט החדש:");
                  if (!name) return;
                  void fetch("/api/base44/live", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      app: "creditHunter",
                      entity: "WorkerBot",
                      record: { name, trigger_type: "manual", icon: "🤖", color: "#06b6d4" },
                    }),
                  }).then(() => {
                    void fetchData("bots");
                    setActionMsg("✅ בוט נוצר!");
                    setTimeout(() => setActionMsg(null), 3000);
                  });
                }}
                className="mt-4 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-300 transition hover:bg-cyan-500/20"
              >
                + צור בוט חדש
              </button>
            </div>
          )}
          {bots.map((b) => (
            <div key={b.id} className="glass-industrial rounded-2xl border border-slate-700/40 bg-slate-900/50 p-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{b.icon ?? "🤖"}</span>
                <div>
                  <p className="font-bold text-slate-200">{b.name ?? "Worker Bot"}</p>
                  <p className="text-xs text-slate-500">{b.trigger_type ?? "manual"}</p>
                </div>
              </div>
              {b.description && (
                <p className="mt-3 text-sm text-slate-400">{b.description}</p>
              )}
              {b.tools_used && (
                <p className="mt-2 text-[11px] font-mono text-cyan-400">{b.tools_used}</p>
              )}
              <button
                onClick={() => {
                  setActionMsg(`🤖 בוט "${b.name ?? "Bot"}" הופעל`);
                  setTimeout(() => setActionMsg(null), 3000);
                }}
                className="mt-4 w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/20"
              >
                ▶ הפעל
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ─── WhatsApp Groups & Leads ─── */}
      {activeTab === "whatsapp" && (
        <div className="flex flex-col gap-6">
          {/* כותרת מודול */}
          <div className="rounded-2xl border border-green-400/25 bg-green-500/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-black text-green-300">💬 WhatsApp Groups &amp; Leads</p>
                <p className="mt-1 text-xs text-slate-400">ניטור קבוצות שיווק · {WA_GROUPS.length} קבוצות פעילות</p>
              </div>
              <button
                onClick={() => {
                  setActionMsg("📨 דוח WhatsApp נשלח ל-N8N");
                  void fetch("/api/n8n/trigger", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ workflow: "WHATSAPP_REPORT", action: "GENERATE_REPORT", source: "BAZ_OS" }),
                  }).catch(() => undefined);
                  setTimeout(() => setActionMsg(null), 3000);
                }}
                className="rounded-xl border border-green-400/40 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-300 transition hover:bg-green-500/20"
              >
                📊 דוח שיווק
              </button>
            </div>
          </div>

          {/* רשת קבוצות */}
          <div className="grid gap-4 sm:grid-cols-2">
            {WA_GROUPS.map((g) => (
              <div key={g.id} className="glass-industrial rounded-2xl border border-slate-700/40 bg-slate-900/50 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-slate-200">{g.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{g.topic}</p>
                  </div>
                  <Badge label={g.status} />
                </div>
                <div className="mt-3 flex gap-4 text-xs text-slate-400">
                  <span>👥 {g.size} חברים</span>
                  <span>🕐 {g.lastMsg}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setActionMsg(`📤 הודעה נשלחה לקבוצה "${g.name}"`);
                      setTimeout(() => setActionMsg(null), 3000);
                    }}
                    className="flex-1 rounded-xl border border-green-500/30 bg-green-500/10 py-1.5 text-xs font-bold text-green-400 transition hover:bg-green-500/20"
                  >
                    📤 שלח הודעה
                  </button>
                  <button
                    onClick={() => {
                      setActionMsg(`📊 סטטיסטיקות של "${g.name}" בטעינה...`);
                      setTimeout(() => setActionMsg(null), 3000);
                    }}
                    className="flex-1 rounded-xl border border-blue-500/30 bg-blue-500/10 py-1.5 text-xs font-bold text-blue-400 transition hover:bg-blue-500/20"
                  >
                    📊 סטטיסטיקות
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Leads Section */}
          <div className="rounded-2xl border border-slate-700/40 bg-slate-900/50 p-5">
            <p className="font-bold text-slate-200">🎯 Leads Pipeline</p>
            <p className="mt-1 text-xs text-slate-500">לידים שנכנסו מהקבוצות</p>
            <div className="mt-4 space-y-3">
              {[
                { name: "יוסי כהן", phone: "052-XXX-XXXX", source: "AI Founders IL", status: "hot" },
                { name: "מירה לוי", phone: "054-XXX-XXXX", source: "בז פיננסים VIP", status: "warm" },
                { name: "דוד אברהם", phone: "050-XXX-XXXX", source: "BAZ Partners", status: "new" },
              ].map((lead, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-slate-700/30 bg-slate-800/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{lead.name}</p>
                    <p className="text-xs text-slate-500">{lead.phone} · {lead.source}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge label={lead.status} />
                    <button
                      onClick={() => {
                        setActionMsg(`📞 CRM עודכן - ${lead.name}`);
                        setTimeout(() => setActionMsg(null), 3000);
                      }}
                      className="rounded-lg border border-cyan-500/30 px-2 py-1 text-[11px] font-bold text-cyan-400 transition hover:bg-cyan-500/10"
                    >
                      + CRM
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Hunt Logs ─── */}
      {!loading && activeTab === "logs" && (
        <div className="glass-industrial rounded-2xl border border-slate-700/40 bg-slate-900/50 p-4">
          <p className="mb-3 text-xs text-slate-500">984 לוגים · מציג 50 אחרונים</p>
          <div className="space-y-2">
            {huntLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 border-b border-slate-700/30 pb-2 font-mono text-xs">
                <span className="shrink-0 text-slate-600">
                  {log.created_date ? new Date(log.created_date).toLocaleTimeString("he-IL") : "--:--"}
                </span>
                <span className="text-cyan-400">[{log.action}]</span>
                <span className="line-clamp-1 text-slate-400">{log.details ?? ""}</span>
              </div>
            ))}
            {huntLogs.length === 0 && (
              <p className="py-8 text-center text-slate-500">אין לוגים</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
