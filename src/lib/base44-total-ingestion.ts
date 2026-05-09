export type Base44AppConfig = {
  id: string;
  label: string;
  entities: string[];
};

export type Base44EntityIngestion = {
  appId: string;
  appLabel: string;
  entityName: string;
  url: string;
  ok: boolean;
  status: number;
  records: unknown[];
  error?: string;
};

export const base44Apps: Base44AppConfig[] = [
  {
    id: "69dd307d9b66b56b793acc13",
    label: "CodeX",
    entities: ["Project", "Task", "Integration", "CreditAccount", "ScoutFinding", "BotConfig"],
  },
  {
    id: "69f0ecbea8b87cb75fe513c9",
    label: "Credit Hunter",
    entities: ["AiProgram", "DiscoveredTool", "ToolRegistration", "Department", "WorkerBot"],
  },
];

function extractRecords(body: unknown) {
  if (Array.isArray(body)) {
    return body;
  }

  if (!body || typeof body !== "object") {
    return [];
  }

  const record = body as Record<string, unknown>;

  for (const key of ["data", "items", "results", "entities", "records"]) {
    if (Array.isArray(record[key])) {
      return record[key] as unknown[];
    }
  }

  return [];
}

async function fetchBase44Entity(app: Base44AppConfig, entityName: string, apiKey: string) {
  const url = `https://api.base44.com/api/apps/${app.id}/entities/${entityName}`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
    const contentType = response.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json") ? await response.json() : await response.text();

    return {
      appId: app.id,
      appLabel: app.label,
      entityName,
      url,
      ok: response.ok,
      status: response.status,
      records: response.ok ? extractRecords(body) : [],
      error: response.ok ? undefined : String(typeof body === "string" ? body : JSON.stringify(body)),
    } satisfies Base44EntityIngestion;
  } catch (error) {
    return {
      appId: app.id,
      appLabel: app.label,
      entityName,
      url,
      ok: false,
      status: 0,
      records: [],
      error: error instanceof Error ? error.message : "Unknown Base44 fetch error",
    } satisfies Base44EntityIngestion;
  }
}

export async function ingestBase44TotalData() {
  const apiKey = process.env.BASE44_API_KEY;

  if (!apiKey?.trim()) {
    return {
      ok: false,
      status: "missing-key" as const,
      generatedAt: new Date().toISOString(),
      totalRecords: 0,
      entities: [] as Base44EntityIngestion[],
      error: "BASE44_API_KEY is missing. Server-side key is required.",
    };
  }

  const entities = (
    await Promise.all(
      base44Apps.flatMap((app) => app.entities.map((entityName) => fetchBase44Entity(app, entityName, apiKey))),
    )
  );
  const totalRecords = entities.reduce((sum, entity) => sum + entity.records.length, 0);

  return {
    ok: entities.some((entity) => entity.ok),
    status: entities.some((entity) => entity.ok) ? "online" as const : "failed" as const,
    generatedAt: new Date().toISOString(),
    totalRecords,
    entities,
  };
}
