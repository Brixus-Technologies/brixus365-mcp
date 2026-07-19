import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  GetRevenueAttributionInputSchema,
  type GetRevenueAttributionInput,
} from "../schemas/get_revenue_attribution.js";

export function registerGetRevenueAttributionTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_revenue_attribution",
    {
      title: "Get campaign/workflow revenue attribution",
      description: `Browse orders attributed to marketing campaigns and workflows.

Returns a paginated list of attributed orders — order total, currency,
attribution type, and the campaign or workflow it's linked to. Optional
date range filters the order's attribution date.

Requires \`commerce:read\` API key scope (Pro/Enterprise tier only).`,
      inputSchema: GetRevenueAttributionInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: GetRevenueAttributionInput) => {
      try {
        const result = await client.getRevenueAttribution({
          ...(params.page !== undefined && { skip: (params.page - 1) * (params.limit ?? 20) }),
          ...(params.limit !== undefined && { limit: params.limit }),
          ...(params.date_from && { date_from: params.date_from }),
          ...(params.date_to && { date_to: params.date_to }),
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
