import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { PauseWorkflowInputSchema, type PauseWorkflowInput } from "../schemas/pause_workflow.js";

export function registerPauseWorkflowTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_pause_workflow",
    {
      title: "Pause an active workflow",
      description: `Temporarily pause an active workflow. Enrolled contacts stay enrolled
and resume from where they left off when the workflow is reactivated
via the Brixus dashboard.

Requires \`workflows:manage\` API key scope (Pro/Enterprise tier only).
Use \`brixus_list_workflows\` to discover workflow IDs.`,
      inputSchema: PauseWorkflowInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: PauseWorkflowInput) => {
      try {
        const result = await client.pauseWorkflow(params.workflow_id);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: mapToolErrorMessage(error) }],
          isError: true,
        };
      }
    },
  );
}
