"use client";

import { useCallback, useEffect, useState } from "react";

type CommsEntry = {
  id: string;
  source: "marketing" | "office" | "unknown";
  from: string;
  body: string;
  timestamp: string;
  status: "received" | "read" | "replied";
};

type CommsStats = { marketing: number; office: number; unknown: number };

const SOURCE_LABELS: Record<CommsEntry["source"], string> = {
  marketing: "שיווק",
  office: "משרד",
  unknown: "לא ידוע",
};

const SOURCE_COLORS: Record<CommsEntry["source"], string> = {
  marketing: "text-green-400 border-green-500/40 bg-green-500/10",
  office: "text-blue-400 border-blue-500/40 bg-blue-500/10",
  unknown: "text-slate-400 border-slate-500/40 bg-slate-500/10",
};

const STATUS_COLORS: Record<CommsEntry["status"], string> = {
  received: "text-yellow-400",
  read: "text-blue-400",
  replied: "text-emerald-400",
};

export function CommsHub() {
  const [messages, setMessages] = useState<CommsEntry[]>([]);
  const [stats, setStats] = useState<CommsStats>({ marketing: 0, office: 0, unknown: 0 });
  const [filter, setFilter] = useState<"all" | CommsEntry["source"]>("all");
  const [loading, setLoading] = useState(false);
  const [configStatus, setConfigStatus] = useState<Record<string, boolean>>({});

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === "all" ? "/api/comms" : `/api/comms?source=${filter}`;
      const res = await fetch(url);
      const data = await res.json() as {
        ok: boolean;
        messages: CommsEntry[];
        sources: CommsStats;
      };
      if (data.ok) {
        setMessages(data.messages);
        setStats(data.sources);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Check webhook config status
  const checkConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp");
      const data = await res.json() as {
        verify_token_set: boolean;
        access_token_set: boolean;
        source_routing: { marketing: boolean; office: boolean };
      };
      setConfigStatus({
        verifyToken: data.verify_token_set,
        accessToken: data.access_token_set,
        marketingPhone: data.source_routing?.marketing,
        officePhone: data.source_routing?.office,
      });
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    void fetchMessages();
    void checkConfig();
    const interval = setInterval(() => void fetchMessages(), 15000);
    return () => clearInterval(interval);
  }, [fetchMessages, checkConfig]);

  async function markStatus(id: string, status: string) {
    await fetch("/api/comms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: status as CommsEntry["status"] } : m)));
  }

  const allConfigured = Object.values(configStatus).every(Boolean);

  return (
    <section dir="rtl" className="flex flex-col gap-6">
      {/* כותרת */}
      <div className="glass-industrial rounded-[2rem] border border-cyan-400/25 p-6 shadow-[0_0_42px_rgba(0,242,255,0.12)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">COMMUNICATIONS / WHATSAPP</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-4xl font-black text-[#f8f9fa]">Comms Hub</h2>
            <p className="mt-2 text-sm text-cyan-100">
              ניטור הודעות WhatsApp · שיווק ומשרד · עדכון כל 15 שניות
            </p>
          </div>
          <button
            onClick={() => void fetchMessages()}
            disabled={loading}
            className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
          >
            {loading ? "⟳ טוען..." : "⟳ רענן"}
          </button>
        </div>
      </div>

      {/* סטטוס תצורה */}
      <div className="rounded-2xl border border-slate-700/40 bg-slate-900/50 p-5">
        <p className="mb-3 text-sm font-bold text-slate-300">⚙️ סטטוס חיבור Meta WhatsApp</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { key: "verifyToken", label: "Verify Token" },
            { key: "accessToken", label: "Access Token" },
            { key: "marketingPhone", label: "Phone שיווק" },
            { key: "officePhone", label: "Phone משרד" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2 rounded-xl border border-slate-700/30 bg-slate-800/30 px-3 py-2">
              <span className={configStatus[key] ? "text-emerald-400" : "text-red-400"}>
                {configStatus[key] ? "✓" : "✗"}
              </span>
              <span className="text-xs text-slate-400">{label}</span>
            </div>
          ))}
        </div>
        {!allConfigured && (
          <div className="mt-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-400">
            ⚠️ נדרשים env vars: META_WHATSAPP_VERIFY_TOKEN, META_WHATSAPP_ACCESS_TOKEN, META_WA_PHONE_MARKETING, META_WA_PHONE_OFFICE
          </div>
        )}
        <p className="mt-3 font-mono text-xs text-slate-500">
          Webhook URL: <span className="text-cyan-400">{typeof window !== "undefined" ? window.location.origin : ""}/api/whatsapp</span>
        </p>
      </div>

      {/* סטטיסטיקות */}
      <div className="grid grid-cols-3 gap-4">
        {(["marketing", "office", "unknown"] as const).map((src) => (
          <div key={src} className={`rounded-2xl border p-4 ${SOURCE_COLORS[src]}`}>
            <p className="text-2xl font-black">{stats[src]}</p>
            <p className="text-xs font-bold uppercase tracking-wider">{SOURCE_LABELS[src]}</p>
          </div>
        ))}
      </div>

      {/* פילטר */}
      <div className="flex gap-2">
        {(["all", "marketing", "office", "unknown"] as const).map((src) => (
          <button
            key={src}
            onClick={() => setFilter(src)}
            className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
              filter === src
                ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-200"
                : "border-slate-700/50 bg-slate-800/40 text-slate-400 hover:text-cyan-300"
            }`}
          >
            {src === "all" ? "הכל" : SOURCE_LABELS[src]}
          </button>
        ))}
      </div>

      {/* הודעות */}
      <div className="space-y-3">
        {messages.length === 0 && !loading && (
          <div className="rounded-2xl border border-slate-700/40 bg-slate-900/50 p-10 text-center">
            <p className="text-3xl">💬</p>
            <p className="mt-3 text-slate-400">
              {allConfigured ? "אין הודעות עדיין" : "ממתין לחיבור Meta WhatsApp"}
            </p>
            {!allConfigured && (
              <p className="mt-2 text-xs text-slate-500">הגדר את ה-env vars וחבר את ה-webhook ב-Meta Business Manager</p>
            )}
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="glass-industrial rounded-2xl border border-slate-700/40 bg-slate-900/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${SOURCE_COLORS[msg.source]}`}>
                  {SOURCE_LABELS[msg.source]}
                </span>
                <span className="font-mono text-sm font-bold text-slate-200">{msg.from}</span>
              </div>
              <span className={`text-xs font-bold ${STATUS_COLORS[msg.status]}`}>
                {msg.status === "received" ? "נכנס" : msg.status === "read" ? "נקרא" : "נענה"}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-300">{msg.body}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {new Date(msg.timestamp).toLocaleString("he-IL")}
              </span>
              <div className="flex gap-2">
                {msg.status === "received" && (
                  <button
                    onClick={() => void markStatus(msg.id, "read")}
                    className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-[11px] font-bold text-blue-400 transition hover:bg-blue-500/20"
                  >
                    ✓ סמן נקרא
                  </button>
                )}
                {msg.status !== "replied" && (
                  <button
                    onClick={() => void markStatus(msg.id, "replied")}
                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-400 transition hover:bg-emerald-500/20"
                  >
                    ✓ נענה
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
