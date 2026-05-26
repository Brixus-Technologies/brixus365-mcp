import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { GetCampaignInputSchema, type GetCampaignInput } from "../schemas/get_campaign.js";

export function registerGetCampaignTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_campaign",
    {
      title: "Get campaign details",
      description: `Retrieve full details for a specific marketing campaign by ID.

Returns campaign status, channel, subject, recipient count, sent count,
scheduled time, and other metadata.

Requires \`campaigns:read\` API key scope (Pro/Enterprise tier only).
Use \`brixus_list_campaigns\` to discover campaign IDs.`,
      inputSchema: GetCampaignInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: GetCampaignInput) => {
      try {
        const result = await client.getCampaign(params.campaign_id);
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
