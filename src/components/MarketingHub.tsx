"use client";

type MarketingCore = {
  id: string;
  name: string;
  channel: string;
  adSpend: number;
  reach: number;
  activity: number;
  icon: "meta" | "google" | "tiktok" | "linkedin" | "seo" | "writer";
  isLocked?: boolean;
  seoAuthority?: number;
};

const marketingCores: MarketingCore[] = [
  {
    id: "meta-ads",
    name: "[PAID] Meta Ads",
    channel: "Facebook / Instagram",
    adSpend: 4200,
    reach: 126000,
    activity: 82,
    icon: "meta",
  },
  {
    id: "google-ads",
    name: "[PAID] Google Ads",
    channel: "Search / Display",
    adSpend: 3600,
    reach: 98000,
    activity: 74,
    icon: "google",
  },
  {
    id: "tiktok-marketing",
    name: "[PAID] TikTok Ads",
    channel: "Short Video Funnel",
    adSpend: 1800,
    reach: 156000,
    activity: 69,
    icon: "tiktok",
  },
  {
    id: "linkedin-outreach",
    name: "[B2B] LinkedIn Outreach & Ads",
    channel: "Professional B2B Leads",
    adSpend: 2400,
    reach: 42000,
    activity: 78,
    icon: "linkedin",
  },
  {
    id: "organic-forge",
    name: "[ORGANIC] SEO & Backlink Forge",
    channel: "SEO / Backlinks / Content",
    adSpend: 700,
    reach: 64000,
    activity: 72,
    icon: "seo",
    seoAuthority: 67,
  },
  {
    id: "content-writer",
    name: "[CONTENT] AI Content Generator",
    channel: "The Writer",
    adSpend: 520,
    reach: 36000,
    activity: 73,
    icon: "writer",
  },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("he-IL").format(value);
}

export function MarketingHub() {
  return (
    <section className="tab-fade-slide grid gap-6">
      <div className="glass-industrial rounded-[2rem] p-6">
        <p className="font-mono text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
          מפקדת שיווק
        </p>
        <h2 className="mt-2 text-4xl font-black text-[#f8f9fa] [text-shadow:0_0_18px_rgba(0,242,255,0.35)]">
          מפקדת שיווק
        </h2>
        <p className="mt-3 max-w-3xl leading-8 text-slate-300">
          Dashboard of Dashboards לחיבור Meta Ads, Google Ads, TikTok ו־WhatsApp Automation אל מוח BAZ OS.
        </p>
      </div>

      <section className="marketing-grid-map glass-industrial relative overflow-hidden rounded-[2rem] p-6">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 620" aria-hidden="true">
          <circle cx="500" cy="310" r="78" fill="rgba(0, 242, 255, 0.08)" stroke="rgba(0, 242, 255, 0.34)" />
          <path className="marketing-cable" d="M500 310 C370 120 245 130 150 120" />
          <path className="marketing-cable" d="M500 310 C610 115 730 125 850 120" />
          <path className="marketing-cable" d="M500 310 C300 310 250 310 150 310" />
          <path className="marketing-cable" d="M500 310 C700 310 750 310 850 310" />
          <path className="marketing-cable" d="M500 310 C330 500 250 500 150 500" />
          <path className="marketing-cable" d="M500 310 C650 500 750 500 850 500" />
          <path className="marketing-root" d="M500 310 C575 520 650 600 720 660" />
        </svg>

        <div className="relative z-10 grid min-h-[46rem] gap-5 lg:grid-cols-[1fr_220px_1fr] lg:grid-rows-3">
          <MarketingCoreCard core={marketingCores[0]} />
          <CentralBrain />
          <MarketingCoreCard core={marketingCores[1]} />
          <MarketingCoreCard core={marketingCores[2]} />
          <MarketingCoreCard core={marketingCores[3]} />
          <MarketingCoreCard core={marketingCores[4]} />
          <MarketingCoreCard core={marketingCores[5]} />
        </div>
      </section>
    </section>
  );
}

