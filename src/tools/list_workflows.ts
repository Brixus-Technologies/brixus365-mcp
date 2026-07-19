import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import { ListWorkflowsInputSchema, type ListWorkflowsInput } from "../schemas/list_workflows.js";

export function registerListWorkflowsTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_list_workflows",
    {
      title: "List marketing automation workflows",
      description: `Browse and filter automation workflows in your Brixus account.

Returns a paginated list of workflows with status, trigger type, and
enrollment counts. Use this to discover workflow IDs for
\`brixus_get_workflow\` or the lifecycle tools (activate/pause/deactivate).

Requires \`workflows:read\` or \`workflows:manage\` API key scope (Pro/Enterprise tier only).`,
      inputSchema: ListWorkflowsInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: ListWorkflowsInput) => {
      try {
        const result = await client.listWorkflows({
          ...(params.page !== undefined && { page: params.page }),
          ...(params.limit !== undefined && { limit: params.limit }),
          ...(params.status && { status: params.status }),
        });
        const text = JSON.stringify(result, null, 2);
        return {
          content: [{
            type: "text" as const,
            text: text.length > CHARACTER_LIMIT
              ? text.slice(0, CHARACTER_LIMIT) + "\n... (response truncated)"
              : text,
          }],
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
