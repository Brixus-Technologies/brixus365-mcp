import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { PublishFormInputSchema, type PublishFormInput } from "../schemas/publish_form.js";

export function registerPublishFormTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_publish_form",
    {
      title: "Publish a form",
      description: `Publish a draft form: validates its content and snapshots it, making
it live and publicly submittable at its hosted/embedded URL.

If the form's content fails validation (e.g. malformed or empty
\`puck_data\`), this fails with a 422 \`form_not_publishable\` error --
inspect and fix the form's content with \`brixus_get_form\` /
\`brixus_create_form\` before retrying. Retrying without changing the
content will fail the same way every time.

Requires \`forms:write\` API key scope.
Use \`brixus_list_forms\` to discover form IDs.`,
      inputSchema: PublishFormInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: PublishFormInput) => {
      try {
        const result = await client.publishForm(params.form_id);
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
