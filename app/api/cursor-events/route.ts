import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";

type CursorEvent = {
  id?: string;
  createdAt?: string;
  source?: string;
  project?: string;
  payload?: unknown;
};

const logDir = join(process.cwd(), ".cursor", "logs");
const logFile = join(logDir, "cursor-events-api.jsonl");
const localHookLogFile = join(logDir, "cursor-events.jsonl");

function isAuthorized(request: NextRequest): boolean {
  const expectedToken = process.env.CURSOR_EVENTS_API_KEY;

  if (!expectedToken) {
    return true;
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${expectedToken}`;
}

function normalizeEvent(event: CursorEvent): Required<CursorEvent> {
  return {
    id: event.id ?? crypto.randomUUID(),
    createdAt: event.createdAt ?? new Date().toISOString(),
    source: event.source ?? "cursor",
    project: event.project ?? "BAZ_OS_2026/my-app",
    payload: event.payload ?? {},
  };
}

async function readEventsFromFile(filePath: string): Promise<Required<CursorEvent>[]> {
  try {
    const content = await readFile(filePath, "utf8");

    return content
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Required<CursorEvent>);
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const [apiEvents, hookEvents] = await Promise.all([
      readEventsFromFile(logFile),
      readEventsFromFile(localHookLogFile),
    ]);

    const events = [...apiEvents, ...hookEvents]
      .sort((first, second) => {
        return (
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
        );
      })
      .slice(0, 50);

    return NextResponse.json({
      ok: true,
      count: events.length,
      events,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown cursor event read error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized cursor event request" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as CursorEvent;
    const event = normalizeEvent(body);

    await mkdir(logDir, { recursive: true });
    await appendFile(logFile, `${JSON.stringify(event)}\n`, "utf8");

    return NextResponse.json({
      ok: true,
      eventId: event.id,
      message: "Cursor event received",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown cursor event processing error",
      },
      { status: 500 },
    );
  }
}
