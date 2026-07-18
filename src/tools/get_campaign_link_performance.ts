import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import { GetCampaignLinkPerformanceInputSchema, type GetCampaignLinkPerformanceInput } from "../schemas/get_campaign_link_performance.js";

export function registerGetCampaignLinkPerformanceTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_campaign_link_performance",
    {
      title: "Get campaign link performance",
      description: `Retrieve per-link click data for a specific marketing campaign.

Returns each tracked link's URL along with total clicks and unique clicks,
useful for identifying which calls-to-action performed best.

Requires \`marketing:read\` or \`marketing:write\` API key scope (Pro/Enterprise tier only).
Use \`brixus_list_campaigns\` to discover campaign IDs.`,
      inputSchema: GetCampaignLinkPerformanceInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: GetCampaignLinkPerformanceInput) => {
      try {
        const result = await client.getCampaignLinkPerformance(params.campaign_id);
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
