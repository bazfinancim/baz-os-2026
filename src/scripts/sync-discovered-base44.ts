/**
 * סנכרון discovered_tools.json מ-Base44 (Credit Hunter app).
 * מקביל ללוגיקת /api/hunter/data — יש לוודא BASE44_API_KEY ב-.env.local
 *
 * הערה: BAZ_MASTER_LOG_CUMULATIVE לא נמצא ב-repo; סקריפט זה הוא מקור האמת לייצוא מקומי.
 */
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const HUNTER_APP_ID = "69f0ecbea8b87cb75fe513c9";
const BASE44_API = "https://api.base44.com/api/apps";
const OUT = join(process.cwd(), "src", "data", "discovered_tools.json");
const LIMIT = 500;

function loadEnvLocal(): void {
  const p = join(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  const text = readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

function extractRecords(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== "object") return [];
  const o = body as Record<string, unknown>;
  for (const key of ["data", "items", "results", "entities", "records"]) {
    if (Array.isArray(o[key])) return o[key] as unknown[];
  }
  return [];
}

async function fetchEntityPage(
  apiKey: string,
  entity: string,
  offset: number,
): Promise<{ records: Record<string, unknown>[]; rawLen: number }> {
  const url = `${BASE44_API}/${HUNTER_APP_ID}/entities/${entity}?limit=${LIMIT}&offset=${offset}`;
  const res = await fetch(url, {
    headers: { api_key: apiKey, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${entity} offset ${offset} → HTTP ${res.status}: ${t.slice(0, 200)}`);
  }
  const data: unknown = await res.json();
  const raw = extractRecords(data);
  return {
    records: raw.map((r) => (r && typeof r === "object" ? (r as Record<string, unknown>) : {})),
    rawLen: raw.length,
  };
}

async function fetchAllEntity(apiKey: string, entity: string): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = [];
  let offset = 0;
  for (;;) {
    const { records, rawLen } = await fetchEntityPage(apiKey, entity, offset);
    all.push(...records);
    if (rawLen < LIMIT) break;
    offset += LIMIT;
    if (offset > 200_000) break;
  }
  return all;
}

function mapToPanelTool(row: Record<string, unknown>, sourceEntity: string): Record<string, unknown> {
  const id = String(row.id ?? row._id ?? "").trim();
  const name = String(row.name ?? row.title ?? row.slug ?? "—").trim();
  const category = String(row.category ?? row.tool_category ?? "other");
  const status = String(row.status ?? "discovered");
  const cv = row.credit_value ?? row.creditValue ?? row.credits ?? row.credit_pool;
  const credit_value = cv != null && cv !== "" ? String(cv) : undefined;
  const registration_email = row.registration_email != null ? row.registration_email : row.email;
  const url = row.url != null ? String(row.url) : undefined;
  const notesBase =
    row.notes != null ? String(row.notes) : row.description != null ? String(row.description) : undefined;
  const notes = notesBase ? `[${sourceEntity}] ${notesBase}` : `[${sourceEntity}]`;
  const priority = typeof row.priority === "number" ? row.priority : undefined;
  const credit_type = row.credit_type != null ? String(row.credit_type) : undefined;

  return {
    id: id || `${sourceEntity}-${name}`.replace(/\s+/g, "-").slice(0, 96),
    name,
    category,
    status,
    credit_value,
    registration_email: registration_email ?? null,
    url,
    priority,
    credit_type,
    notes,
  };
}

function dedupeById(items: Record<string, unknown>[]): Record<string, unknown>[] {
  const seen = new Set<string>();
  const out: Record<string, unknown>[] = [];
  for (const it of items) {
    const id = String(it.id ?? "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(it);
  }
  return out;
}

async function main() {
  loadEnvLocal();
  const apiKey = process.env.BASE44_API_KEY?.trim() ?? "";
  if (apiKey.length < 8) {
    console.error("חסר BASE44_API_KEY — הגדר ב-.env.local והרץ שוב.");
    process.exit(1);
  }

  console.log("מושך DiscoveredTool + AiProgram מ-Base44…");
  const [discovered, programs] = await Promise.all([
    fetchAllEntity(apiKey, "DiscoveredTool"),
    fetchAllEntity(apiKey, "AiProgram"),
  ]);

  const mapped = [
    ...discovered.map((r) => mapToPanelTool(r, "DiscoveredTool")),
    ...programs.map((r) => mapToPanelTool(r, "AiProgram")),
  ];
  const finalList = dedupeById(mapped);

  if (finalList.length === 0) {
    console.error("לא התקבלו רשומות — לא מעדכנים את discovered_tools.json (שומרים קיים).");
    process.exit(1);
  }

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(finalList, null, 2), "utf8");
  console.log(
    `נשמרו ${finalList.length} כלים ב-${OUT} (DiscoveredTool: ${discovered.length}, AiProgram: ${programs.length})`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
