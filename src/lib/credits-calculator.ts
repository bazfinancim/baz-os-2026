/** חישובי קרדיט Hunter — משותף ל־CreditsHub ולמקומות אחרים */

export type CreditTool = {
  id?: string;
  _id?: string;
  name?: string;
  /** שדה חלופי מ־Base44 / discovered_tools */
  tool_name?: string;
  status?: string;
  credit_value?: string;
  category?: string;
  notes?: string;
  url?: string;
  registration_email?: string | null;
  company?: string;
  tool_type?: string;
  priority?: number;
  credit_type?: string;
};

/** תווית תצוגה — name או tool_name (מקור JSON משתנה) */
export function toolDisplayLabel(t: Pick<CreditTool, "name" | "tool_name">): string {
  const raw = (t.name ?? t.tool_name ?? "").toString().trim();
  return raw.length > 0 ? raw : "—";
}

export function parseCreditsValue(cv: string | null | undefined): number {
  if (!cv) return 0;
  const str = String(cv).replace(/,/g, "").trim();
  const b = str.match(/\$?([\d.]+)\s*b/i);
  if (b) return Math.round(parseFloat(b[1]) * 1_000_000_000);
  const m = str.match(/\$?([\d.]+)\s*m/i);
  if (m) return Math.round(parseFloat(m[1]) * 1_000_000);
  const k = str.match(/\$?([\d.]+)\s*k/i);
  if (k) return Math.round(parseFloat(k[1]) * 1_000);
  const d = str.match(/\$?([\d.]+)/);
  if (d) return Math.round(parseFloat(d[1]));
  return 0;
}

export function formatCreditsCompact(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

const ACTIVE_STATUSES = ["active", "registered"];
const POTENTIAL_STATUSES = ["discovered", "pending_registration"];

export function calculateCredits(tools: CreditTool[]) {
  const byStatus: Record<string, { count: number; value: number }> = {};
  for (const tool of tools) {
    const s = tool.status ?? "discovered";
    if (!byStatus[s]) byStatus[s] = { count: 0, value: 0 };
    byStatus[s].count++;
    byStatus[s].value += parseCreditsValue(tool.credit_value);
  }
  const active = ACTIVE_STATUSES.reduce((sum, s) => sum + (byStatus[s]?.value ?? 0), 0);
  const potential = POTENTIAL_STATUSES.reduce((sum, s) => sum + (byStatus[s]?.value ?? 0), 0);
  const activeCount = ACTIVE_STATUSES.reduce((sum, s) => sum + (byStatus[s]?.count ?? 0), 0);
  return { active, potential, total: active + potential, activeCount, byStatus };
}
