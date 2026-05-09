import { NextResponse } from "next/server";
import { archiveLatestReport, listArchivedReports, readArchivedReport } from "@/src/app/api/logs/archive";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const fileName = url.searchParams.get("file");

    if (fileName) {
      return NextResponse.json(await readArchivedReport(fileName));
    }

    return NextResponse.json({
      reports: await listArchivedReports(20),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to read archive." },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const archived = await archiveLatestReport();
    const reports = await listArchivedReports(20);

    return NextResponse.json({
      status: "archived",
      archived,
      historyPoints: reports.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to archive report." },
      { status: 500 },
    );
  }
}
