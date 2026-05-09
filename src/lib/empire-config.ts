export type EmpireEngine = {
  id: string;
  name: string;
  role: string;
  endpoint?: string;
  host?: string;
  status: "ONLINE" | "STANDBY" | "READY";
};

export type EmpireCompanyCategory =
  | "Digital & Content"
  | "AI & Tech"
  | "Business Services"
  | "Knowledge"
  | "Advanced Services";

export type EmpireCompany = {
  id: string;
  name: string;
  category: EmpireCompanyCategory;
  status: "READY";
};

export type ArsenalAsset = {
  id: string;
  name: string;
  tier: "Paid/Main" | "100% Free Tier" | "Visual/Voice";
  quota: string;
  routingRole: string;
  status: "READY" | "STANDBY";
};

export type WhaleCredit = {
  id: string;
  provider: string;
  amount: string;
  status: "Target" | "Preparing" | "Pending Application";
  nextAction: string;
};

export type PremiumMicroSaasProject = {
  id: string;
  name: string;
  category: "Premium Micro-SaaS";
  stack: string;
  automationLayer: string;
  status: "Portfolio Ready";
};

export const infrastructureEngines: EmpireEngine[] = [
  {
    id: "baz-brain",
    name: "Baz-Brain",
    role: "N8N automation command brain",
    endpoint: "https://n8n.baz-f.co.il",
    host: "Hetzner 178.105.75.214",
    status: "ONLINE",
  },
  {
    id: "baz-credits",
    name: "Baz-Credits",
    role: "Soak Protocol credit routing and burn protection",
    status: "READY",
  },
  {
    id: "baz-qa",
    name: "Baz-QA",
    role: "Quality gate, regression checks and launch validation",
    status: "READY",
  },
  {
    id: "baz-ops",
    name: "Baz-Ops",
    role: "Operations cockpit, deploy readiness and incident response",
    status: "ONLINE",
  },
];

export const empireCompanies: EmpireCompany[] = [
  ...[
    "Baz Sites",
    "Baz Marketing",
    "Baz Content",
    "Baz SEO",
    "Baz Funnels",
    "Baz Media",
    "Baz Copy",
    "Baz Studio",
    "Baz Landing",
    "Baz Social",
    "Baz Brands",
  ].map((name) => ({ id: name.toLowerCase().replace(/\s+/g, "-"), name, category: "Digital & Content" as const, status: "READY" as const })),
  ...[
    "Baz Automation",
    "Baz Agents",
    "Baz Dev",
    "Baz Data",
    "Baz AI",
    "Baz Cloud",
    "Baz Integrations",
    "Baz Bots",
    "Baz Vision",
    "Baz Voice",
    "Baz Security",
    "Baz Labs",
  ].map((name) => ({ id: name.toLowerCase().replace(/\s+/g, "-"), name, category: "AI & Tech" as const, status: "READY" as const })),
  ...[
    "Baz HR",
    "Baz Legal",
    "Baz CRM",
    "Baz Discovery",
    "Baz Finance",
    "Baz Sales",
    "Baz Support",
    "Baz Admin",
    "Baz Procurement",
  ].map((name) => ({ id: name.toLowerCase().replace(/\s+/g, "-"), name, category: "Business Services" as const, status: "READY" as const })),
  ...["Baz Knowledge", "Baz Research", "Baz Intelligence"].map((name) => ({
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    category: "Knowledge" as const,
    status: "READY" as const,
  })),
  ...[
    "Baz Robotics",
    "Baz Healthcare",
    "Baz Real Estate",
    "Baz E-Commerce",
    "Baz Cyber",
    "Baz Investor Relations",
    "Baz Enterprise",
    "Baz Ventures",
  ].map((name) => ({ id: name.toLowerCase().replace(/\s+/g, "-"), name, category: "Advanced Services" as const, status: "READY" as const })),
  ...["Baz Space", "Baz Dolphin", "Baz Academy", "Baz Marketplace"].map((name) => ({
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    category: "Advanced Services" as const,
    status: "READY" as const,
  })),
];

