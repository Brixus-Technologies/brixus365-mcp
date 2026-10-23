import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { UpdateCampaignInputSchema, type UpdateCampaignInput } from "../schemas/update_campaign.js";

export function registerUpdateCampaignTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_update_campaign",
    {
      title: "Update a marketing campaign",
      description: `Update settings on an existing draft or ready campaign.

Only fields you provide are changed — omitted fields are left as-is.
Passing \`scheduled_at\` on a ready campaign schedules it. A campaign that is
already scheduled cannot be updated here: use \`brixus_reschedule_campaign\`
to move its send time or \`brixus_cancel_scheduled_campaign\` to unschedule it.
Campaigns that are sending or completed cannot be updated.

Requires \`marketing:write\` API key scope (Pro/Enterprise tier only).
Use \`brixus_list_campaigns\` to discover campaign IDs.`,
      inputSchema: UpdateCampaignInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: UpdateCampaignInput) => {
      try {
        const result = await client.updateCampaign(params.campaign_id, {
          ...(params.name !== undefined && { name: params.name }),
          ...(params.template_id !== undefined && { template_id: params.template_id }),
          ...(params.recipient_group_ids !== undefined && { recipient_group_ids: params.recipient_group_ids }),
          ...(params.scheduled_at !== undefined && { scheduled_at: params.scheduled_at }),
        });
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
