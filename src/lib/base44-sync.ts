import base44Inventory from "@/src/data/base44_inventory.json";

export type Base44Project = {
  id: string;
  name: string;
  status: "active" | "pending";
  owner: string;
  source: "Base44";
};

export type Base44CreditStatus = {
  usedCredits: number;
  totalCredits: number;
  giftCredits: number;
  remainingCredits: number;
  integrationCreditsRemaining: number;
  chatCreditsRemaining: number;
  syncWindow: string;
  status: "READY";
};

export type Base44HunterTool = {
  id: string;
  name: string;
  category: string;
  creditPool: string;
  status: "Discovered" | "Ready To Claim" | "Queued";
};

export type Base44ScrapingLog = {
  id: string;
  createdAt: string;
  action: string;
  status: "OK" | "QUEUED";
};

type InventoryProject = {
  id?: string;
  name?: string;
  status?: string;
  owner?: string;
};

type InventoryTool = {
  id?: string;
  name?: string;
  category?: string;
  creditPool?: string;
  status?: string;
};

type Base44Inventory = {
  generatedAt?: string | null;
  status?: string;
  projects?: {
    active?: InventoryProject[];
  };
  hunter?: {
    scrapers?: InventoryTool[];
  };
  credits?: Partial<Base44CreditStatus>;
};

const inventory = base44Inventory as Base44Inventory;

function toProjectStatus(status: string | undefined): "active" | "pending" {
  return status?.toLowerCase() === "active" ? "active" : "pending";
}

function toHunterStatus(status: string | undefined): Base44HunterTool["status"] {
  const normalized = status?.toLowerCase() ?? "";

  if (normalized.includes("claim") || normalized.includes("ready") || normalized === "active") {
    return "Ready To Claim";
  }

  if (normalized.includes("queue") || normalized.includes("pending")) {
    return "Queued";
  }

  return "Discovered";
}

export function getBase44ConnectionStatus() {
  const key = process.env.BASE44_API_KEY ?? "";

  return {
    connected: key.trim().length > 10,
    keyMasked: key.trim() ? `${"*".repeat(12)}${key.slice(-4)}` : "missing",
  };
}

export function getBase44Projects(): Base44Project[] {
  return (inventory.projects?.active ?? []).map((project, index) => ({
    id: project.id ?? `base44-project-${index + 1}`,
    name: project.name ?? `Base44 Project ${index + 1}`,
    status: toProjectStatus(project.status),
    owner: project.owner ?? "Base44",
    source: "Base44",
  }));
}

export function getBase44Credits(): Base44CreditStatus {
  const usedCredits = Number(inventory.credits?.usedCredits ?? 427);
  const totalCredits = Number(inventory.credits?.totalCredits ?? 1_200_030);
  const remainingCredits = Number(
    inventory.credits?.remainingCredits ?? Math.max(0, totalCredits - usedCredits),
  );

  return {
    usedCredits,
    totalCredits,
    giftCredits: Number(inventory.credits?.giftCredits ?? 30),
    remainingCredits,
    integrationCreditsRemaining: Number(inventory.credits?.integrationCreditsRemaining ?? remainingCredits),
    chatCreditsRemaining: Number(inventory.credits?.chatCreditsRemaining ?? 0),
    syncWindow: inventory.generatedAt ?? "not scanned",
    status: "READY",
  };
}

export function getBase44HunterTools(): Base44HunterTool[] {
  return (inventory.hunter?.scrapers ?? []).map((tool, index) => ({
    id: tool.id ?? `base44-hunter-${index + 1}`,
    name: tool.name ?? `Hunter Scraper ${index + 1}`,
    category: tool.category ?? "Hunter Scraper",
    creditPool: tool.creditPool ?? "real inventory",
    status: toHunterStatus(tool.status),
  }));
}

export function getBase44ScrapingLogs(): Base44ScrapingLog[] {
  const now = new Date().toISOString();

  return [
    {
      id: "b44-log-001",
      createdAt: now,
      action: `Inventory file status: ${inventory.status ?? "unknown"}`,
      status: inventory.status === "scanned" ? "OK" : "QUEUED",
    },
    {
      id: "b44-log-002",
      createdAt: now,
      action: `Loaded ${getBase44Projects().length} projects and ${getBase44HunterTools().length} hunter scrapers`,
      status: "OK",
    },
  ];
}