function CentralBrain() {
  return (
    <div className="row-span-2 grid place-items-center">
      <div className="rounded-[2rem] border border-cyan-300/30 bg-[#001027]/85 p-5 text-center shadow-[0_0_45px_rgba(0,150,255,0.24)]">
        <div className="plasma-core mx-auto scale-75" />
        <p className="mt-4 font-mono text-xs font-black uppercase tracking-[0.24em] text-cyan-100">
          BAZ OS Brain
        </p>
        <p className="mt-2 text-sm text-slate-300">
          מרכז בקרה לחיבורי API בשבת
        </p>
      </div>
    </div>
  );
}

function MarketingCoreCard({ core }: { core: MarketingCore }) {
  const reachEfficiency = Math.min(100, Math.round(core.reach / Math.max(core.adSpend, 1)));

  function connectCore() {
    alert("ממתין לחיבור בשבת (Saturday Sync)");
  }

  return (
    <article className={["glass-industrial relative overflow-hidden rounded-[2rem] p-5", core.isLocked ? "shielded-node" : ""].join(" ")}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <MarketingIcon type={core.icon} />
          <p className="font-mono text-xs font-black uppercase tracking-[0.25em] text-cyan-200">
            {core.channel}
          </p>
          <h3 className="mt-2 text-2xl font-black text-[#f8f9fa]">{core.name}</h3>
        </div>
        <span className="live-pulse h-4 w-4 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(0,242,255,0.9)]" />
      </div>

      <div className="grid gap-4">
        <PowerMeter label="Ad Spend" value={`₪${formatNumber(core.adSpend)}`} level={Math.min(100, Math.round(core.adSpend / 55))} />
        <PowerMeter label="Reach" value={formatNumber(core.reach)} level={Math.min(100, reachEfficiency)} />
        <PowerMeter label="Activity" value={`${core.activity}%`} level={core.activity} />
        {typeof core.seoAuthority === "number" ? (
          <PowerMeter label="SEO Authority" value={`${core.seoAuthority}%`} level={core.seoAuthority} />
        ) : null}
      </div>

      {core.isLocked ? (
        <p className="mt-5 rounded-2xl border border-slate-400/20 bg-slate-400/10 px-4 py-3 text-center font-mono text-sm font-black text-slate-200">
          LOCKED / SHIELDED
        </p>
      ) : (
      <button
        type="button"
        onClick={connectCore}
        className="mechanical-click mt-5 w-full whitespace-nowrap rounded-2xl border border-cyan-300/40 bg-cyan-300/10 px-5 py-3 font-mono font-black text-[#f8f9fa] transition hover:bg-cyan-300 hover:text-slate-950"
      >
        חיבור
      </button>
      )}
      <p className="mt-3 text-center font-mono text-xs text-cyan-100">
        ממתין לחיבור בשבת (Saturday Sync)
      </p>
    </article>
  );
}

function MarketingIcon({ type }: { type: MarketingCore["icon"] }) {
  if (type === "linkedin") {
    return <span className="linkedin-glass-icon mb-3" aria-hidden="true">in</span>;
  }

  if (type === "seo") {
    return <span className="seo-light-icon mb-3" aria-hidden="true" />;
  }

  return <span className={`marketing-core-icon marketing-core-icon-${type} mb-3`} aria-hidden="true" />;
}

function PowerMeter({
  label,
  value,
  level,
}: {
  label: string;
  value: string;
  level: number;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 font-mono text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="font-black text-[#f8f9fa]">{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full border border-cyan-400/25 bg-[#000b1f]">
        <div
          className="h-full rounded-full bg-gradient-to-l from-cyan-200 via-[#00f2ff] to-blue-600 shadow-[0_0_18px_rgba(0,242,255,0.5)]"
          style={{ width: `${level}%` }}
        />
      </div>
    </div>
  );
}
