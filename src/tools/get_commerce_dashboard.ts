import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  GetCommerceDashboardInputSchema,
  type GetCommerceDashboardInput,
} from "../schemas/get_commerce_dashboard.js";

export function registerGetCommerceDashboardTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_commerce_dashboard",
    {
      title: "Get commerce revenue dashboard",
      description: `Retrieve the commerce KPI overview: total revenue, order count,
average order value, synced customer/product counts, recent orders,
and Shopify sync status.

Returns zeros and \`shopifyConnected: false\` when no Shopify store is
connected yet, rather than an error.

Requires \`commerce:read\` API key scope (Pro/Enterprise tier only).`,
      inputSchema: GetCommerceDashboardInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (_params: GetCommerceDashboardInput) => {
      try {
        const result = await client.getCommerceDashboard();
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
