import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import { ListContactsInputSchema, type ListContactsInput } from "../schemas/list_contacts.js";

export function registerListContactsTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_list_contacts",
    {
      title: "List contacts",
      description: `Browse and filter contacts in your Brixus audience.

Returns a paginated list of contacts with email, name, subscription status,
groups, tags, and engagement data. Use this to discover contact IDs for
\`brixus_get_contact\`.

Requires \`contacts:read\` or \`contacts:write\` API key scope (Free tier and above).

Filter options: search (email/name), subscription status.
Sort by created_at, email, or name.`,
      inputSchema: ListContactsInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: ListContactsInput) => {
      try {
        const result = await client.listContacts({
          ...(params.page !== undefined && { page: params.page }),
          ...(params.limit !== undefined && { limit: params.limit }),
          ...(params.search && { search: params.search }),
          ...(params.status && { status: params.status }),
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
