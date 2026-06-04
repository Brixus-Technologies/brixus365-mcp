import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  GetEmailTemplateInputSchema,
  type GetEmailTemplateInput,
} from "../schemas/get_email_template.js";

export function registerGetEmailTemplateTool(
  server: McpServer,
  client: BrixusClient,
): void {
  server.registerTool(
    "brixus_get_email_template",
    {
      title: "Get an email template",
      description: `Retrieve an email template by ID, including its Puck editor JSON data.

Returns the template name, subject, category, detected variables, full
\`puckData\` for inspection or modification, and an editor URL for the
Brixus dashboard.`,
      inputSchema: GetEmailTemplateInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: GetEmailTemplateInput) => {
      try {
        const resp = await client.getTemplate(params.template_id);

        const id = resp.id as string;
        const editorUrl = `${client.getDashboardBaseUrl()}/marketing/templates/${id}/edit`;

        const output = {
          id,
          name: resp.name,
          subject: resp.subject,
          category: resp.category,
          variables: resp.variables ?? [],
          puckData: resp.puck_data ?? resp.puckData,
          editorUrl,
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
