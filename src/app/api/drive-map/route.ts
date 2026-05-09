import { NextResponse } from "next/server";
import { discoverBazProjectsRoot, summarizeDriveMapping } from "@/src/lib/drive-mapper";
import { readDbWithRecovery } from "@/src/lib/db-manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ProjectRecord = {
  id: string;
  name: string;
};

type EmpireDb = {
  projects: ProjectRecord[];
};

export async function GET() {
  try {
    const db = await readDbWithRecovery<EmpireDb>();
    const projects = db.projects.slice(0, 70);
    const tree = discoverBazProjectsRoot(projects);
    const summary = summarizeDriveMapping(tree);

    return NextResponse.json({
      status: summary.isReady ? "SYNCED" : "PENDING",
      tree,
      summary,
    });
  } catch {
    return NextResponse.json(
      { error: "Drive mapping failed." },
      { status: 500 },
    );
  }
}