export const creditApiArsenal: ArsenalAsset[] = [
  {
    id: "gemini-workspace",
    name: "Gemini Workspace",
    tier: "Paid/Main",
    quota: "19 keys",
    routingRole: "Primary reasoning and vision pool",
    status: "READY",
  },
  {
    id: "xai-grok",
    name: "xAI Grok",
    tier: "Paid/Main",
    quota: "3 accounts",
    routingRole: "Realtime web reasoning backup",
    status: "STANDBY",
  },
  {
    id: "claude",
    name: "Claude",
    tier: "Paid/Main",
    quota: "Primary + backup",
    routingRole: "Long-context strategy and writing",
    status: "READY",
  },
  {
    id: "openai",
    name: "OpenAI",
    tier: "Paid/Main",
    quota: "Project key pool",
    routingRole: "General intelligence and tools",
    status: "READY",
  },
  {
    id: "groq",
    name: "Groq",
    tier: "100% Free Tier",
    quota: "14.4k/day",
    routingRole: "Fast free inference routing",
    status: "READY",
  },
  {
    id: "mistral",
    name: "Mistral",
    tier: "100% Free Tier",
    quota: "Free tier",
    routingRole: "European routing and fallback",
    status: "READY",
  },
  {
    id: "cerebras",
    name: "Cerebras",
    tier: "100% Free Tier",
    quota: "Free tier",
    routingRole: "High-speed inference burst",
    status: "READY",
  },
  {
    id: "nvidia-nim",
    name: "NVIDIA NIM",
    tier: "100% Free Tier",
    quota: "Free tier",
    routingRole: "GPU-backed AI processing",
    status: "READY",
  },
  ...["Leonardo AI", "fal.ai", "Kling AI", "Runway", "ElevenLabs"].map((name) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    tier: "Visual/Voice" as const,
    quota: "Creative credit pool",
    routingRole: "Visual, video and voice generation",
    status: "STANDBY" as const,
  })),
];

export const whaleCredits: WhaleCredit[] = [
  {
    id: "google-cloud-200k",
    provider: "Google Cloud",
    amount: "$200k",
    status: "Target",
    nextAction: "Prepare startup credit application and workspace proof.",
  },
  {
    id: "microsoft-hub-150k",
    provider: "Microsoft Hub",
    amount: "$150k",
    status: "Preparing",
    nextAction: "Collect founder, domain and AI workload documentation.",
  },
  {
    id: "aws-activate",
    provider: "AWS Activate",
    amount: "Activate credits",
    status: "Pending Application",
    nextAction: "Submit startup profile and infrastructure plan.",
  },
];

export const premiumMicroSaasProjects: PremiumMicroSaasProject[] = [
  {
    id: "smartblog-smartpost-engine",
    name: "SmartBlog & SmartPost Engine",
    category: "Premium Micro-SaaS",
    stack: "Content + Social Automation",
    automationLayer: "Human Approval Gate",
    status: "Portfolio Ready",
  },
  {
    id: "high-convert-landing-page-factory",
    name: "High-Convert Landing Page Factory",
    category: "Premium Micro-SaaS",
    stack: "UI/UX + CRO",
    automationLayer: "Landing brief to launch pipeline",
    status: "Portfolio Ready",
  },
  {
    id: "social-commander",
    name: "Social Commander",
    category: "Premium Micro-SaaS",
    stack: "Viral Scripts + Video Automation",
    automationLayer: "Script, clip and publish orchestration",
    status: "Portfolio Ready",
  },
  {
    id: "b2b-data-hunter",
    name: "B2B Data Hunter",
    category: "Premium Micro-SaaS",
    stack: "Scraping + Lead Gen",
    automationLayer: "Prospect enrichment and CRM injection",
    status: "Portfolio Ready",
  },
  {
    id: "executive-ghostwriter",
    name: "Executive Ghostwriter",
    category: "Premium Micro-SaaS",
    stack: "Personalized LinkedIn Branding",
    automationLayer: "Founder voice memory and approval workflow",
    status: "Portfolio Ready",
  },
];

export function companiesByCategory() {
  return empireCompanies.reduce<Record<EmpireCompanyCategory, EmpireCompany[]>>(
    (groups, company) => {
      groups[company.category].push(company);
      return groups;
    },
    {
      "Digital & Content": [],
      "AI & Tech": [],
      "Business Services": [],
      Knowledge: [],
      "Advanced Services": [],
    },
  );
}
