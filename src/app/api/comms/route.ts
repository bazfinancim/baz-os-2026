import { NextRequest, NextResponse } from "next/server";

declare global {
  // eslint-disable-next-line no-var
  var __waCommsLog: Array<{
    id: string;
    source: "marketing" | "office" | "unknown";
    from: string;
    body: string;
    timestamp: string;
    status: "received" | "read" | "replied";
  }>;
}

// GET /api/comms?source=marketing&limit=50
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const source = searchParams.get("source");
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

  const log = globalThis.__waCommsLog ?? [];
  const filtered = source ? log.filter((e) => e.source === source) : log;

  return NextResponse.json({
    ok: true,
    total: log.length,
    messages: filtered.slice(0, limit),
    sources: {
      marketing: log.filter((e) => e.source === "marketing").length,
      office: log.filter((e) => e.source === "office").length,
      unknown: log.filter((e) => e.source === "unknown").length,
    },
  });
}

// PATCH /api/comms — mark message as read/replied
export async function PATCH(req: NextRequest) {
  const { id, status } = (await req.json()) as { id: string; status: string };
  const log = globalThis.__waCommsLog ?? [];
  const msg = log.find((e) => e.id === id);
  if (msg) msg.status = status as "read" | "replied";
  return NextResponse.json({ ok: true });
}
