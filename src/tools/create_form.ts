import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { CreateFormInputSchema, type CreateFormInput } from "../schemas/create_form.js";

export function registerCreateFormTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_create_form",
    {
      title: "Create a lead-capture form",
      description: `Create a new lead-capture form. The form is created as a DRAFT --
it is not publicly submittable until you call \`brixus_publish_form\` on the
returned form ID.

\`puck_data\` is a freeform Puck editor JSON tree (forms have no raw-HTML
atom, so an arbitrary tree is safe to accept from an API key). Omit it to
create an empty draft you can fill in later via the dashboard.

If the tenant has reached its form limit, this fails with a 403
\`form_quota_exceeded\` error whose details include \`used\`, \`limit\`, and
\`upgrade_available\` -- don't retry; surface the limit to the caller instead.

Requires \`forms:write\` API key scope.`,
      inputSchema: CreateFormInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: CreateFormInput) => {
      try {
        const result = await client.createForm({
          name: params.name,
          ...(params.form_type && { form_type: params.form_type }),
          ...(params.puck_data && { puck_data: params.puck_data }),
          ...(params.settings && { settings: params.settings }),
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
