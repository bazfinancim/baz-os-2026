export type VaultRouteProvider =
  | "Gemini Free"
  | "OpenAI Credit"
  | "NVIDIA Grants"
  | "Other Grants";

export type VaultRouteBalance = {
  id: string;
  provider: VaultRouteProvider;
  keyLabel: string;
  balance: number;
  unit: "credits" | "grant-usd";
  costTier: 0 | 1 | 2 | 3;
  status: "ACTIVE" | "READY" | "RESERVE";
  routingRole: string;
};

export const creditVaultBalances: VaultRouteBalance[] = [
  {
    id: "gemini-free",
    provider: "Gemini Free",
    keyLabel: "Gemini Workspace / Free-first Pool",
    balance: 4_200_000_000,
    unit: "credits",
    costTier: 0,
    status: "ACTIVE",
    routingRole: "Default zero-cost reasoning, scans and text work",
  },
  {
    id: "openai-credit-966",
    provider: "OpenAI Credit",
    keyLabel: "OpenAI Grants Pool",
    balance: 980_000_000,
    unit: "grant-usd",
    costTier: 1,
    status: "READY",
    routingRole: "Use OpenAI grants only after Gemini free pool",
  },
  {
    id: "nvidia-grants",
    provider: "NVIDIA Grants",
    keyLabel: "NVIDIA NIM / GPU Grants",
    balance: 2_700_000_000,
    unit: "credits",
    costTier: 2,
    status: "READY",
    routingRole: "GPU inference, visual AI and heavy processing bursts",
  },
  {
    id: "other-grants",
    provider: "Other Grants",
    keyLabel: "Backup Grants Pool",
    balance: 1_100_000_000,
    unit: "credits",
    costTier: 3,
    status: "RESERVE",
    routingRole: "Last resort grant-backed route after Gemini, OpenAI credit and NVIDIA",
  },
];

export function selectLeastCostRoute(requiredBalance = 1) {
  return [...creditVaultBalances]
    .filter((route) => route.balance >= requiredBalance)
    .sort((first, second) => first.costTier - second.costTier)[0];
}

export function getLeastCostRoutingPlan() {
  const selected = selectLeastCostRoute();

  return {
    status: "ACTIVE" as const,
    selectedProvider: selected?.provider ?? "Other Grants",
    order: creditVaultBalances
      .sort((first, second) => first.costTier - second.costTier)
      .map((route) => route.provider),
  };
}
