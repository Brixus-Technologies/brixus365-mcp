import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { EmailAnalyticsInputSchema, type EmailAnalyticsInput } from "../schemas/email_analytics.js";

export function registerEmailAnalyticsTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_email_analytics",
    {
      title: "Get email sending analytics",
      description: `Retrieve sending analytics for transactional emails sent through the API, over a window.

Totals for the window:
  - \`totalSent\`: emails the sending provider accepted, counted on their To recipients. This is the app's Total Sent.
  - \`otherRecipients\`: the CC, BCC and additional To addresses of those emails that were also accepted (the app's "+N"). \`totalSent + otherRecipients\` is every address emailed, which equals the credits used and the app's Overview Sent.
  - \`totalFailed\`: emails that were refused and never sent. They are not charged.
  - \`totalMessages\`: every email created in the window in any status, scheduled, cancelled and failed included. It is not a sent count.

Rates (0 to 1) are over \`totalSent\`: \`deliveryRate\` (accepted and not bounced), \`bounceRate\`, \`complaintRate\`.
\`volume\` has one entry per bucket with counts by current status (\`count\`, \`sent\` = accepted with no delivery event yet, \`delivered\`, \`bounced\`, \`complained\`, \`failed\`). \`topErrors\` lists the most common failure messages. Opens and clicks are not included.

\`from\` and \`to\` are required. \`bucket\` is \`hour\` or \`day\` (default).`,
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
