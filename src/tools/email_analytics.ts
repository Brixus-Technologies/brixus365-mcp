import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { EmailAnalyticsInputSchema, type EmailAnalyticsInput } from "../schemas/email_analytics.js";

export function registerEmailAnalyticsTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_email_analytics",
    {
      title: "Get email sending analytics",
      description: `Retrieve aggregated sending analytics: sent, delivered, opened, clicked, bounced, failed.

Optionally filter by date range (\`from\`/\`to\`) and choose aggregation granularity:
  - \`hour\`: intraday breakdown
  - \`day\`: daily rollups (default)

Returns per-bucket data and overall totals for the window.`,
      inputSchema: EmailAnalyticsInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: EmailAnalyticsInput) => {
      try {
        const result = await client.getEmailAnalytics({
          ...(params.from && { from: params.from }),
          ...(params.to && { to: params.to }),
          ...(params.bucket && { bucket: params.bucket }),
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
