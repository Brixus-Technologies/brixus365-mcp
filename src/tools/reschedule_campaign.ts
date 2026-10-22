import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  RescheduleCampaignInputSchema,
  type RescheduleCampaignInput,
} from "../schemas/reschedule_campaign.js";

export function registerRescheduleCampaignTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_reschedule_campaign",
    {
      title: "Reschedule a scheduled campaign",
      description: `Move a scheduled campaign to a new send time.

Only works on a campaign whose status is \`scheduled\`. The new time must be
at least 5 minutes in the future. To schedule a ready or draft campaign, use
\`brixus_update_campaign\` (with \`scheduled_at\`) or \`brixus_send_campaign\`.
To unschedule instead, use \`brixus_cancel_scheduled_campaign\`.

Requires \`marketing:write\` API key scope (Pro/Enterprise tier only).
Use \`brixus_list_campaigns\` to discover campaign IDs.`,
      inputSchema: RescheduleCampaignInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: RescheduleCampaignInput) => {
      try {
        const result = await client.rescheduleCampaign(params.campaign_id, params.scheduled_at);
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
