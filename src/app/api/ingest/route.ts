import { NextResponse } from "next/server";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readDbWithRecovery, writeDbWithSnapshot } from "@/src/lib/db-manager";

type FuelPriority = "High" | "Medium" | "Low";

type ProjectMemory = {
  id: string;
  name: string;
  context: string;
  platform: string;
  assignedTo: string;
  status: string;
  sector?: string;
  fuelPriority?: FuelPriority;
  needsAttention?: boolean;
  isLocked?: boolean;
};

type ClientMemory = {
  id: string;
  name: string;
  health: number;
  fuelStatus: number;
  activeAutomations: string[];
  needsHumanHelp: boolean;
};

type EmpireDb = {
  lastSync?: string;
  clients: ClientMemory[];
  projects: ProjectMemory[];
};

type IngestPayload = {
  records?: unknown[];
  csv?: string;
  text?: string;
};

function slugify(value: string, fallback: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9א-ת]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

function parseCsv(csv: string) {
  const [headerLine, ...lines] = csv.split(/\r?\n/).filter(Boolean);

  if (!headerLine) {
    return [];
  }

  const headers = headerLine.split(",").map((header) => header.trim());

  return lines.map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return headers.reduce<Record<string, string>>((record, header, index) => {
      record[header] = values[index] ?? "";
      return record;
    }, {});
  });
}

function parsePlainTextProjects(text: string) {
  return text
    .split(/\r?\n|,/)
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

function categorizeProject(name: string, context = "") {
  const haystack = `${name} ${context}`.toLowerCase();

  if (/seo|organic|backlink|content|תוכן|קידום|אורגני/.test(haystack)) {
    return "SEO";
  }

  if (/invoice|finance|billing|ledger|חשבונית|חשבוניות|כסף|פיננס/.test(haystack)) {
    return "Finance";
  }

  if (/meta|ads|campaign|marketing|facebook|tiktok|linkedin|שיווק|קמפיין|לידים/.test(haystack)) {
    return "Marketing";
  }

  if (/whatsapp|bot|automation|api|n8n|בוט|אוטומ/.test(haystack)) {
    return "Automation";
  }

  if (/drive|base44|site|website|אתר|פורטל/.test(haystack)) {
    return "Web Assets";
  }

  return "General";
}

function assignFuelPriority(sector: string, name: string) {
  const haystack = `${sector} ${name}`.toLowerCase();

  if (/finance|marketing|automation|invoice|meta|hunter|חשבונית|לידים/.test(haystack)) {
    return "High";
  }

  if (/seo|web assets|website|site|content|אתר|תוכן/.test(haystack)) {
    return "Medium";
  }

  return "Low";
}

function normalizeProject(record: unknown, index: number): ProjectMemory {
  const source = record as Record<string, unknown>;
  const name = String(source.name ?? source.projectName ?? source.companyName ?? `Ingest Project ${index + 1}`);
  const context = String(source.context ?? source.description ?? "נכס שנבלע דרך Swallower ומוכן למיפוי.");
  const sector = String(source.sector ?? categorizeProject(name, context));
  const fuelPriority = String(source.fuelPriority ?? assignFuelPriority(sector, name)) as FuelPriority;
  const needsAttention =
    !source.context ||
    !source.platform ||
    !source.assignedTo ||
    String(source.status ?? "").toLowerCase().includes("missing");

  return {
    id: slugify(String(source.id ?? name), `ingest-project-${index + 1}`),
    name,
    context,
    platform: String(source.platform ?? "CSV/JSON"),
    assignedTo: String(source.assignedTo ?? source.owner ?? "Unassigned"),
    status: String(source.status ?? "ingested"),
    sector,
    fuelPriority,
    needsAttention,
  };
}

async function updateMasterReport(batchProjects: number, totalProjects: number) {
  const latestReportFile = join(process.cwd(), "public", "latest_report.txt");
  await writeFile(
    latestReportFile,
    [
      `EMPIRE STATUS: ${batchProjects} PROJECTS DETECTED | 100% OPERATIONAL`,
      `EMPIRE TOTAL PROJECTS: ${totalProjects} | RADAR NODES: SYNCED`,
      "PROJECT SWALLOWER: ACTIVE | RADAR: SYNCED | NEEDS ATTENTION NODES: ORANGE PULSE",
      `LAST INGESTION SYNC: ${new Date().toISOString()}`,
    ].join("\n"),
    "utf8",
  );
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as IngestPayload;
    const rawRecords =
      payload.records ??
      (payload.csv ? parseCsv(payload.csv) : payload.text ? parsePlainTextProjects(payload.text) : []);

    if (!Array.isArray(rawRecords) || rawRecords.length === 0) {
      return NextResponse.json(
        { error: "No records supplied for ingestion." },
        { status: 400 },
      );
    }

    const db = await readDbWithRecovery<EmpireDb>();
    const existingIds = new Set(db.projects.map((project) => project.id));
    const projects = rawRecords
      .map(normalizeProject)
      .filter((project) => !existingIds.has(project.id));
    const updatedDb: EmpireDb = {
      ...db,
      lastSync: new Date().toISOString(),
      projects: [...db.projects, ...projects],
    };

    await writeDbWithSnapshot(updatedDb);
    await updateMasterReport(rawRecords.length, updatedDb.projects.length);

    return NextResponse.json({
      status: "ingested",
      inserted: projects.length,
      totalProjects: updatedDb.projects.length,
      projects: updatedDb.projects,
    });
  } catch {
    return NextResponse.json(
      { error: "Swallower ingestion failed." },
      { status: 500 },
    );
  }
}
