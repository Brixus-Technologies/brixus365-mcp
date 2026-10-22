import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  CancelScheduledCampaignInputSchema,
  type CancelScheduledCampaignInput,
} from "../schemas/cancel_scheduled_campaign.js";

export function registerCancelScheduledCampaignTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_cancel_scheduled_campaign",
    {
      title: "Cancel a campaign's schedule",
      description: `Unschedule a scheduled campaign.

The campaign returns to \`draft\` and nothing is sent. Only works on a
campaign whose status is \`scheduled\`. From MCP, a cancelled campaign can't
be scheduled or sent again: create a new campaign, or use the web app. To
change the send time instead, use \`brixus_reschedule_campaign\`.

Requires \`marketing:write\` API key scope (Pro/Enterprise tier only).
Use \`brixus_list_campaigns\` to discover campaign IDs.`,
      inputSchema: CancelScheduledCampaignInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: CancelScheduledCampaignInput) => {
      try {
        const result = await client.cancelScheduledCampaign(params.campaign_id);
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
