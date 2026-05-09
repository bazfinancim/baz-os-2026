import { NextResponse } from "next/server";
import { triggerN8NWorkflow, type N8NWorkflowCommand } from "@/src/lib/n8n-workflow-trigger";

export async function POST(request: Request) {
  try {
    const command = (await request.json()) as N8NWorkflowCommand;

    if (!command.workflow || !command.action || !command.source) {
      return NextResponse.json(
        { ok: false, error: "workflow, action and source are required" },
        { status: 400 },
      );
    }

    const result = await triggerN8NWorkflow(command);

    return NextResponse.json(result, { status: result.ok ? 200 : 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown N8N trigger route error";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
