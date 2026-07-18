import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { SendCampaignInputSchema, type SendCampaignInput } from "../schemas/send_campaign.js";

export function registerSendCampaignTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_send_campaign",
    {
      title: "Send a campaign",
      description: `Queue a draft campaign for sending to its recipients now.

This is irreversible once dispatch begins — recipients cannot be un-sent to.
Use \`brixus_send_campaign_test\` first to preview delivery to a test address,
and \`brixus_pause_campaign\` if you need to halt a send in progress.

Requires \`marketing:write\` API key scope (Pro/Enterprise tier only).
Use \`brixus_list_campaigns\` to discover campaign IDs.`,
      inputSchema: SendCampaignInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: SendCampaignInput) => {
      try {
        const result = await client.sendCampaign(params.campaign_id);
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
