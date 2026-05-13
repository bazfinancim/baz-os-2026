import { mkdir, readFile, rename, unlink, writeFile } from "fs/promises";
import { dirname } from "path";
import { NextResponse } from "next/server";

import { createDefaultMissions, normalizeMissions } from "@/src/lib/missions-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * ברירת מחדל בפרוד: /var/www/baz-panel/data/missions.json
 * בפיתוח (Windows וכו'): הגדר ב-.env.local — MISSIONS_JSON_PATH=C:\\path\\missions.json
 */
function missionsFilePath(): string {
  return process.env.MISSIONS_JSON_PATH ?? "/var/www/baz-panel/data/missions.json";
}

async function writeAtomic(filePath: string, data: string): Promise<void> {
  const tmp = `${filePath}.${Date.now()}.tmp`;
  try {
    await writeFile(tmp, data, "utf8");
    await rename(tmp, filePath);
  } catch (e) {
    await unlink(tmp).catch(() => undefined);
    throw e;
  }
}

export async function GET() {
  const filePath = missionsFilePath();
  try {
    const raw = await readFile(filePath, "utf8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      return NextResponse.json({
        missions: createDefaultMissions(),
        error: "קובץ missions פגום — הוחזרה ברירת מחדל",
      });
    }
    const missions = normalizeMissions(parsed);
    return NextResponse.json({ missions });
  } catch (e) {
    const code = e && typeof e === "object" && "code" in e ? String((e as NodeJS.ErrnoException).code) : "";
    if (code === "ENOENT") {
      return NextResponse.json({ missions: createDefaultMissions(), note: "קובץ חדש — ברירת מחדל" });
    }
    const message = e instanceof Error ? e.message : "שגיאת קריאה";
    return NextResponse.json(
      { missions: createDefaultMissions(), error: message },
      { status: 200 },
    );
  }
}

export async function POST(request: Request) {
  const filePath = missionsFilePath();
  try {
    const body = (await request.json()) as { missions?: unknown };
    const missions = normalizeMissions(body.missions);
    const json = JSON.stringify(missions, null, 2);
    await mkdir(dirname(filePath), { recursive: true });
    await writeAtomic(filePath, json);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "שגיאת שמירה";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
