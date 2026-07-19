import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  DeactivateWorkflowInputSchema,
  type DeactivateWorkflowInput,
} from "../schemas/deactivate_workflow.js";

export function registerDeactivateWorkflowTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_deactivate_workflow",
    {
      title: "Permanently stop a workflow",
      description: `Permanently stop a workflow. This is a terminal state — unlike pause,
a deactivated workflow cannot be resumed; a new workflow must be created
to run the automation again.

Requires \`workflows:manage\` API key scope (Pro/Enterprise tier only).
Use \`brixus_list_workflows\` to discover workflow IDs.`,
      inputSchema: DeactivateWorkflowInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: DeactivateWorkflowInput) => {
      try {
        const result = await client.deactivateWorkflow(params.workflow_id);
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
