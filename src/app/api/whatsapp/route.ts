import { NextResponse } from "next/server";
import { uploadBazOsLogToDrive } from "@/src/lib/google-drive-logger";
import { triggerN8NWorkflow } from "@/src/lib/n8n-workflow-trigger";

export async function GET() {
  return NextResponse.json({
    status: "active",
    agents: ["whatsapp-sales-router", "whatsapp-follow-up", "whatsapp-support-intake"],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const payload = {
      createdAt: new Date().toISOString(),
      source: "BAZ_OS_WHATSAPP_AGENT_CENTER",
      status: "active",
      ...body,
    };
    const workflowStatus = await triggerN8NWorkflow({
      workflow: String(payload.workflow ?? "BAZ WhatsApp Agent"),
      action: String(payload.action ?? "TRIGGER_AGENT"),
      source: "BAZ_OS_WHATSAPP_AGENT_CENTER",
      payload,
    });
    const n8nStatus = await uploadBazOsLogToDrive(
      `whatsapp_agent_${payload.createdAt}.json`,
      JSON.stringify(payload, null, 2),
    );

    return NextResponse.json({ status: "active", n8nStatus, workflowStatus, payload });
  } catch (error) {
    const message = error instanceof Error ? error.message : "WhatsApp agent sync failed";

    return NextResponse.json(
      { status: "failed", error: message },
      { status: 500 },
    );
  }
}
