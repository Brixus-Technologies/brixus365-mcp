import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  ListRecipientGroupsInputSchema,
  type ListRecipientGroupsInput,
} from "../schemas/list_recipient_groups.js";

export function registerListRecipientGroupsTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_list_recipient_groups",
    {
      title: "List recipient (contact) groups",
      description: `Browse static recipient groups / contact lists in your Brixus account.

Returns a paginated list with each group's name, description, and
member count. Use group IDs with \`brixus_get_recipient_group\` or as
\`recipientGroupIds\` when creating a campaign.

Requires \`contacts:read\` API key scope.`,
      inputSchema: ListRecipientGroupsInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: ListRecipientGroupsInput) => {
      try {
        const result = await client.listRecipientGroups({
          ...(params.page !== undefined && { page: params.page }),
          ...(params.limit !== undefined && { limit: params.limit }),
          ...(params.search && { search: params.search }),
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
