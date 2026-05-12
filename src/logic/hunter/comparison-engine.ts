import type { CreditTool } from "@/src/lib/credits-calculator";
import { calculateCredits, formatCreditsCompact, parseCreditsValue, toolDisplayLabel } from "@/src/lib/credits-calculator";

/** סיכום לפי קטגוריה — בסיס ל־Comparison Engine */
export type CategorySlice = {
  category: string;
  count: number;
  creditSum: number;
  activeCreditSum: number;
  potentialCreditSum: number;
  byStatus: Record<string, number>;
  topTools: { name: string; credit: number; status?: string }[];
};

export type ComparisonEngineResult = {
  generatedAt: string;
  totalTools: number;
  global: ReturnType<typeof calculateCredits>;
  categories: CategorySlice[];
  /** זוגות קטגוריות עם הפרש הקרדיטים הגדול ביותר */
  topCategoryGaps: { a: string; b: string; gapUsdApprox: string; delta: number }[];
  narrativeHe: string[];
};

const ACTIVE = new Set(["active", "registered"]);
const POTENTIAL = new Set(["discovered", "pending_registration"]);

function pushTopTools(
  tools: CreditTool[],
  cat: string,
  limit: number,
): { name: string; credit: number; status?: string }[] {
  return [...tools]
    .filter((t) => (t.category ?? "other") === cat)
    .map((t) => ({
      name: toolDisplayLabel(t),
      credit: parseCreditsValue(t.credit_value),
      status: t.status,
    }))
    .sort((x, y) => y.credit - x.credit)
    .slice(0, limit);
}

/**
 * מנתח את discovered_tools (ומקורות מוזגים) לפי קטגוריות וקרדיטים — לוגיקה חיה ל-Hunter.
 */
export function runComparisonEngine(tools: CreditTool[]): ComparisonEngineResult {
  const generatedAt = new Date().toISOString();
  const global = calculateCredits(tools);

  const catKeys = new Set<string>();
  for (const t of tools) catKeys.add(t.category ?? "other");

  const categories: CategorySlice[] = [...catKeys].map((category) => {
    const slice = tools.filter((t) => (t.category ?? "other") === category);
    let creditSum = 0;
    let activeCreditSum = 0;
    let potentialCreditSum = 0;
    const byStatus: Record<string, number> = {};
    for (const t of slice) {
      const v = parseCreditsValue(t.credit_value);
      creditSum += v;
      const s = t.status ?? "discovered";
      byStatus[s] = (byStatus[s] ?? 0) + 1;
      if (ACTIVE.has(s)) activeCreditSum += v;
      if (POTENTIAL.has(s)) potentialCreditSum += v;
    }
    return {
      category,
      count: slice.length,
      creditSum,
      activeCreditSum,
      potentialCreditSum,
      byStatus,
      topTools: pushTopTools(tools, category, 5),
    };
  });

  categories.sort((x, y) => y.creditSum - x.creditSum);

  const gaps: { a: string; b: string; delta: number }[] = [];
  for (let i = 0; i < categories.length; i++) {
    for (let j = i + 1; j < categories.length; j++) {
      const a = categories[i];
      const b = categories[j];
      const delta = Math.abs(a.creditSum - b.creditSum);
      gaps.push({ a: a.category, b: b.category, delta });
    }
  }
  gaps.sort((x, y) => y.delta - x.delta);
  const topCategoryGaps = gaps.slice(0, 5).map((g) => ({
    ...g,
    gapUsdApprox: formatCreditsCompact(g.delta),
  }));

  const narrativeHe: string[] = [
    `סה״כ ${tools.length} כלים; פעילים+נרשמים: ${global.activeCount}; ערך פעיל משוער: ${formatCreditsCompact(global.active)}.`,
    `פוטנציאל (discovered/pending): ${formatCreditsCompact(global.potential)}.`,
    `הקטגוריה המובילה לפי סכום קרדיט משוער: ${categories[0]?.category ?? "—"} (${formatCreditsCompact(categories[0]?.creditSum ?? 0)}).`,
  ];

  return {
    generatedAt,
    totalTools: tools.length,
    global,
    categories,
    topCategoryGaps,
    narrativeHe,
  };
}
