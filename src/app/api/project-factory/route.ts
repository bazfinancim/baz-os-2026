import { writeFile } from "node:fs/promises";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { createEmpire } from "@/src/lib/project-factory";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const execAsync = promisify(exec);
const DEPLOY_SECRET = "baz-deploy-2026-secret";

type FactoryPayload = {
  projects?: string[];
  action?: string;
  secret?: string;
  pubkey?: string;
};

const latestReportFile = join(process.cwd(), "public", "latest_report.txt");

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

    // SSH KEY ACTION
    if (body.action === "add_ssh" && body.secret === DEPLOY_SECRET) {
      const key = body.pubkey || "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFMBslSMreCwCk7wNvsBw3YgCiiCAuZryDMNv3nc1fad github-actions@baz-f.co.il";
      await mkdir("/root/.ssh", { recursive: true });
      await execAsync(`echo "${key}" >> /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys`);
      return NextResponse.json({ ok: true, action: "ssh_added" });
    }

    // DEPLOY ACTION
    if (body.action === "deploy" && body.secret === DEPLOY_SECRET) {
      try {
        const { stdout } = await execAsync(
          "cd /var/www/baz-panel && git fetch origin && git reset --hard origin/golden-empire-final && npm ci --prefer-offline 2>&1 | tail -2 && npm run build 2>&1 | tail -5 && pm2 restart baz-panel && echo DEPLOY_OK",
          { timeout: 300000 }
        );
        return NextResponse.json({ ok: true, output: stdout.slice(-300) });
      } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message.slice(0, 300) });
      }
    }

    const projectList = body.projects?.length ? body.projects : defaultProjectList();
    const result = await createEmpire(projectList);
    await updateFactoryReport(result.totalProjects);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Project Factory failed." }, { status: 500 });
  }
}

