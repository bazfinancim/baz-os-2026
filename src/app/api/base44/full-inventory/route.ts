import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

type Base44ScanResult = {
  endpoint?: string;
  ok?: boolean;
  status?: number;
  statusText?: string;
};

type Base44FullInventory = {
  finishedAt?: string;
  endpoints?: string[];
  results?: Base44ScanResult[];
};

function normalizeTool(result: Base44ScanResult, index: number) {
  const endpoint = result.endpoint ?? `base44-endpoint-${index + 1}`;
  const status = result.ok ? "READY" : `SCAN_${result.status ?? "UNKNOWN"}`;

  return {
    id: `full-inventory-${endpoint.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
    name: `Base44 ${endpoint.replace(/[_/-]+/g, " ")}`,
    category: endpoint.includes("hunter") || endpoint.includes("scraper") ? "Hunter Tool" : "Base44 Agent Endpoint",
    creditPool: "Least Cost Vault",
    status,
  };
}

export async function GET() {
  try {
    const inventoryPath = join(process.cwd(), "..", "BASE44_FULL_INVENTORY.json");
    const content = await readFile(inventoryPath, "utf8");
    const inventory = JSON.parse(content) as Base44FullInventory;
    const results = inventory.results ?? [];
    const toolEndpoints = results.filter((result) => {
      const endpoint = result.endpoint ?? "";
      return /hunter|scraper|script|automation|app|project/i.test(endpoint);
    });

    return NextResponse.json({
      ok: true,
      generatedAt: inventory.finishedAt ?? null,
      tools: toolEndpoints.map(normalizeTool),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown full inventory read error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
        tools: [],
      },
      { status: 404 },
    );
  }
}
