import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { GetFormInputSchema, type GetFormInput } from "../schemas/get_form.js";

export function registerGetFormTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_form",
    {
      title: "Get form details",
      description: `Retrieve full details for a specific lead-capture form by ID.

Returns the form's status, slug, form type, \`puckData\` (draft content),
\`publishedData\` (live content, present once published), settings, view and
submission counts, and \`hostedUrl\` (for hosted forms).

Requires \`forms:read\` or \`forms:write\` API key scope.
Use \`brixus_list_forms\` to discover form IDs.`,
      inputSchema: GetFormInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: GetFormInput) => {
      try {
        const result = await client.getForm(params.form_id);
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
