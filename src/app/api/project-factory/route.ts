import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { createEmpire } from "@/src/lib/project-factory";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type FactoryPayload = {
  projects?: string[];
};

const latestReportFile = join(process.cwd(), "public", "latest_report.txt");

function defaultProjectList() {
  return Array.from({ length: 70 }, (_, index) => {
    const number = index + 1;

    if (number % 5 === 0) {
      return `Finance Invoice Automation ${number}`;
    }

    if (number % 4 === 0) {
      return `SEO Organic Forge ${number}`;
    }

    if (number % 3 === 0) {
      return `Meta Marketing Campaign ${number}`;
    }

    if (number % 2 === 0) {
      return `WhatsApp Bot Automation ${number}`;
    }

    return `Website Asset Project ${number}`;
  });
}

async function updateFactoryReport(totalProjects: number) {
  await writeFile(
    latestReportFile,
    [
      "ALL SYSTEMS STABILIZED. ARCHITECTURE 100% COMPLETE. WAITING FOR DATA INJECTION.",
      "PROJECT FACTORY: READY | PROTECTION STATUS: LOCKED",
      `RADAR NODES READY: ${totalProjects}`,
      `BIG BANG SYNC: ${new Date().toISOString()}`,
    ].join("\n"),
    "utf8",
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as FactoryPayload;
    const projectList = body.projects?.length ? body.projects : defaultProjectList();
    const result = await createEmpire(projectList);

    await updateFactoryReport(result.totalProjects);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Project Factory failed." },
      { status: 500 },
    );
  }
}
