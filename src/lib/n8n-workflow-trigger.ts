import { triggerApiAction, type ApiActionResult } from "@/src/lib/triggerApiAction";

export type N8NWorkflowCommand = {
  workflow: string;
  action: string;
  source: string;
  payload: Record<string, unknown>;
};

export async function triggerN8NWorkflow(command: N8NWorkflowCommand): Promise<ApiActionResult> {
  return triggerApiAction(command.action, {
    workflow: command.workflow,
    source: command.source,
    createdAt: new Date().toISOString(),
    status: "ACTIVE",
    ...command.payload,
  });
}
