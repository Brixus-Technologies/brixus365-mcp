import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  ListPageTemplatesInputSchema,
  type ListPageTemplatesInput,
} from "../schemas/list_page_templates.js";

export function registerListPageTemplatesTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_list_page_templates",
    {
      title: "List page templates",
      description: `Browse the page-template library used to create new landing pages.

This is THE way to discover a valid \`templateId\` for \`brixus_create_page\`
-- pages can only be created from a template via the API, never from a raw
content tree. Each entry includes \`hasFormSection\`: true means the
template ships with a form section that clones unattached, so a page
created from it cannot be published until a form is manually attached in
the Brixus365 editor. Prefer a template with \`hasFormSection: false\` when
you need a page that's publishable without further editing.

Requires \`pages:read\` or \`pages:write\` API key scope (Free tier and above).`,
      inputSchema: ListPageTemplatesInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: ListPageTemplatesInput) => {
      try {
        const result = await client.listPageTemplates({
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
