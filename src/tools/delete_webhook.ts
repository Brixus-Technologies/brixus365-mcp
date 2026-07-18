import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { DeleteWebhookInputSchema, type DeleteWebhookInput } from "../schemas/delete_webhook.js";

export function registerDeleteWebhookTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_delete_webhook",
    {
      title: "Delete webhook subscription",
      description: `Permanently delete a webhook subscription. This also deletes all
associated delivery history. This action cannot be undone.

Requires \`webhooks:manage\` API key scope (Pro/Enterprise only).`,
      inputSchema: DeleteWebhookInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: DeleteWebhookInput) => {
      try {
        await client.deleteWebhook(params.subscription_id);
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ success: true, message: "Webhook subscription deleted." }, null, 2),
          }],
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
