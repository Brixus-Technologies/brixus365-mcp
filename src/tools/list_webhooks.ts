import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import { ListWebhooksInputSchema, type ListWebhooksInput } from "../schemas/list_webhooks.js";

export function registerListWebhooksTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_list_webhooks",
    {
      title: "List webhook subscriptions",
      description: `List all webhook subscriptions in your Brixus account.

Returns subscription URL, event types, active status, failure counts,
and timestamps. Use subscription IDs with \`brixus_delete_webhook\` or
\`brixus_test_webhook\`.

Requires \`webhooks:read\` or \`webhooks:manage\` API key scope (Pro/Enterprise only).`,
      inputSchema: ListWebhooksInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: ListWebhooksInput) => {
      try {
        const result = await client.listWebhooks({
          ...(params.skip !== undefined && { skip: params.skip }),
          ...(params.limit !== undefined && { limit: params.limit }),
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
