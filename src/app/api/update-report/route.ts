import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

const latestReportFile = join(process.cwd(), "public", "latest_report.txt");

type UpdateReportRequest = {
  report?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UpdateReportRequest;
    const report = body.report?.trim() || "STATUS: ONLINE | FUEL: 100% | BAZ OS RESTORED";

    await writeFile(latestReportFile, report, "utf8");

    return NextResponse.json({ ok: true, report });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to update report" },
      { status: 500 },
    );
  }
}
