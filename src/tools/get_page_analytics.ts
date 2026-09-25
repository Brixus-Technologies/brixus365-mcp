import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  GetPageAnalyticsInputSchema,
  type GetPageAnalyticsInput,
} from "../schemas/get_page_analytics.js";

export function registerGetPageAnalyticsTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_page_analytics",
    {
      title: "Get page analytics",
      description: `Get view and form-conversion analytics for a landing page.

Returns \`views\` (from the page's view counter), \`formSubmissions\`, and
\`conversionRate\`. Note: \`formSubmissions\` is deferred to a future beacon
infrastructure release and currently always returns 0, so
\`conversionRate\` will read as 0 until that ships -- \`views\` is accurate
today.

Requires \`pages:read\` or \`pages:write\` API key scope (Free tier and above).
Use \`brixus_list_pages\` to discover page IDs.`,
      inputSchema: GetPageAnalyticsInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: GetPageAnalyticsInput) => {
      try {
        const result = await client.getPageAnalytics(params.page_id);
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
