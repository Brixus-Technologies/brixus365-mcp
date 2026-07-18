import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import { ListEmailTemplatesInputSchema, type ListEmailTemplatesInput } from "../schemas/list_email_templates.js";

export function registerListEmailTemplatesTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_list_email_templates",
    {
      title: "List email templates",
      description: `Browse your saved email templates in Brixus.

Returns a paginated list of templates with name, subject, category,
variables, and timestamps. Use template IDs with \`brixus_send_email\`
(via \`template_id\`) or \`brixus_get_email_template\` for full details.

Requires \`templates:read\` or \`templates:write\` API key scope (Free tier and above).`,
      inputSchema: ListEmailTemplatesInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: ListEmailTemplatesInput) => {
      try {
        const result = await client.listTemplates({
          ...(params.skip !== undefined && { skip: params.skip }),
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
