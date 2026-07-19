import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  CreateEmailTemplateInputSchema,
  type CreateEmailTemplateInput,
} from "../schemas/create_email_template.js";
import { validateTemplateData } from "../schemas/validate_template_data.js";

export function registerCreateEmailTemplateTool(
  server: McpServer,
  client: BrixusClient,
): void {
  server.registerTool(
    "brixus_create_email_template",
    {
      title: "Create an email template",
      description: `Create a new email template with structured template data.

IMPORTANT: Call \`brixus_get_email_component_schema\` first to understand the
required template structure, component types, and zone naming conventions.

The \`template_data\` object must contain:
  - \`root\`: { props: { title: "..." } }
  - \`content\`: array of top-level components (usually one EmailContainer)
  - \`zones\`: object mapping zone keys to child component arrays

Use \`{{variable_name}}\` syntax in HTML content and subject for personalization.

FONT & LAYOUT RULES (enforced — a template that breaks these is rejected):
  - Text \`fontFamily\` MUST be the system stack
    \`-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif\`.
  - Monospace \`fontFamily\` MUST be the full stack
    \`"SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace\`.
  - No \`position: absolute\` (Gmail strips it and the content vanishes).

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
      const problems = validateTemplateData(params.template_data);
      if (problems.length > 0) {
        return {
          content: [
            {
              type: "text" as const,
              text:
                "Template rejected before creation — fix these and retry:\n- " +
                problems.join("\n- "),
            },
          ],
          isError: true,
        };
      }
      try {
        const resp = await client.createTemplate({
          name: params.name,
          subject: params.subject,
          puck_data: params.template_data,
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
