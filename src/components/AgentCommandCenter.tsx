"use client";

import { useState } from "react";

type AgentLog = {
  id: string;
  agentId: string;
  target: string;
  message: string;
  createdAt: string;
  status: "INCOMING" | "TRIGGERED" | "SYNCED";
};

type WhatsAppAgent = {
  id: string;
  name: string;
  workflow: string;
  status: "ACTIVE" | "READY";
  conversations: number;
};

const whatsappAgents: WhatsAppAgent[] = [
  {
    id: "whatsapp-sales-router",
    name: "WhatsApp Sales Router",
    workflow: "BAZ WhatsApp Lead Router",
    status: "ACTIVE",
    conversations: 18,
  },
  {
    id: "whatsapp-follow-up",
    name: "Follow-Up Agent",
    workflow: "BAZ Client Follow Up",
    status: "ACTIVE",
    conversations: 11,
  },
  {
    id: "whatsapp-support-intake",
    name: "Support Intake Agent",
    workflow: "BAZ Support Intake",
    status: "READY",
    conversations: 7,
  },
];

const initialLogs: AgentLog[] = [
  {
    id: "log-001",
    agentId: "whatsapp-sales-router",
    target: "Beni Website",
    message: "Lead routed into WhatsApp sales flow.",
    createdAt: new Date().toLocaleTimeString("he-IL"),
    status: "SYNCED",
  },
  {
    id: "log-002",
    agentId: "whatsapp-follow-up",
    target: "Somer",
    message: "Follow-up reminder queued for client status.",
    createdAt: new Date().toLocaleTimeString("he-IL"),
    status: "INCOMING",
  },
];

export function AgentCommandCenter({ isReadOnlyMode }: { isReadOnlyMode: boolean }) {
  const [logs, setLogs] = useState<AgentLog[]>(initialLogs);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);

  async function triggerAgent(agent: WhatsAppAgent) {
    if (isReadOnlyMode) {
      alert("מצב הגנה פעיל - הפעלת Agent חסומה.");
      return;
    }

    setActiveAgentId(agent.id);

    try {
      const response = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TRIGGER_AGENT",
          agentId: agent.id,
          agentName: agent.name,
          workflow: agent.workflow,
        }),
      });
      const data = (await response.json()) as { status?: string };

      if (!response.ok) {
        throw new Error(data.status ?? "WhatsApp agent trigger failed");
      }

      setLogs((current) => [
        {
          id: `log-${Date.now()}`,
          agentId: agent.id,
          target: "N8N WhatsApp Workstation",
          message: `${agent.name} triggered via ${agent.workflow}.`,
          createdAt: new Date().toLocaleTimeString("he-IL"),
          status: "TRIGGERED",
        },
        ...current,
      ]);
    } catch {
      setLogs((current) => [
        {
          id: `log-${Date.now()}`,
          agentId: agent.id,
          target: "N8N WhatsApp Workstation",
          message: `${agent.name} trigger failed. Check N8N workflow logs.`,
          createdAt: new Date().toLocaleTimeString("he-IL"),
          status: "INCOMING",
        },
        ...current,
      ]);
    } finally {
      setActiveAgentId(null);
    }
  }

  return (
    <section className="grid gap-6">
      <div className="glass-industrial rounded-[2rem] border border-emerald-400/25 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
          Agent Command Center
        </p>
        <h2 className="mt-2 text-3xl font-black text-[#f8f9fa]">WhatsApp Agent Migration</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-cyan-100">
          מרכז הפעלה Native ל־WhatsApp agents שנבנו ב־Base44: סטטוס, שיחות, טריגרים ולוגים במקום אחד.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {whatsappAgents.map((agent) => (
          <article key={agent.id} className="rounded-[2rem] border border-emerald-300/20 bg-black/55 p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 font-mono text-xs font-black text-emerald-100">
                {agent.status}
              </span>
              <span className="h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
            </div>
            <h3 className="mt-4 text-2xl font-black text-white">{agent.name}</h3>
            <p className="mt-2 font-mono text-xs font-bold text-cyan-100">{agent.workflow}</p>
            <p className="mt-4 text-sm font-bold text-slate-300">
              Active conversations: {agent.conversations}
            </p>
            <button
              type="button"
              onClick={() => void triggerAgent(agent)}
              disabled={activeAgentId === agent.id}
              className="mt-5 w-full rounded-2xl bg-emerald-300 px-5 py-3 font-black text-slate-950 transition hover:bg-white disabled:opacity-60"
            >
              {activeAgentId === agent.id ? "TRIGGERING..." : "TRIGGER AGENT"}
            </button>
          </article>
        ))}
      </div>

      <div className="rounded-[2rem] border border-cyan-300/20 bg-black/60 p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
          Conversation Logs
        </p>
        <div className="mt-4 max-h-[28rem] overflow-y-auto">
          {logs.map((log) => (
            <article key={log.id} className="mb-3 rounded-2xl border border-cyan-300/15 bg-[#001027]/70 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <p className="font-black text-white">{log.target}</p>
                <span className="font-mono text-xs font-black text-cyan-100">
                  {log.createdAt} | {log.status}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-cyan-100">{log.message}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
