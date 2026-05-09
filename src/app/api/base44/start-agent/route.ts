import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { NextResponse } from "next/server";
import { uploadBazOsLogToDrive } from "@/src/lib/google-drive-logger";
import { getLeastCostRoutingPlan } from "@/src/lib/vault-manager";
import { triggerN8NWorkflow } from "@/src/lib/n8n-workflow-trigger";

type StartAgentRequest = {
  toolId?: string;
  toolName?: string;
  category?: string;
  companyId?: string;
  companyName?: string;
  scanType?: string;
  identity?: "BAZ SPACE" | "DOLPHIN";
};

const agentLogFile = join(process.cwd(), ".cursor", "logs", "base44-agent-commands.jsonl");

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as StartAgentRequest;
    const toolName = body.toolName?.trim() || "Base44 Hunter Agent";
    const routingPlan = getLeastCostRoutingPlan();
    const command = {
      createdAt: new Date().toISOString(),
      source: "BAZ_OS_BASE44_HUNTER_HUB",
      action: "START_AGENT",
      status: "ACTIVE",
      toolId: body.toolId ?? "unknown-tool",
      toolName,
      category: body.category ?? "Base44 Hunter",
      companyId: body.companyId ?? "unknown-company",
      companyName: body.companyName ?? "BAZ Empire",
      scanType: body.scanType ?? "Company Intelligence Scan",
      identity: body.identity ?? "BAZ SPACE",
      routing: routingPlan,
    };

    await mkdir(dirname(agentLogFile), { recursive: true });
    await appendFile(agentLogFile, `${JSON.stringify(command)}\n`, "utf8");

    const workflowStatus = await triggerN8NWorkflow({
      workflow: body.category ?? "BAZ Hunter Factory",
      action: "START_AGENT",
      source: "BAZ_OS_HUNTER_HUB",
      payload: command,
    });
    const n8nStatus = await uploadBazOsLogToDrive(
      `base44_agent_${command.createdAt}.json`,
      JSON.stringify(command, null, 2),
    );

    return NextResponse.json({
      ok: true,
      command,
      n8nStatus,
      workflowStatus,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown start agent error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
