import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import { GetMarketingDashboardInputSchema, type GetMarketingDashboardInput } from "../schemas/get_marketing_dashboard.js";

export function registerGetMarketingDashboardTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_marketing_dashboard",
    {
      title: "Get marketing dashboard overview",
      description: `Retrieve the marketing overview for your Brixus account.

Returns:
  - \`totalMessagesSent\`: every email address the account has ever sent to (campaigns, automations and API emails), counted per address the way credits and quota count them. Failed sends are not included.
  - \`totalCampaigns\` and \`recentCampaigns\` (the five newest campaigns).
  - \`current\` and \`previous\`: campaign and automation sends in the last 30 days and the 30 days before, on the account's time zone (\`timezone\`). Each has \`sent\`, sends by channel and source, and for email \`emailDelivered\`, \`emailUniqueOpens\`, \`emailUniqueClicks\` and \`emailUnsubscribes\`. API emails are not in these; use \`brixus_get_email_analytics\` for them.
  - \`daily\`: sends per day by channel over the current 30 days.

No rates are returned; divide the counts if you need one.

Requires \`marketing:read\` or \`marketing:write\` API key scope (Pro/Enterprise tier only).`,
      inputSchema: GetMarketingDashboardInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (_params: GetMarketingDashboardInput) => {
      try {
        const result = await client.getMarketingDashboard();
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
