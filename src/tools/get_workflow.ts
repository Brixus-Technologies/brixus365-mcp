import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { GetWorkflowInputSchema, type GetWorkflowInput } from "../schemas/get_workflow.js";

export function registerGetWorkflowTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_workflow",
    {
      title: "Get workflow details",
      description: `Retrieve full details for a specific automation workflow by ID.

Returns workflow status, trigger configuration, ordered steps, budget
info, and enrollment counts.

Requires \`workflows:read\` or \`workflows:manage\` API key scope (Pro/Enterprise tier only).
Use \`brixus_list_workflows\` to discover workflow IDs.`,
      inputSchema: GetWorkflowInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: GetWorkflowInput) => {
      try {
        const result = await client.getWorkflow(params.workflow_id);
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
