import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { driveSafeTimestamp, uploadBazOsLogToDrive } from "@/src/lib/google-drive-logger";

type SystemReport = {
  id?: string;
  created_at?: string;
  source?: string;
  status?: string;
  summary?: string;
  errors?: string[];
  code_status?: string;
  ui_elements?: string[];
  next_action?: string;
  screenshot_path?: string;
  raw_model_output?: string;
  hebrew_log?: string;
};

const logDir = join(process.cwd(), ".cursor", "logs");
const reportLogFile = join(logDir, "system-reports.jsonl");
const bazEyeLocalFile = join(logDir, "baz-eye-reports.jsonl");

function normalizeReport(report: SystemReport): Required<SystemReport> {
  return {
    id: report.id ?? crypto.randomUUID(),
    created_at: report.created_at ?? new Date().toISOString(),
    source: report.source ?? "dashboard",
    status: report.status ?? "unknown",
    summary: report.summary ?? "No summary provided",
    errors: report.errors ?? [],
    code_status: report.code_status ?? "unknown",
    ui_elements: report.ui_elements ?? [],
    next_action: report.next_action ?? "No next action provided",
    screenshot_path: report.screenshot_path ?? "",
    raw_model_output: report.raw_model_output ?? "",
    hebrew_log: report.hebrew_log ?? "",
  };
}

async function readReports(filePath: string): Promise<Required<SystemReport>[]> {
  try {
    const content = await readFile(filePath, "utf8");
    return content
      .split("\n")
      .filter(Boolean)
      .map((line) => normalizeReport(JSON.parse(line) as SystemReport));
  } catch {
    return [];
  }
}

function reportText(report: Required<SystemReport>) {
  return [
    `SYSTEM REPORT: ${report.id}`,
    `CREATED_AT: ${report.created_at}`,
    `SOURCE: ${report.source}`,
    `STATUS: ${report.status}`,
    `CODE STATUS: ${report.code_status}`,
    "",
    `SUMMARY: ${report.summary}`,
    "",
    `ERRORS: ${report.errors.length ? report.errors.join(" | ") : "None"}`,
    `UI ELEMENTS: ${report.ui_elements.length ? report.ui_elements.join(" | ") : "None"}`,
    `NEXT ACTION: ${report.next_action}`,
    `SCREENSHOT: ${report.screenshot_path || "None"}`,
    "",
    "HEBREW LOG:",
    report.hebrew_log || "None",
    "",
    "RAW MODEL OUTPUT:",
    report.raw_model_output || "None",
  ].join("\n");
}

export async function GET() {
  try {
    const [dashboardReports, localReports] = await Promise.all([
      readReports(reportLogFile),
      readReports(bazEyeLocalFile),
    ]);

    const reports = [...dashboardReports, ...localReports]
      .sort(
        (first, second) =>
          new Date(second.created_at).getTime() -
          new Date(first.created_at).getTime(),
      )
      .slice(0, 25);

    return NextResponse.json({ ok: true, count: reports.length, reports });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown system report read error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SystemReport;
    const report = normalizeReport(body);

    await mkdir(logDir, { recursive: true });
    await appendFile(reportLogFile, `${JSON.stringify(report)}\n`, "utf8");
    const driveStatus = await uploadBazOsLogToDrive(
      `system_report_${driveSafeTimestamp(report.created_at)}.md`,
      reportText(report),
    ).catch((error) =>
      error instanceof Error ? `FAILED: ${error.message}` : "FAILED: Unknown Drive upload error",
    );

    return NextResponse.json({ ok: true, report, driveStatus });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown system report write error",
      },
      { status: 500 },
    );
  }
}
