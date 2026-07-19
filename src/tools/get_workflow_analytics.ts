import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  GetWorkflowAnalyticsInputSchema,
  type GetWorkflowAnalyticsInput,
} from "../schemas/get_workflow_analytics.js";

export function registerGetWorkflowAnalyticsTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_workflow_analytics",
    {
      title: "Get workflow performance analytics",
      description: `Retrieve enrollment, completion, and conversion stats for a workflow,
plus per-step execution breakdowns (completed/skipped/failed counts and
average duration).

Requires \`workflows:read\` or \`workflows:manage\` API key scope (Pro/Enterprise tier only).
Use \`brixus_list_workflows\` to discover workflow IDs.`,
      inputSchema: GetWorkflowAnalyticsInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: GetWorkflowAnalyticsInput) => {
      try {
        const result = await client.getWorkflowAnalytics(params.workflow_id);
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
