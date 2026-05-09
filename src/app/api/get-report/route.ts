export const dynamic = "force-dynamic";
export const revalidate = 0;

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { archiveLatestReport, listArchivedReports } from "@/src/app/api/logs/archive";
import { readDbWithRecovery } from "@/src/lib/db-manager";

const latestReportFile = join(process.cwd(), "public", "latest_report.txt");
const bazEyeScanUrl = "http://127.0.0.1:5055/scan";
const antiCacheHeaders = {
  "content-type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  try {
    await fetch(bazEyeScanUrl, {
      method: "POST",
      cache: "no-store",
    }).catch(() => null);

    const db = await readDbWithRecovery<{
      vault_assets?: { status?: string }[];
    }>();
    const activeAssets = (db.vault_assets ?? []).filter(
      (asset) => asset.status !== "DEPLETED",
    ).length;
    const pythonReport = await readFile(latestReportFile, "utf8");
    await archiveLatestReport().catch(() => null);
    const historyPoints = (await listArchivedReports(20).catch(() => [])).length;
    const report = [
      `VAULT SYNC COMPLETE - ${activeAssets} ASSETS ACTIVE`,
      `LOG ARCHIVING: ACTIVE | HISTORY POINTS: ${historyPoints}`,
      pythonReport,
    ].join("\n\n");

    return new NextResponse(report, {
      status: 200,
      headers: antiCacheHeaders,
    });
  } catch {
    return new NextResponse("", {
      status: 404,
      headers: antiCacheHeaders,
    });
  }
}
