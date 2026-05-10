import { NextResponse } from "next/server";

const API_KEY = process.env.BASE44_API_KEY ?? "";
const HUNTER_APP_ID = "69f0ecbea8b87cb75fe513c9";
const CODEX_APP_ID = "69dd50efc0d082b88ab254a2";

type B44Entity = Record<string, unknown>;

async function fetchEntity(appId: string, entity: string): Promise<B44Entity[]> {
  const url = `https://api.base44.com/api/apps/${appId}/entities/${entity}`;
  const res = await fetch(url, {
    headers: { "api_key": API_KEY },
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const data = await res.json() as B44Entity[] | { results?: B44Entity[] };
  return Array.isArray(data) ? data : (data.results ?? []);
}

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json({ ok: false, error: "BASE44_API_KEY not set" }, { status: 500 });
  }

  try {
    const [programs, projects] = await Promise.all([
      fetchEntity(HUNTER_APP_ID, "AiProgram"),
      fetchEntity(CODEX_APP_ID, "Project"),
    ]);

    return NextResponse.json({
      ok: true,
      programs,
      projects,
      totalPrograms: programs.length,
      totalProjects: projects.length,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
