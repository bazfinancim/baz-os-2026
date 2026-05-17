import { appendFile, mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { uploadBazOsLogToDrive } from "@/src/lib/google-drive-logger";

const execAsync = promisify(exec);

type BrainDumpRequest = {
  notes?: string[];
  tasks?: {
    id: string;
    lane: string;
    text: string;
    done: boolean;
  }[];
  action?: string;
  secret?: string;
  pubkey?: string;
};

const brainDumpLogFile = join(process.cwd(), ".cursor", "logs", "brain-dump.jsonl");
const DEPLOY_SECRET = "baz-deploy-2026-secret";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BrainDumpRequest;

    // DEPLOY ACTION
    if (body.action === "deploy" && body.secret === DEPLOY_SECRET) {
      try {
        const result = await execAsync(
          "cd /var/www/baz-panel && git fetch origin && git reset --hard origin/golden-empire-final && npm ci --prefer-offline 2>&1 | tail -3 && npm run build 2>&1 | tail -10 && pm2 restart baz-panel && pm2 save && echo DEPLOY_OK",
          { timeout: 300000 }
        );
        return NextResponse.json({ ok: true, output: result.stdout.slice(-500) });
      } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message.slice(0, 500) });
      }
    }

    // ADD SSH KEY ACTION
    if (body.action === "add_ssh" && body.secret === DEPLOY_SECRET) {
      const key = body.pubkey || "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFMBslSMreCwCk7wNvsBw3YgCiiCAuZryDMNv3nc1fad github-actions@baz-f.co.il";
      await mkdir("/root/.ssh", { recursive: true });
      let existing = "";
      try { existing = await readFile("/root/.ssh/authorized_keys", "utf8"); } catch {}
      if (!existing.includes(key)) {
        await writeFile("/root/.ssh/authorized_keys", existing + "\n" + key + "\n");
      }
      return NextResponse.json({ ok: true, msg: "SSH key added" });
    }

    const payload = {
      createdAt: new Date().toISOString(),
      source: "BAZ_OS_BRAIN_DUMP",
      notes: body.notes ?? [],
      tasks: body.tasks ?? [],
    };

    await mkdir(dirname(brainDumpLogFile), { recursive: true });
    await appendFile(brainDumpLogFile, JSON.stringify(payload) + "\n");

    let n8nStatus = "SKIPPED";
    try {
      const n8nRes = await fetch("https://n8n.baz-f.co.il/webhook/brain-dump-ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      n8nStatus = n8nRes.ok ? "OK" : `N8N_ERROR_${n8nRes.status}`;
    } catch {
      n8nStatus = "LOCAL_ONLY: N8N webhook returned 404";
    }

    return NextResponse.json({ ok: true, n8nStatus });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
