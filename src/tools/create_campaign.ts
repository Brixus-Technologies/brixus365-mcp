import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { CreateCampaignInputSchema, type CreateCampaignInput } from "../schemas/create_campaign.js";

export function registerCreateCampaignTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_create_campaign",
    {
      title: "Create a marketing campaign",
      description: `Create a new marketing campaign.

A campaign created with \`recipient_group_ids\` lands ready to send; one
created without an audience stays a draft. Either way it is not sent
immediately — use \`brixus_send_campaign\` to dispatch it, or pass
\`scheduled_at\` to queue it for a future time.

The sender defaults to the tenant's default marketing sender. Pass
\`sender_address_id\` to choose a specific verified sender
(\`brixus_list_sender_addresses\` lists them).

Requires \`marketing:write\` API key scope (Pro/Enterprise tier only).`,
      inputSchema: CreateCampaignInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: CreateCampaignInput) => {
      try {
        const result = await client.createCampaign({
          name: params.name,
          channel: params.channel,
          ...(params.template_id && { template_id: params.template_id }),
          ...(params.recipient_group_ids && { recipient_group_ids: params.recipient_group_ids }),
          ...(params.sender_address_id && { sender_address_id: params.sender_address_id }),
          ...(params.scheduled_at && { scheduled_at: params.scheduled_at }),
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
