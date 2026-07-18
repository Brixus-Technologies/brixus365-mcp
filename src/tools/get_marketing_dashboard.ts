import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import { GetMarketingDashboardInputSchema, type GetMarketingDashboardInput } from "../schemas/get_marketing_dashboard.js";

export function registerGetMarketingDashboardTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_marketing_dashboard",
    {
      title: "Get marketing dashboard overview",
      description: `Retrieve overview marketing analytics for your Brixus account.

Returns aggregate stats such as total emails sent, open rate, click rate,
bounce rate, and recent campaign performance.

Requires \`marketing:read\` or \`marketing:write\` API key scope (Pro/Enterprise tier only).`,
      inputSchema: GetMarketingDashboardInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (_params: GetMarketingDashboardInput) => {
      try {
        const result = await client.getMarketingDashboard();
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
