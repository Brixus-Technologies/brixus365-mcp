import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import { ListSegmentsInputSchema, type ListSegmentsInput } from "../schemas/list_segments.js";

export function registerListSegmentsTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_list_segments",
    {
      title: "List audience segments",
      description: `Browse dynamic audience segments in your Brixus account.

Returns a paginated list with each segment's name, rule tree, and
cached matched-contact count. Use segment IDs with
\`brixus_get_segment\`.

Requires \`marketing:read\` API key scope (Pro/Enterprise tier only).`,
      inputSchema: ListSegmentsInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: ListSegmentsInput) => {
      try {
        const result = await client.listSegments({
          ...(params.page !== undefined && { page: params.page }),
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
