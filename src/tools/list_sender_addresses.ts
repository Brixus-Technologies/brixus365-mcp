import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import { ListSenderAddressesInputSchema, type ListSenderAddressesInput } from "../schemas/list_sender_addresses.js";

export function registerListSenderAddressesTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_list_sender_addresses",
    {
      title: "List sender addresses",
      description: `List verified sender addresses configured in your Brixus account.

Returns each sender's email address, display name, verification status,
associated domain, and whether it's the default sender. Use a sender's
ID when creating a campaign that needs a non-default "from" address.

Requires \`senders:read\` API key scope (all tiers).`,
      inputSchema: ListSenderAddressesInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (_params: ListSenderAddressesInput) => {
      try {
        const result = await client.listSenderAddresses();
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
