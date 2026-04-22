import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  PreviewStarterTemplateInputSchema,
  type PreviewStarterTemplateInput,
} from "../schemas/preview_starter_template.js";

export function registerPreviewStarterTemplateTool(
  server: McpServer,
  client: BrixusClient,
): void {
  server.registerTool(
    "brixus_preview_starter_template",
    {
      title: "Preview a rendered Brixus starter template",
      description: `Render a starter template with variables and return the HTML.

Useful to verify content before sending, or to show a user what an
email will look like.

Args:
  - slug (string, required): starter-template slug.
  - variables (object, optional): variable overrides. Omit to use the
    template's built-in sample values.

Returns (JSON):
  {
    "slug": "auth-reset",
    "subject": "Reset your password",
    "html": "<html>...</html>",
    "sampleVariables": { "userName": "Alice", "resetLink": "https://..." }
  }

The rendered HTML can be large; when it exceeds ~25kB, the tool returns
a truncated version with a \`truncated: true\` marker.

Errors:
  - template_not_found: the slug is not known. Call
    brixus_list_starter_templates first.
  - invalid_api_key / missing_api_key: env var not set.
  - rate_limit_exceeded: back off.`,
      inputSchema: PreviewStarterTemplateInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: PreviewStarterTemplateInput) => {
      try {
        const resp = await client.previewStarterTemplate(
          params.slug,
          params.variables,
        );
        let output: Record<string, unknown> = {
          slug: resp.slug,
          subject: resp.subject,
          html: resp.html,
          sampleVariables: resp.sampleVariables,
        };
        let text = JSON.stringify(output, null, 2);
        if (text.length > CHARACTER_LIMIT) {
          output = {
            ...output,
            html: resp.html.slice(0, 1_000) + "\n<!-- [truncated] -->",
            truncated: true,
            truncationNote:
              `HTML truncated from ${resp.html.length} chars to 1000. ` +
              "Open the template in the Brixus dashboard for the full render.",
          };
          text = JSON.stringify(output, null, 2);

          // Edge case: sampleVariables can itself be huge (e.g. embedded
          // base64 image or a long product list). If trimming the HTML
          // still leaves us over the limit, strip sampleVariables too and
          // leave a breadcrumb so the caller knows where the data went.
          if (text.length > CHARACTER_LIMIT) {
            output = {
              ...output,
              sampleVariables: {},
              truncationNote:
                `HTML truncated from ${resp.html.length} chars to 1000, ` +
                "and sampleVariables stripped (payload still exceeded " +
                `${CHARACTER_LIMIT} chars). Open the template in the ` +
                "Brixus dashboard for the full render.",
            };
            text = JSON.stringify(output, null, 2);
          }
        }
        return {
          content: [{ type: "text" as const, text }],
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
