import { NextRequest, NextResponse } from "next/server";

const BASE44_API = "https://app.base44.com";
const API_KEY = process.env.BASE44_API_KEY ?? "";

const APP_IDS = {
  codex: "69dd307d9b66b56b793acc13",
  creditHunter: "69f0ecbea8b87cb75fe513c9",
} as const;

type AppKey = keyof typeof APP_IDS;

function getAppId(app: string | null): string | null {
  if (!app || !(app in APP_IDS)) return null;
  return APP_IDS[app as AppKey];
}

function base44Headers() {
  return {
    api_key: API_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

// GET /api/base44/live?app=creditHunter&entity=AiProgram&limit=50&offset=0
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const app = searchParams.get("app");
  const entity = searchParams.get("entity");
  const limit = searchParams.get("limit") ?? "100";
  const offset = searchParams.get("offset") ?? "0";
  const filter = searchParams.get("filter");

  if (!API_KEY) {
    return NextResponse.json({ ok: false, error: "BASE44_API_KEY not set" }, { status: 500 });
  }

  // List all apps
  if (app === "apps" || !app) {
    const res = await fetch(`${BASE44_API}/api/apps`, {
      headers: base44Headers(),
    });
    const data: unknown = await res.json();
    return NextResponse.json({ ok: res.ok, data });
  }

  const appId = getAppId(app);
  if (!appId) {
    return NextResponse.json({ ok: false, error: `Unknown app: ${app}` }, { status: 400 });
  }

  if (!entity) {
    return NextResponse.json({ ok: false, error: "entity param required" }, { status: 400 });
  }

  let url = `${BASE44_API}/api/apps/${appId}/entities/${entity}?limit=${limit}&offset=${offset}`;
  if (filter) url += `&${filter}`;

  const res = await fetch(url, { headers: base44Headers() });
  const data: unknown = await res.json();
  return NextResponse.json({ ok: res.ok, appId, entity, data });
}

// POST /api/base44/live — create entity record
export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ ok: false, error: "BASE44_API_KEY not set" }, { status: 500 });
  }

  const body = (await req.json()) as { app: string; entity: string; record: Record<string, unknown> };
  const { app, entity, record } = body;

  const appId = getAppId(app);
  if (!appId || !entity || !record) {
    return NextResponse.json({ ok: false, error: "app, entity, record required" }, { status: 400 });
  }

  const res = await fetch(`${BASE44_API}/api/apps/${appId}/entities/${entity}`, {
    method: "POST",
    headers: base44Headers(),
    body: JSON.stringify(record),
  });
  const data: unknown = await res.json();
  return NextResponse.json({ ok: res.ok, data });
}

// PATCH /api/base44/live — update entity record
export async function PATCH(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ ok: false, error: "BASE44_API_KEY not set" }, { status: 500 });
  }

  const body = (await req.json()) as {
    app: string;
    entity: string;
    id: string;
    updates: Record<string, unknown>;
  };
  const { app, entity, id, updates } = body;

  const appId = getAppId(app);
  if (!appId || !entity || !id || !updates) {
    return NextResponse.json({ ok: false, error: "app, entity, id, updates required" }, { status: 400 });
  }

  const res = await fetch(`${BASE44_API}/api/apps/${appId}/entities/${entity}/${id}`, {
    method: "PUT",
    headers: base44Headers(),
    body: JSON.stringify(updates),
  });
  const data: unknown = await res.json();
  return NextResponse.json({ ok: res.ok, data });
}
