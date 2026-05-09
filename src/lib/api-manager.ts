import db from "@/src/lib/db.json";

export type ApiService = "gemini" | "anthropic" | "meta";

type VaultAsset = {
  tool_name: string;
  api_key: string;
  status: string;
};

type ApiKeyRecord = {
  value: string;
  isAvailable: boolean;
};

const apiKeyPool: Record<ApiService, ApiKeyRecord[]> = {
  gemini: [
    { value: process.env.GEMINI_API_KEY ?? "GEMINI_KEY_PRIMARY", isAvailable: true },
    { value: process.env.GEMINI_API_KEY_BACKUP ?? "GEMINI_KEY_BACKUP", isAvailable: true },
  ],
  anthropic: [
    { value: process.env.ANTHROPIC_API_KEY ?? "ANTHROPIC_KEY_PRIMARY", isAvailable: true },
    { value: process.env.ANTHROPIC_API_KEY_BACKUP ?? "ANTHROPIC_KEY_BACKUP", isAvailable: true },
  ],
  meta: [
    { value: process.env.META_ACCESS_TOKEN ?? "META_KEY_PRIMARY", isAvailable: true },
    { value: process.env.META_ACCESS_TOKEN_BACKUP ?? "META_KEY_BACKUP", isAvailable: true },
  ],
};

const activeKeyIndex: Record<ApiService, number> = {
  gemini: 0,
  anthropic: 0,
  meta: 0,
};

export function getActiveKey(service: ApiService) {
  const serviceKeys = apiKeyPool[service];
  const activeKey = serviceKeys[activeKeyIndex[service]];

  if (activeKey?.isAvailable) {
    return activeKey.value;
  }

  return switchToNextAvailableKey(service);
}

export function switchToNextAvailableKey(service: ApiService) {
  const serviceKeys = apiKeyPool[service];
  const nextIndex = serviceKeys.findIndex((key) => key.isAvailable);

  if (nextIndex === -1) {
    throw new Error(`No available API keys for ${service}.`);
  }

  activeKeyIndex[service] = nextIndex;
  return serviceKeys[nextIndex].value;
}

export function handleApiError(service: ApiService, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const isQuotaExceeded =
    message.toLowerCase().includes("quota exceeded") ||
    message.toLowerCase().includes("rate limit") ||
    message.toLowerCase().includes("insufficient quota");

  if (!isQuotaExceeded) {
    throw error;
  }

  apiKeyPool[service][activeKeyIndex[service]].isAvailable = false;

  if (service === "gemini") {
    return routePowerThroughBackup();
  }

  return switchToNextAvailableKey(service);
}

export function routePowerThroughBackup() {
  const assets = (db as { vault_assets: VaultAsset[] }).vault_assets;
  const backup = assets.find(
    (asset) =>
      (asset.tool_name === "NVIDIA" || asset.tool_name === "Claude") &&
      asset.status !== "DEPLETED",
  );

  if (!backup) {
    throw new Error("No NVIDIA or Claude backup key available.");
  }

  console.info(`ROUTING POWER THROUGH BACKUP: ${backup.api_key}`);
  return backup.api_key;
}

export function resetApiKeyPool() {
  (Object.keys(apiKeyPool) as ApiService[]).forEach((service) => {
    apiKeyPool[service].forEach((key) => {
      key.isAvailable = true;
    });
    activeKeyIndex[service] = 0;
  });
}
