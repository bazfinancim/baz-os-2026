import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { type NextRequest, NextResponse } from "next/server";

const FILE = process.env.MISSIONS_JSON_PATH ?? join(process.cwd(), "data", "missions.json");

interface Mission {
  id: number;
  title: string;
  category?: string;
  done: boolean;
  urgent?: boolean;
  createdAt: string;
}

function ensureFile(): Mission[] {
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  try {
    return JSON.parse(readFileSync(FILE, "utf8")) as Mission[];
  } catch {
    writeFileSync(FILE, "[]");
    return [];
  }
}

export async function GET() {
  return NextResponse.json(ensureFile());
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { action: string; mission?: Partial<Mission>; id?: number };
  const missions = ensureFile();

  if (body.action === "add" && body.mission) {
    missions.push({ id: Date.now(), title: body.mission.title ?? "", category: body.mission.category, done: false, urgent: body.mission.urgent ?? false, createdAt: new Date().toISOString() });
  } else if (body.action === "toggle" && body.id) {
    const m = missions.find(x => x.id === body.id);
    if (m) m.done = !m.done;
  } else if (body.action === "delete" && body.id) {
    const i = missions.findIndex(x => x.id === body.id);
    if (i > -1) missions.splice(i, 1);
  }

  writeFileSync(FILE, JSON.stringify(missions, null, 2));
  return NextResponse.json({ ok: true, missions });
}
