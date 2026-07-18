import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { CreateWebhookInputSchema, type CreateWebhookInput } from "../schemas/create_webhook.js";

export function registerCreateWebhookTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_create_webhook",
    {
      title: "Create webhook subscription",
      description: `Create a new webhook subscription to receive event notifications.

The signing secret is returned ONCE in the response and cannot be
retrieved again — save it securely. Per-tenant limit: 3 subscriptions.

Event types include: 'email.delivered', 'email.bounced', 'email.complained',
'email.opened', 'email.clicked', 'email.failed'.

Requires \`webhooks:manage\` API key scope (Pro/Enterprise only).`,
      inputSchema: CreateWebhookInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: CreateWebhookInput) => {
      try {
        const result = await client.createWebhook({
          url: params.url,
          event_types: params.event_types,
          ...(params.description && { description: params.description }),
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
