"use client";

import { useState } from "react";

type IntegrationNode = {
  id: string;
  name: string;
  label: string;
  fuelSource: "Primary" | "Secondary";
  readiness: number;
};

const integrationNodes: IntegrationNode[] = [
  { id: "meta-ads", name: "Meta Ads", label: "Facebook / Instagram", fuelSource: "Secondary", readiness: 88 },
  { id: "google-marketing", name: "Google Marketing Platform", label: "Ads / Analytics", fuelSource: "Secondary", readiness: 76 },
  { id: "tiktok-ads", name: "TikTok Ads Manager", label: "Short Video Demand", fuelSource: "Secondary", readiness: 69 },
  { id: "whatsapp-business", name: "WhatsApp Business API", label: "Messaging Automation", fuelSource: "Secondary", readiness: 91 },
  { id: "hunter-leads", name: "Hunter.io Lead Engine", label: "Lead Extraction", fuelSource: "Secondary", readiness: 84 },
  { id: "nvidia-ai", name: "NVIDIA AI Processing", label: "AI Compute", fuelSource: "Primary", readiness: 95 },
];

export function IntegrationGalaxy() {
  const [handshakeNode, setHandshakeNode] = useState<string | null>(null);

  function triggerHandshake(nodeId: string) {
    setHandshakeNode(nodeId);
    window.setTimeout(() => setHandshakeNode(null), 1100);
    alert("ממתין לחיבור בשבת (Saturday Sync)");
  }

  return (
    <section className="tab-fade-slide grid gap-6">
      <header className="glass-industrial rounded-[2rem] p-6">
        <p className="font-mono text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
          Integration Galaxy
        </p>
        <h2 className="mt-2 text-4xl font-black text-[#f8f9fa] [text-shadow:0_0_18px_rgba(0,242,255,0.35)]">
          היכל אינטגרציות
        </h2>
        <p className="mt-3 max-w-3xl leading-8 text-slate-300">
          עולם החיבורים החיצוניים של BAZ OS: שיווק, הודעות, לידים ועיבוד AI סביב ליבת האימפריה.
        </p>
      </header>

      <section className="integration-galaxy glass-industrial relative min-h-[44rem] overflow-hidden rounded-[2rem] p-6">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1100 760" aria-hidden="true">
          <circle cx="550" cy="380" r="86" fill="rgba(0, 242, 255, 0.08)" stroke="rgba(0, 242, 255, 0.34)" />
          <path className="galaxy-cable" d="M550 380 C430 135 260 130 170 145" />
          <path className="galaxy-cable" d="M550 380 C545 130 545 110 550 96" />
          <path className="galaxy-cable" d="M550 380 C690 135 850 130 930 145" />
          <path className="galaxy-cable" d="M550 380 C405 620 260 625 170 610" />
          <path className="galaxy-cable" d="M550 380 C548 635 548 660 550 678" />
          <path className="galaxy-cable" d="M550 380 C705 620 850 625 930 610" />
        </svg>

        <div className="absolute left-1/2 top-1/2 z-10 grid h-48 w-48 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-cyan-300/40 bg-[#001027]/90 shadow-[0_0_60px_rgba(0,242,255,0.28)]">
          <div className="plasma-core scale-75" />
          <p className="absolute bottom-8 font-mono text-xs font-black tracking-[0.24em] text-cyan-100">
            BAZ CORE
          </p>
        </div>

        <div className="relative z-20 grid min-h-[40rem] gap-5 md:grid-cols-3">
          {integrationNodes.map((node, index) => (
            <IntegrationPedestal
              key={node.id}
              node={node}
              positionClass={pedestalPosition(index)}
              isHandshakeActive={handshakeNode === node.id}
              onConnect={() => triggerHandshake(node.id)}
            />
          ))}
        </div>
      </section>
    </section>
  );
}

function pedestalPosition(index: number) {
  const positions = [
    "self-start justify-self-start",
    "self-start justify-self-center",
    "self-start justify-self-end",
    "self-end justify-self-start",
    "self-end justify-self-center",
    "self-end justify-self-end",
  ];

  return positions[index] ?? "";
}

function IntegrationPedestal({
  node,
  positionClass,
  isHandshakeActive,
  onConnect,
}: {
  node: IntegrationNode;
  positionClass: string;
  isHandshakeActive: boolean;
  onConnect: () => void;
}) {
  return (
    <article className={["integration-pedestal group relative w-full max-w-xs rounded-[2rem] p-5", positionClass].join(" ")}>
      {isHandshakeActive ? (
        <div className="handshake-burst" aria-hidden="true">
          <span />
          <span />
        </div>
      ) : null}

      <div className="relative z-10">
        <p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-cyan-200">
          {node.label}
        </p>
        <h3 className="mt-2 text-2xl font-black text-[#f8f9fa]">{node.name}</h3>
        <div className="mt-4 h-3 overflow-hidden rounded-full border border-cyan-400/25 bg-[#000b1f]">
          <div
            className="h-full rounded-full bg-gradient-to-l from-cyan-200 via-[#00f2ff] to-blue-700"
            style={{ width: `${node.readiness}%` }}
          />
        </div>
        <p className="mt-2 font-mono text-xs text-slate-300">מוכנות: {node.readiness}%</p>
        <div className="mt-4 hidden rounded-2xl border border-cyan-400/20 bg-black/80 p-3 font-mono text-xs leading-6 text-cyan-100 group-hover:block">
          סטטוס: מוכן לסנכרון שבת | מקור דלק: {node.fuelSource}
        </div>
        <button
          type="button"
          onClick={onConnect}
          className="mechanical-click mt-5 w-full whitespace-nowrap rounded-2xl border border-cyan-300/40 bg-cyan-300/10 px-5 py-3 font-mono font-black text-[#f8f9fa] transition hover:bg-cyan-300 hover:text-slate-950"
        >
          חיבור חשבון
        </button>
      </div>
    </article>
  );
}
