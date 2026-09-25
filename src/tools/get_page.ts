import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { GetPageInputSchema, type GetPageInput } from "../schemas/get_page.js";

export function registerGetPageTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_page",
    {
      title: "Get page details",
      description: `Retrieve full details for a specific landing page by ID.

Returns the page's status, slug, public URL, full Puck content tree
(\`puckData\`, and \`publishedData\` if it has been published), settings
(SEO, branding, embedded forms), view count, and whether the draft has
unpublished changes relative to the live version.

Requires \`pages:read\` or \`pages:write\` API key scope (Free tier and above).
Use \`brixus_list_pages\` to discover page IDs.`,
      inputSchema: GetPageInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: GetPageInput) => {
      try {
        const result = await client.getPage(params.page_id);
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
