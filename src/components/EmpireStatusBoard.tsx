"use client";

import { useState } from "react";
import hunterToolsData from "@/src/data/hunter_tools.json";
import { empireCompanies } from "@/src/lib/empire-config";

type HunterTool = {
  id: string;
  name: string;
  category: string;
  status: string;
};

type HunterToolsFile = {
  tools?: HunterTool[];
};

const hunterTools = (hunterToolsData as HunterToolsFile).tools ?? [];
const nativeTools: HunterTool[] = [
  { id: "native-lead-scraper", name: "Native Lead Scraper", category: "Scraper", status: "READY" },
  { id: "native-email-enricher", name: "Email Enrichment Agent", category: "Agent", status: "READY" },
  { id: "native-whatsapp-launcher", name: "WhatsApp Launcher", category: "Agent", status: "ACTIVE" },
  { id: "native-company-profiler", name: "Company Profiler", category: "Active Script", status: "READY" },
  { id: "native-crm-injector", name: "CRM Injection Script", category: "Active Script", status: "READY" },
];
const activeTools = hunterTools.length ? hunterTools : nativeTools;
const apiStatusCycle = ["ONLINE", "READY", "SYNCED", "ACTIVE"] as const;

function toolsForIndex(index: number) {
  return [activeTools[index % activeTools.length]];
}

export function EmpireStatusBoard() {
  const [identityByCompany, setIdentityByCompany] = useState<Record<string, "BAZ SPACE" | "DOLPHIN">>(
    Object.fromEntries(
      empireCompanies.map((company, index) => [company.id, index % 2 === 0 ? "BAZ SPACE" : "DOLPHIN"]),
    ),
  );

  function toggleIdentity(companyId: string) {
    setIdentityByCompany((current) => ({
      ...current,
      [companyId]: current[companyId] === "BAZ SPACE" ? "DOLPHIN" : "BAZ SPACE",
    }));
  }

  return (
    <section className="glass-industrial rounded-[2rem] border border-emerald-400/25 p-6 shadow-[0_0_44px_rgba(16,185,129,0.12)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
            Empire Status Board
          </p>
          <h2 className="mt-2 text-3xl font-black text-[#f8f9fa]">
            47 Internal Companies
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-cyan-100">
            מקור הנתונים הוא רשימת החברות הפנימית של BAZ OS. כלי Hunter נטענים מ־Base44 ומקושרים כאן כפעולות זמינות.
          </p>
        </div>
        <span className="rounded-full border border-emerald-300/35 bg-emerald-300/10 px-4 py-2 font-mono text-sm font-black text-emerald-100">
          ONLINE / GREEN
        </span>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-cyan-300/20 bg-black/50">
        <div className="grid grid-cols-[1.3fr_1fr_1fr_1.7fr] gap-3 border-b border-cyan-300/15 bg-cyan-300/10 px-4 py-3 font-mono text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
          <span>Name</span>
          <span>Identity</span>
          <span>Status</span>
          <span>Active Scrapers</span>
        </div>
        <div className="max-h-[64vh] overflow-y-auto">
          {empireCompanies.map((company, index) => (
            <article
              key={company.id}
              className="grid grid-cols-[1.3fr_1fr_1fr_1.7fr] gap-3 border-b border-cyan-300/10 px-4 py-3 text-sm text-slate-100 last:border-b-0"
            >
              <div>
                <p className="font-black text-white">{company.name}</p>
                <p className="mt-1 text-xs font-bold text-slate-400">{company.category}</p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => toggleIdentity(company.id)}
                  className="inline-flex rounded-full border border-fuchsia-300/30 bg-fuchsia-300/10 px-3 py-1 font-mono text-xs font-black text-fuchsia-100 transition hover:bg-fuchsia-300 hover:text-slate-950"
                >
                  {identityByCompany[company.id]}
                </button>
              </div>
              <div>
                <span className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 font-mono text-xs font-black text-emerald-100">
                  {apiStatusCycle[index % apiStatusCycle.length]}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {toolsForIndex(index).map((tool) => (
                  <a
                    key={`${company.id}-${tool.id}`}
                    href="#hunter-hub"
                    className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100 transition hover:bg-cyan-300 hover:text-slate-950"
                  >
                    {tool.name} {"->"} {company.name}
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
