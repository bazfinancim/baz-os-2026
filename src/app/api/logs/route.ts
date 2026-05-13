import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** בסיס N8N — מפתח ב-.env.local (N8N_API_KEY), לא בקוד */
const N8N_API_DEFAULT = "https://n8n.baz-f.co.il/api/v1";

export type N8nExecutionLog = {
  id: string;
  workflowName: string;
  status: "success" | "error" | "running";
  startedAt: string;
  stoppedAt: string | null;
};

type N8nExecutionRow = {
  id?: string;
  status?: string;
  startedAt?: string;
  stoppedAt?: string | null;
  workflowId?: string;
  workflowName?: string;
  workflowData?: { name?: string };
};

function mapN8nStatus(s: string | undefined): "success" | "error" | "running" {
  if (s === "success" || s === "error" || s === "running") return s;
  if (s === "crashed" || s === "failed") return "error";
  if (s === "waiting" || s === "new" || s === "unknown") return "running";
  return "running";
}

function rowToLog(row: N8nExecutionRow): N8nExecutionLog {
  const wf =
    row.workflowName ??
    row.workflowData?.name ??
    (row.workflowId ? `Workflow ${String(row.workflowId).slice(0, 8)}…` : "Unknown workflow");
  return {
    id: String(row.id ?? ""),
    workflowName: wf,
    status: mapN8nStatus(row.status),
    startedAt: row.startedAt ?? new Date(0).toISOString(),
    stoppedAt: row.stoppedAt ?? null,
  };
}

export async function GET() {
  const n8nBase = (process.env.N8N_API_BASE ?? N8N_API_DEFAULT).replace(/\/$/, "");
  const n8nKey = process.env.N8N_API_KEY ?? "";

  if (!n8nKey) {
    return NextResponse.json(
      { logs: [] as N8nExecutionLog[], error: "N8N_API_KEY חסר ב-.env.local" },
      { status: 200 },
    );
  }

  const url = `${n8nBase}/executions?limit=20&includeData=false`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-N8N-API-KEY": n8nKey,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json(
        {
          logs: [] as N8nExecutionLog[],
          error: `N8N HTTP ${res.status}: ${errText.slice(0, 200)}`,
        },
        { status: 200 },
      );
    }

    const json = (await res.json()) as { data?: N8nExecutionRow[] };
    const rows = Array.isArray(json.data) ? json.data : [];
    const logs = rows.map(rowToLog);

    return NextResponse.json({ logs });
  } catch (e) {
    const message = e instanceof Error ? e.message : "שגיאה לא ידועה";
    return NextResponse.json(
      { logs: [] as N8nExecutionLog[], error: message },
      { status: 200 },
    );
  }
}
