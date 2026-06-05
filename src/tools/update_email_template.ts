import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  UpdateEmailTemplateInputSchema,
  type UpdateEmailTemplateInput,
} from "../schemas/update_email_template.js";

export function registerUpdateEmailTemplateTool(
  server: McpServer,
  client: BrixusClient,
): void {
  server.registerTool(
    "brixus_update_email_template",
    {
      title: "Update an email template",
      description: `Update an existing email template. Only provided fields are changed.

Supply \`template_data\` to replace the template design, \`subject\` to update the
subject line, or \`name\` to rename. At least one field besides \`template_id\`
must be provided.

Call \`brixus_get_email_component_schema\` for the template structure reference.

Requires \`templates:write\` API key scope.`,
      inputSchema: UpdateEmailTemplateInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: UpdateEmailTemplateInput) => {
      try {
        const resp = await client.updateTemplate(params.template_id, {
          puck_data: params.template_data,
          subject: params.subject,
          name: params.name,
        });

        const id = resp.id as string;
        const editorUrl = `${client.getDashboardBaseUrl()}/apps/marketing/templates/${id}/edit`;

        const output = {
          id,
          name: resp.name,
          subject: resp.subject,
          variables: resp.variables ?? [],
          editorUrl,
          updatedAt: resp.updated_at ?? resp.updatedAt,
        };

        return {
          content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
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
