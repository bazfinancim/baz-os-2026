import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { archiveLatestReport, listArchivedReports } from "@/src/app/api/logs/archive";
import { getVaultInjectionReport } from "@/src/lib/vault-logic";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const latestReportFile = join(process.cwd(), "public", "latest_report.txt");

export async function POST() {
  try {
    const injection = getVaultInjectionReport();
    const report = [
      injection.status,
      `ACTIVE ASSETS: ${injection.activeAssets}`,
      `ACTIVE KEY VALVES: ${injection.activeKeys}/${injection.keys.length}`,
      "PLASMA CORE: NEON BLUE | CHRONOS: HISTORY POINT 7",
      `INJECTION SYNC: ${new Date().toISOString()}`,
    ].join("\n");

    await writeFile(latestReportFile, report, "utf8");
    const archived = await archiveLatestReport();
    const historyPoints = await listArchivedReports(20);

    return NextResponse.json({
      status: "injected",
      report,
      keys: injection.keys,
      activeAssets: injection.activeAssets,
      activeKeys: injection.activeKeys,
      archived,
      historyPoint: historyPoints.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Vault injection failed." },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const injection = getVaultInjectionReport();

    return NextResponse.json({
      status: "ready",
      keys: injection.keys,
      activeAssets: injection.activeAssets,
      activeKeys: injection.activeKeys,
    });
  } catch {
    return NextResponse.json(
      { error: "Vault status failed." },
      { status: 500 },
    );
  }
}
