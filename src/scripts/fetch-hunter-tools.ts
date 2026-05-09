import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

type HunterTool = {
  id: string;
  name: string;
  category: "Hunter Tool" | "Scraper" | "Active Script";
  sourceEndpoint: string;
  creditPool: string;
  status: string;
};

type ScanResult = {
  endpoint: string;
  url: string;
  ok: boolean;
  status: number;
  body: unknown;
};

const apiKey = process.env.BASE44_API_KEY;
const outputPath = join(process.cwd(), "src", "data", "hunter_tools.json");
const baseUrls = ["https://base44.com", "https://api.base44.com", "https://app.base44.com"];
const endpoints = [
  { path: "/api/hunter/tools", category: "Hunter Tool" as const },
  { path: "/api/hunter/scrapers", category: "Scraper" as const },
  { path: "/api/hunter/scripts", category: "Active Script" as const },
  { path: "/api/scrapers", category: "Scraper" as const },
  { path: "/api/scripts", category: "Active Script" as const },
];

function extractArray(body: unknown): unknown[] {
  if (Array.isArray(body)) {
    return body;
  }

  if (!body || typeof body !== "object") {
    return [];
  }

  const record = body as Record<string, unknown>;

  for (const key of ["tools", "scrapers", "scripts", "items", "data", "results"]) {
    const value = record[key];

    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function normalizeTool(item: unknown, result: ScanResult, index: number, category: HunterTool["category"]): HunterTool {
  const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
  const name = String(record.name ?? record.title ?? record.slug ?? `${category} ${index + 1}`);
  const id = String(record.id ?? record._id ?? record.slug ?? `${category}-${index + 1}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    id: id || `${category.toLowerCase().replace(/\s+/g, "-")}-${index + 1}`,
    name,
    category,
    sourceEndpoint: result.endpoint,
    creditPool: "Least Cost Vault",
    status: String(record.status ?? (result.ok ? "READY" : `SCAN_${result.status}`)),
  };
}

async function requestEndpoint(baseUrl: string, endpoint: (typeof endpoints)[number]): Promise<ScanResult> {
  const url = `${baseUrl}${endpoint.path}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey ?? ""}`,
        "x-api-key": apiKey ?? "",
        Accept: "application/json",
      },
    });
    const contentType = response.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json") ? await response.json() : await response.text();

    return {
      endpoint: endpoint.path,
      url,
      ok: response.ok,
      status: response.status,
      body,
    };
  } catch (error) {
    return {
      endpoint: endpoint.path,
      url,
      ok: false,
      status: 0,
      body: error instanceof Error ? error.message : "Unknown request error",
    };
  }
}

async function main() {
  const results: ScanResult[] = [];
  const tools: HunterTool[] = [];

  for (const baseUrl of baseUrls) {
    for (const endpoint of endpoints) {
      const result = await requestEndpoint(baseUrl, endpoint);
      results.push(result);
      tools.push(
        ...extractArray(result.body).map((item, index) => normalizeTool(item, result, index, endpoint.category)),
      );
    }
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: "base44-hunter-tools",
        status: tools.length > 0 ? "scanned" : "empty",
        tools,
        results,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(`[BASE44 HUNTER TOOLS] saved ${tools.length} tools to ${outputPath}`);
}

void main();
