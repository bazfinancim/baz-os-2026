import hunterToolsData from "@/src/data/hunter_tools.json";
import { empireCompanies } from "@/src/lib/empire-config";
import { creditVaultBalances, getLeastCostRoutingPlan } from "@/src/lib/vault-manager";

type HunterToolsFile = {
  generatedAt?: string | null;
  status?: string;
  tools?: {
    id: string;
    name: string;
    category: string;
    status: string;
    assetCredits?: number;
  }[];
};

const nativeHunterTools = [
  {
    id: "native-lead-scraper",
    name: "Native Lead Scraper",
    category: "Scraper",
    workflow: "N8N: BAZ Hunter Lead Scan",
    status: "READY",
    assetCredits: 2_400_000_000,
  },
  {
    id: "native-email-enricher",
    name: "Email Enrichment Agent",
    category: "Agent",
    workflow: "N8N: BAZ Email Enrichment",
    status: "READY",
    assetCredits: 1_800_000_000,
  },
  {
    id: "native-whatsapp-launcher",
    name: "WhatsApp Launcher",
    category: "Agent",
    workflow: "N8N: BAZ WhatsApp Lead Router",
    status: "ACTIVE",
    assetCredits: 1_300_000_000,
  },
  {
    id: "native-company-profiler",
    name: "Company Profiler",
    category: "Active Script",
    workflow: "N8N: BAZ Company Profiler",
    status: "READY",
    assetCredits: 900_000_000,
  },
  {
    id: "native-crm-injector",
    name: "CRM Injection Script",
    category: "Active Script",
    workflow: "N8N: BAZ CRM Injection",
    status: "READY",
    assetCredits: 700_000_000,
  },
];

const hunterAssetCreditFallbacks = [2_400_000_000, 1_800_000_000, 1_300_000_000, 900_000_000, 700_000_000];

export const bazOsDriveParentId = "10RUF1EoQtH3W6O0Z0gLl0yktgfgkOePp";

export function getBazOsCurrentState() {
  const hunterToolsFile = hunterToolsData as HunterToolsFile;
  const scannedTools = hunterToolsFile.tools ?? [];
  const hunterTools = (scannedTools.length > 0 ? scannedTools : nativeHunterTools).map((tool, index) => ({
    ...tool,
    assetCredits: tool.assetCredits ?? hunterAssetCreditFallbacks[index % hunterAssetCreditFallbacks.length] ?? 0,
  }));
  const totalHunterAssetCredits = hunterTools.reduce((sum, tool) => sum + tool.assetCredits, 0);

  return {
    generatedAt: new Date().toISOString(),
    systemStatus: "ONLINE",
    drive: {
      targetFolderName: "BAZ_OS_LOGS",
      parentId: bazOsDriveParentId,
      parents: [bazOsDriveParentId],
    },
    empire: {
      companyCount: empireCompanies.length,
      companies: empireCompanies.map((company, index) => ({
        ...company,
        identity: index % 2 === 0 ? "BAZ SPACE" : "DOLPHIN",
        assignedHunterTool: hunterTools[index % hunterTools.length]?.name ?? "Native Lead Scraper",
      })),
    },
    hunterHub: {
      source: scannedTools.length > 0 ? "Base44 Hunter metadata" : "Native cloned Hunter workstation",
      toolCount: hunterTools.length,
      totalAssetCredits: totalHunterAssetCredits,
      totalAssetCreditsBillions: totalHunterAssetCredits / 1_000_000_000,
      tools: hunterTools,
      liveControl: {
        triggerEndpoint: "/api/n8n/trigger",
        directAgentEndpoint: "/api/base44/start-agent",
        n8nWebhook: "https://n8n.baz-f.co.il/webhook/baz-os-workflow-trigger",
      },
    },
    whatsappAgents: {
      endpoint: "/api/whatsapp",
      agents: ["WhatsApp Sales Router", "Follow-Up Agent", "Support Intake Agent"],
      logging: "Live logs sync through BAZ OS Logger webhook",
    },
    captainLog: {
      endpoint: "/api/brain-dump",
      syncMode: "Immediate note/task sync to N8N and Drive",
    },
    vault: {
      routingPlan: getLeastCostRoutingPlan(),
      balances: creditVaultBalances,
    },
    omniverse: {
      n8n: "https://n8n.baz-f.co.il",
      serverInfra: ["Hetzner", "Vercel", "Cloudflare"],
      creativeHub: ["Canva", "Company Emails"],
    },
  };
}

export function getBazOsCurrentStateFileContent() {
  return JSON.stringify(getBazOsCurrentState(), null, 2);
}
