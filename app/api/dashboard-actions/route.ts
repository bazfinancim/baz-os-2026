import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";

type DashboardAction = {
  id?: string;
  createdAt?: string;
  action: string;
  label?: string;
  status?: string;
  target?: string;
  metadata?: Record<string, unknown>;
};

const logDir = join(process.cwd(), ".cursor", "logs");
const actionLogFile = join(logDir, "dashboard-actions.jsonl");

function normalizeAction(action: DashboardAction): Required<DashboardAction> {
  return {
    id: action.id ?? crypto.randomUUID(),
    createdAt: action.createdAt ?? new Date().toISOString(),
    action: action.action,
    label: action.label ?? action.action,
    status: action.status ?? "logged",
    target: action.target ?? "",
    metadata: action.metadata ?? {},
  };
}

async function readActions(): Promise<Required<DashboardAction>[]> {
  try {
    const content = await readFile(actionLogFile, "utf8");
    return content
      .split("\n")
      .filter(Boolean)
      .map((line) => normalizeAction(JSON.parse(line) as DashboardAction))
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime(),
      )
      .slice(0, 50);
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const actions = await readActions();
    return NextResponse.json({ ok: true, count: actions.length, actions });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unknown action read error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DashboardAction;

    if (!body.action) {
      return NextResponse.json(
        { ok: false, error: "Missing action name" },
        { status: 400 },
      );
    }

    const action = normalizeAction(body);
    await mkdir(logDir, { recursive: true });
    await appendFile(actionLogFile, `${JSON.stringify(action)}\n`, "utf8");

    return NextResponse.json({ ok: true, action });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unknown action write error",
      },
      { status: 500 },
    );
  }
}
