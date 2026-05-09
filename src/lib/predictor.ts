import db from "@/src/lib/db.json";

type VaultAsset = {
  credit_balance: number;
  status: string;
};

type LeadRecord = {
  id: string;
};

const DEFAULT_AVERAGE_BURN_RATE = 850;

export function getTotalAvailableCredits() {
  const assets = (db as { vault_assets: VaultAsset[] }).vault_assets ?? [];

  return assets
    .filter((asset) => asset.status.toLowerCase() !== "depleted")
    .reduce((sum, asset) => sum + asset.credit_balance, 0);
}

export function getAverageBurnRate() {
  const leadCount = ((db as { leads?: LeadRecord[] }).leads ?? []).length;

  return DEFAULT_AVERAGE_BURN_RATE + leadCount * 2;
}

export function getWorkHoursRemaining() {
  const totalCredits = getTotalAvailableCredits();
  const averageBurnRate = getAverageBurnRate();

  if (averageBurnRate <= 0) {
    return 0;
  }

  return Math.max(0, Math.floor(totalCredits / averageBurnRate));
}
