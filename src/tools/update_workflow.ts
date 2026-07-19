import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  UpdateWorkflowInputSchema,
  type UpdateWorkflowInput,
} from "../schemas/update_workflow.js";

export function registerUpdateWorkflowTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_update_workflow",
    {
      title: "Update workflow",
      description: `Update name/description/trigger/budget fields on an existing workflow.

Draft workflows can have trigger_type/trigger_config changed; active/paused workflows may only allow budget updates -- the backend enforces this and will return a clear error if a field can't be changed in the current status.

Requires \`workflows:write\` API key scope (Pro/Enterprise tier only).`,
      inputSchema: UpdateWorkflowInputSchema,
      annotations: {
        readOnlyHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: UpdateWorkflowInput) => {
      try {
        const { workflow_id, ...updates } = params;
        const result = await client.updateWorkflow(workflow_id, updates);
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
