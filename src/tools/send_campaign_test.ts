import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  SendCampaignTestInputSchema,
  type SendCampaignTestInput,
} from "../schemas/send_campaign_test.js";

export function registerSendCampaignTestTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_send_campaign_test",
    {
      title: "Send campaign test email",
      description: `Send a test email for a marketing campaign to 1–3 email addresses.

Renders the campaign template with smart variable defaults and delivers
to the specified test addresses. Does NOT create Message records or
affect campaign statistics — safe to call at any campaign lifecycle stage.

Requires \`marketing:write\` API key scope (Pro/Enterprise tier only).
Use \`brixus_list_campaigns\` to find campaign IDs.`,
      inputSchema: SendCampaignTestInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: SendCampaignTestInput) => {
      try {
        const result = await client.sendCampaignTest(params.campaign_id, params.test_emails);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
          structuredContent: result as unknown as Record<string, unknown>,
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
