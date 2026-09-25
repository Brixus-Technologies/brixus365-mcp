import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { CreatePageInputSchema, type CreatePageInput } from "../schemas/create_page.js";

export function registerCreatePageTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_create_page",
    {
      title: "Create a landing page from a template",
      description: `Create a new landing page by cloning a page template.

This is template-only creation, by design: an API key may send only
\`name\` and \`templateId\` -- a raw Puck content tree (\`puckData\`/
\`settings\`) is not accepted from API-key callers, and the call fails with
a 400 if you try to send either. Use \`brixus_list_page_templates\` first to
discover a valid \`templateId\` (check \`hasFormSection\` there if you want
a page that's publishable without further editing).

The created page is always a DRAFT. There is no API-key path to publish a
page or to replace its content with custom HTML/Puck data -- both require
signing in to the Brixus365 web editor, where a template's attached form
(if \`hasFormSection\` was true) also gets wired up.

Requires \`pages:write\` API key scope (Free tier and above; implies read).`,
      inputSchema: CreatePageInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: CreatePageInput) => {
      try {
        const result = await client.createPage({
          name: params.name,
          template_id: params.template_id,
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
