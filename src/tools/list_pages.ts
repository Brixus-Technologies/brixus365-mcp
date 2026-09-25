import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import { ListPagesInputSchema, type ListPagesInput } from "../schemas/list_pages.js";

export function registerListPagesTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_list_pages",
    {
      title: "List landing pages",
      description: `Browse and filter landing pages in your Brixus account.

Returns a paginated list of pages with status, slug, view count, and a
rendered HTML preview (\`previewHtml\`) in place of the full content tree --
list rows omit \`puckData\`/\`publishedData\` entirely (those are only
returned by \`brixus_get_page\`). Use this to discover page IDs for
\`brixus_get_page\` or \`brixus_get_page_analytics\`.

Requires \`pages:read\` or \`pages:write\` API key scope (Free tier and above).

Filter options: status, name search.
Sort by created_at, updated_at, name, view_count, or status.`,
      inputSchema: ListPagesInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: ListPagesInput) => {
      try {
        const result = await client.listPages({
          ...(params.page !== undefined && { page: params.page }),
          ...(params.limit !== undefined && { limit: params.limit }),
          ...(params.search && { search: params.search }),
          ...(params.sort_by && { sort_by: params.sort_by }),
          ...(params.sort_order && { sort_order: params.sort_order }),
          ...(params.status && { status: params.status }),
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
