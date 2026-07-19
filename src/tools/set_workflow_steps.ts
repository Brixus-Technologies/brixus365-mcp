import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  SetWorkflowStepsInputSchema,
  type SetWorkflowStepsInput,
} from "../schemas/set_workflow_steps.js";

export function registerSetWorkflowStepsTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_set_workflow_steps",
    {
      title: "Replace workflow steps",
      description: `Replace ALL steps on a draft (or paused) workflow in one call.

This is a bulk replace-all operation, not an incremental patch: the steps
array you provide becomes the workflow's complete, exclusive step list --
any existing steps not included are discarded.

Requires \`workflows:write\` API key scope (Pro/Enterprise tier only).`,
      inputSchema: SetWorkflowStepsInputSchema,
      annotations: {
        readOnlyHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: SetWorkflowStepsInput) => {
      try {
        const result = await client.setWorkflowSteps(params.workflow_id, params.steps);
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
