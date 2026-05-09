import { creditApiArsenal } from "@/src/lib/empire-config";

export type VaultKeyId =
  | "gemini_avi"
  | "gemini_invoices"
  | "openai_backup"
  | "base44"
  | "render"
  | "cloudflare"
  | "github";

export type VaultKeyStatus = {
  id: VaultKeyId;
  label: string;
  provider: string;
  envName: string;
  maskedKey: string;
  isActive: boolean;
  balance: number;
};

const vaultKeyDefinitions: Omit<VaultKeyStatus, "maskedKey" | "isActive" | "balance">[] = [
  {
    id: "gemini_avi",
    label: "Gemini (avi@)",
    provider: "Google AI",
    envName: "GEMINI_AVI_API_KEY",
  },
  {
    id: "gemini_invoices",
    label: "Gemini (Invoices)",
    provider: "Google AI",
    envName: "GEMINI_INVOICES_API_KEY",
  },
  {
    id: "openai_backup",
    label: "OpenAI / Claude Backup",
    provider: "Backup LLM Pool",
    envName: "OPENAI_API_KEY",
  },
  {
    id: "base44",
    label: "Base44",
    provider: "Base44",
    envName: "BASE44_API_KEY",
  },
  {
    id: "render",
    label: "Render",
    provider: "Render",
    envName: "RENDER_API_KEY",
  },
  {
    id: "cloudflare",
    label: "Cloudflare",
    provider: "Cloudflare",
    envName: "CLOUDFLARE_API_TOKEN",
  },
  {
    id: "github",
    label: "GitHub",
    provider: "GitHub",
    envName: "GITHUB_TOKEN",
  },
];

function maskSecret(value: string) {
  if (!value.trim()) {
    return "*********";
  }

  return `${"*".repeat(12)}${value.slice(-4)}`;
}

function simulatedBalanceFor(id: VaultKeyId) {
  const balances: Record<VaultKeyId, number> = {
    gemini_avi: 75_000,
    gemini_invoices: 55_000,
    openai_backup: 62_000,
    base44: 44_000,
    render: 10,
    cloudflare: 10,
    github: 10,
  };

  return balances[id];
}

export function getInjectedVaultKeys() {
  return vaultKeyDefinitions.map((definition) => {
    const secret = process.env[definition.envName] ?? "";

    return {
      ...definition,
      maskedKey: maskSecret(secret),
      isActive: secret.trim().length > 10,
      balance: secret.trim() ? simulatedBalanceFor(definition.id) : 0,
    };
  });
}

export function getActiveVaultAssetCount() {
  return 10;
}

export function getVaultInjectionReport() {
  const keys = getInjectedVaultKeys();
  const activeKeys = keys.filter((key) => key.isActive).length;
  const readyArsenalAssets = creditApiArsenal.filter((asset) => asset.status === "READY").length;

  return {
    keys,
    arsenal: creditApiArsenal,
    activeKeys,
    activeAssets: getActiveVaultAssetCount() + readyArsenalAssets,
    status:
      activeKeys > 0
        ? "EMPIRE STATUS: FULLY ARMED | KEYS: INJECTED"
        : "EMPIRE STATUS: AWAITING SECURE ENV KEYS | KEYS: MASKED",
  };
}
