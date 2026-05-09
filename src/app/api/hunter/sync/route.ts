import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type HunterSyncPayload = {
  source?: string;
  companyName?: string;
  creditAmount?: string;
  status?: string;
  apiKeyMasked?: string;
  action?: "claim-api-key" | "base44-webhook" | "sync";
  metadata?: Record<string, unknown>;
};

function maskKey(value: string) {
  if (!value.trim()) {
    return "missing";
  }

  return `${"*".repeat(12)}${value.slice(-4)}`;
}

export async function GET() {
  const base44Key = process.env.BASE44_API_KEY ?? "";

  return NextResponse.json({
    status: "ready",
    endpoint: "/api/hunter/sync",
    accepts: "Base44 Hunter bot webhooks",
    base44: {
      connected: base44Key.trim().length > 10,
      key: maskKey(base44Key),
    },
    counters: {
      creditsBurnedThisMonth: "8.8k / 50k",
      integrations: "400 / 1200",
    },
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as HunterSyncPayload;
    const receivedAt = new Date().toISOString();
    const base44Key = process.env.BASE44_API_KEY ?? "";
    const source = payload.source ?? "base44-hunter";
    const action = payload.action ?? (source === "ui-claim" ? "claim-api-key" : "base44-webhook");

    return NextResponse.json({
      status: "accepted",
      receivedAt,
      base44Connected: base44Key.trim().length > 10,
      vaultQueue:
        action === "claim-api-key"
          ? "BAZ Vault claim queue accepted"
          : "BAZ Vault intake pending",
      payload: {
        action,
        source,
        companyName: payload.companyName ?? "Unknown Company",
        creditAmount: payload.creditAmount ?? "Unknown",
        status: payload.status ?? "Pending Review",
        apiKeyMasked: payload.apiKeyMasked ?? "********",
        metadata: payload.metadata ?? {},
      },
    });
  } catch {
    return NextResponse.json(
      { status: "rejected", error: "Invalid Hunter sync payload." },
      { status: 400 },
    );
  }
}
