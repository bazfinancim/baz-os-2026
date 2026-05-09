import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { NextResponse } from "next/server";
import { uploadBazOsLogToDrive } from "@/src/lib/google-drive-logger";

type BrainDumpRequest = {
  notes?: string[];
  tasks?: {
    id: string;
    lane: string;
    text: string;
    done: boolean;
  }[];
};

const brainDumpLogFile = join(process.cwd(), ".cursor", "logs", "brain-dump.jsonl");

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BrainDumpRequest;
    const payload = {
      createdAt: new Date().toISOString(),
      source: "BAZ_OS_BRAIN_DUMP",
      notes: body.notes ?? [],
      tasks: body.tasks ?? [],
    };

    await mkdir(dirname(brainDumpLogFile), { recursive: true });
    await appendFile(brainDumpLogFile, `${JSON.stringify(payload)}\n`, "utf8");

    const n8nStatus = await uploadBazOsLogToDrive(
      `brain_dump_${payload.createdAt}.json`,
      JSON.stringify(payload, null, 2),
    );

    return NextResponse.json({
      ok: true,
      n8nStatus,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown brain dump sync error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
