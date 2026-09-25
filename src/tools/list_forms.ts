import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import { ListFormsInputSchema, type ListFormsInput } from "../schemas/list_forms.js";

export function registerListFormsTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_list_forms",
    {
      title: "List lead-capture forms",
      description: `Browse and filter lead-capture forms in your Brixus account.

Returns a paginated list of forms with status (draft/published/archived),
form type, slug, and view/submission counts. Use this to discover form IDs
for \`brixus_get_form\`, \`brixus_publish_form\`, and
\`brixus_get_form_analytics\`.

Requires \`forms:read\` or \`forms:write\` API key scope.

Filter options: status, name search.
Sort by created_at, updated_at, name, submission_count, or view_count.`,
      inputSchema: ListFormsInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: ListFormsInput) => {
      try {
        const result = await client.listForms({
          ...(params.page !== undefined && { page: params.page }),
          ...(params.limit !== undefined && { limit: params.limit }),
          ...(params.search && { search: params.search }),
          ...(params.status && { status: params.status }),
          ...(params.sort_by && { sort_by: params.sort_by }),
          ...(params.sort_order && { sort_order: params.sort_order }),
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
