import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { UpdateFormInputSchema, type UpdateFormInput } from "../schemas/update_form.js";

export function registerUpdateFormTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_update_form",
    {
      title: "Edit a form",
      description: `Edit an existing lead-capture form: its name, its questions and layout
(\`puck_data\`), and/or its \`settings\`. Provide at least one of those; fields you
omit are left as-is. Works on draft and published forms. It cannot archive or
delete a form.

\`puck_data\` replaces the whole tree, so fetch the current one with
\`brixus_get_form\`, change it, and send the complete tree back. \`settings\` are
merged into the existing settings.

A published form keeps serving its published content until
\`brixus_publish_form\` is called again: editing a published form changes its
draft, so changed questions and layout go live only after you publish again.
Settings and name changes are not part of that snapshot and apply immediately.
A published form keeps its slug and hosted URL when renamed. On a draft, sending
\`name\` regenerates the slug and hosted URL even if the name is unchanged, so omit
\`name\` unless you are renaming.

Requires \`forms:write\` API key scope.
Use \`brixus_list_forms\` to discover form IDs.`,
      inputSchema: UpdateFormInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: UpdateFormInput) => {
      if (params.name === undefined && params.puck_data === undefined && params.settings === undefined) {
        return {
          content: [
            { type: "text" as const, text: "Error: provide at least one of name, puck_data or settings to change." },
          ],
          isError: true,
        };
      }
      try {
        const result = await client.updateForm(params.form_id, {
          ...(params.name !== undefined && { name: params.name }),
          ...(params.puck_data !== undefined && { puck_data: params.puck_data }),
          ...(params.settings !== undefined && { settings: params.settings }),
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
