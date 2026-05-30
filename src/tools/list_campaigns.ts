import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import { ListCampaignsInputSchema, type ListCampaignsInput } from "../schemas/list_campaigns.js";

export function registerListCampaignsTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_list_campaigns",
    {
      title: "List marketing campaigns",
      description: `Browse and filter marketing campaigns in your Brixus account.

Returns a paginated list of campaigns with status, channel, recipient count,
and sent count. Use this to discover campaign IDs for \`brixus_send_campaign_test\`
or \`brixus_get_campaign\`.

Requires \`marketing:read\` or \`marketing:write\` API key scope (Pro/Enterprise tier only).

Filter options: status, channel, name search.
Sort by created_at, scheduled_at, name, or status.`,
      inputSchema: ListCampaignsInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: ListCampaignsInput) => {
      try {
        const result = await client.listCampaigns({
          ...(params.page !== undefined && { page: params.page }),
          ...(params.limit !== undefined && { limit: params.limit }),
          ...(params.status && { status: params.status }),
          ...(params.channel && { channel: params.channel }),
          ...(params.search && { search: params.search }),
          ...(params.sort_by && { sort_by: params.sort_by }),
          ...(params.sort_order && { sort_order: params.sort_order }),
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
