import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  GetFormAnalyticsInputSchema,
  type GetFormAnalyticsInput,
} from "../schemas/get_form_analytics.js";

export function registerGetFormAnalyticsTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_form_analytics",
    {
      title: "Get form analytics",
      description: `Get view/submission counters and a paginated list of recent
submissions for a form.

Returns \`views\`, \`submissions\`, \`conversionRate\` (submissions / views,
0 if no views), and \`recentSubmissions\` -- each with status,
\`resolvedEmail\`, \`resolvedName\`, and the raw \`submissionData\`. Filter
\`recentSubmissions\` by outcome with \`submission_status\`.

Requires \`forms:read\` or \`forms:write\` API key scope.
Use \`brixus_list_forms\` to discover form IDs.`,
      inputSchema: GetFormAnalyticsInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: GetFormAnalyticsInput) => {
      try {
        const result = await client.getFormAnalytics(params.form_id, {
          ...(params.page !== undefined && { page: params.page }),
          ...(params.limit !== undefined && { limit: params.limit }),
          ...(params.submission_status && { submission_status: params.submission_status }),
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
