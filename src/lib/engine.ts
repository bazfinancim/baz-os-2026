import db from "@/src/lib/db.json";

type VaultAsset = {
  tool_name: string;
  credit_balance: number;
  status: string;
};

type EngineState = {
  geminiCredits: number;
  claudeCredits: number;
  hunterCredits: number;
  totalCredits: number;
  electricityLevel: "HIGH" | "LOW";
};

function sumCredits(assets: VaultAsset[], keyword: string) {
  return assets
    .filter((asset) => asset.tool_name.toLowerCase().includes(keyword))
    .reduce((sum, asset) => sum + asset.credit_balance, 0);
}

export function getPowerDispatcherState(): EngineState {
  const assets = (db as { vault_assets: VaultAsset[] }).vault_assets;
  const geminiCredits = sumCredits(assets, "gemini");
  const claudeCredits = sumCredits(assets, "claude");
  const hunterCredits = sumCredits(assets, "hunter");
  const totalCredits = geminiCredits + claudeCredits + hunterCredits;

  return {
    geminiCredits,
    claudeCredits,
    hunterCredits,
    totalCredits,
    electricityLevel: totalCredits > 0 ? "HIGH" : "LOW",
  };
}
