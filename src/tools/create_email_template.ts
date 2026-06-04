import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  CreateEmailTemplateInputSchema,
  type CreateEmailTemplateInput,
} from "../schemas/create_email_template.js";

export function registerCreateEmailTemplateTool(
  server: McpServer,
  client: BrixusClient,
): void {
  server.registerTool(
    "brixus_create_email_template",
    {
      title: "Create an email template",
      description: `Create a new email template with Puck editor JSON data.

IMPORTANT: Call \`brixus_get_email_component_schema\` first to understand the
required Puck JSON structure, component types, and zone naming conventions.

The \`puck_data\` object must contain:
  - \`root\`: { props: { title: "..." } }
  - \`content\`: array of top-level components (usually one EmailContainer)
  - \`zones\`: object mapping zone keys to child component arrays

Use \`{{variable_name}}\` syntax in HTML content and subject for personalization.

Returns the created template ID and an editor URL for visual refinement.

Requires \`templates:write\` API key scope.`,
      inputSchema: CreateEmailTemplateInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: CreateEmailTemplateInput) => {
      try {
        const resp = await client.createTemplate({
          name: params.name,
          subject: params.subject,
          puck_data: params.puck_data,
          category: params.category,
        });

        const id = resp.id as string;
        const editorUrl = `${client.getDashboardBaseUrl()}/apps/marketing/templates/${id}/edit`;

        const output = {
          id,
          name: resp.name,
          subject: resp.subject,
          variables: resp.variables ?? [],
          editorUrl,
          createdAt: resp.created_at ?? resp.createdAt,
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
