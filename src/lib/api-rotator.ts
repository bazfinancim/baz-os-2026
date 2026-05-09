import { readDbWithRecovery, writeDbWithSnapshot } from "@/src/lib/db-manager";

export type RotatableAiService = "gemini" | "claude";

type VaultAsset = {
  id: string;
  tool_name: string;
  api_key: string;
  expiry_date: string;
  credit_balance: number;
  status: string;
};

type EmpireDb = {
  lastSync?: string;
  vault_assets: VaultAsset[];
};

type RotationResult = {
  service: RotatableAiService;
  activeKey: string;
  assetId: string;
  rotated: boolean;
};

function isRotationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("429") ||
    message.toLowerCase().includes("too many requests") ||
    message.toLowerCase().includes("quota exceeded") ||
    message.toLowerCase().includes("rate limit")
  );
}

function serviceMatches(asset: VaultAsset, service: RotatableAiService) {
  const toolName = asset.tool_name.toLowerCase();
  return service === "gemini" ? toolName.includes("gemini") : toolName.includes("claude");
}

async function readDb() {
  return readDbWithRecovery<EmpireDb>();
}

async function writeDb(db: EmpireDb) {
  await writeDbWithSnapshot(db);
}

export async function getActiveRotatingKey(service: RotatableAiService): Promise<RotationResult> {
  const db = await readDb();
  const asset = db.vault_assets.find(
    (candidate) =>
      serviceMatches(candidate, service) &&
      candidate.status === "ACTIVE" &&
      candidate.credit_balance > 0,
  );

  if (!asset) {
    throw new Error(`No active ${service} key available.`);
  }

  return {
    service,
    activeKey: asset.api_key,
    assetId: asset.id,
    rotated: false,
  };
}

export async function rotateKeyAfterError(
  service: RotatableAiService,
  failedAssetId: string,
  error: unknown,
): Promise<RotationResult> {
  if (!isRotationError(error)) {
    throw error;
  }

  const db = await readDb();
  const updatedAssets = db.vault_assets.map((asset) =>
    asset.id === failedAssetId
      ? { ...asset, status: "QUOTA_EXCEEDED" }
      : asset,
  );
  const nextAsset = updatedAssets.find(
    (asset) =>
      serviceMatches(asset, service) &&
      asset.id !== failedAssetId &&
      asset.status === "ACTIVE" &&
      asset.credit_balance > 0,
  );

  if (!nextAsset) {
    throw new Error(`No backup ${service} key available after quota rotation.`);
  }

  await writeDb({
    ...db,
    lastSync: new Date().toISOString(),
    vault_assets: updatedAssets,
  });

  return {
    service,
    activeKey: nextAsset.api_key,
    assetId: nextAsset.id,
    rotated: true,
  };
}

export async function runWithApiRotation<T>(
  service: RotatableAiService,
  executor: (apiKey: string) => Promise<T>,
) {
  const current = await getActiveRotatingKey(service);

  try {
    return await executor(current.activeKey);
  } catch (error) {
    const next = await rotateKeyAfterError(service, current.assetId, error);
    return executor(next.activeKey);
  }
}
