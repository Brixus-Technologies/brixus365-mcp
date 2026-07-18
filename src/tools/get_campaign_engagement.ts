import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import { GetCampaignEngagementInputSchema, type GetCampaignEngagementInput } from "../schemas/get_campaign_engagement.js";

export function registerGetCampaignEngagementTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_campaign_engagement",
    {
      title: "Get campaign engagement",
      description: `Retrieve engagement breakdown for a specific marketing campaign.

Returns sent, delivered, opened, clicked, bounced, complained, and
unsubscribed counts along with their rates.

Requires \`marketing:read\` or \`marketing:write\` API key scope (Pro/Enterprise tier only).
Use \`brixus_list_campaigns\` to discover campaign IDs.`,
      inputSchema: GetCampaignEngagementInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: GetCampaignEngagementInput) => {
      try {
        const result = await client.getCampaignEngagement(params.campaign_id);
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
