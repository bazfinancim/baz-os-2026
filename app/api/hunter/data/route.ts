import { NextResponse } from "next/server";

// Hunter is isolated — never shares API calls with the Base44 ecosystem
const HUNTER_APP_ID = "69f0ecbea8b87cb75fe513c9";
const BASE44_API = "https://api.base44.com/api/apps";

type Entity = Record<string, unknown>;

async function hunterFetch(entity: string, apiKey: string): Promise<Entity[]> {
  const url = `${BASE44_API}/${HUNTER_APP_ID}/entities/${entity}`;
  const res = await fetch(url, {
    headers: { api_key: apiKey },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Hunter API ${entity} → HTTP ${res.status}`);
  const data = await res.json() as Entity[] | { results?: Entity[] };
  return Array.isArray(data) ? data : (data.results ?? []);
}

export async function GET() {
  const apiKey = process.env.BASE44_API_KEY ?? "";

  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "BASE44_API_KEY לא מוגדר בסביבה" },
      { status: 500 },
    );
  }

  // Hunter fetches run in parallel — if one fails the others still return
  const [programs, tools, bots] = await Promise.allSettled([
    hunterFetch("AiProgram", apiKey),
    hunterFetch("DiscoveredTool", apiKey),
    hunterFetch("WorkerBot", apiKey),
  ]);

  const toData = (r: PromiseSettledResult<Entity[]>) =>
    r.status === "fulfilled" ? r.value : [];
  const toError = (r: PromiseSettledResult<Entity[]>) =>
    r.status === "rejected" ? String((r as PromiseRejectedResult).reason) : null;

  return NextResponse.json({
    ok: true,
    appId: HUNTER_APP_ID,
    programs: toData(programs),
    tools: toData(tools),
    bots: toData(bots),
    errors: {
      programs: toError(programs),
      tools: toError(tools),
      bots: toError(bots),
    },
    totals: {
      programs: toData(programs).length,
      tools: toData(tools).length,
      bots: toData(bots).length,
    },
  });
}
