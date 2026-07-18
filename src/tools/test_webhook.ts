import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { TestWebhookInputSchema, type TestWebhookInput } from "../schemas/test_webhook.js";

export function registerTestWebhookTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_test_webhook",
    {
      title: "Send test webhook event",
      description: `Send a \`webhook.test\` event to a webhook subscription's URL.

Creates a pending delivery that will be sent by the delivery worker.
Returns the delivery record with status, attempt info, and event details.

Use this to verify your webhook endpoint is configured correctly.

Requires \`webhooks:manage\` API key scope (Pro/Enterprise only).`,
      inputSchema: TestWebhookInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: TestWebhookInput) => {
      try {
        const result = await client.testWebhook(params.subscription_id);
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
