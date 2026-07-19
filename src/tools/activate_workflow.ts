import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  ActivateWorkflowInputSchema,
  type ActivateWorkflowInput,
} from "../schemas/activate_workflow.js";

export function registerActivateWorkflowTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_activate_workflow",
    {
      title: "Activate a draft workflow",
      description: `Validate a draft workflow's step graph and activate it so it starts
enrolling contacts.

Requires \`workflows:manage\` API key scope (Pro/Enterprise tier only).
Use \`brixus_list_workflows\` to discover workflow IDs.`,
      inputSchema: ActivateWorkflowInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ActivateWorkflowInput) => {
      try {
        const result = await client.activateWorkflow(params.workflow_id);
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
