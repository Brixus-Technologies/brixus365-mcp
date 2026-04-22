import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import { ListStarterTemplatesInputSchema } from "../schemas/list_starter_templates.js";

export function registerListStarterTemplatesTool(
  server: McpServer,
  client: BrixusClient,
): void {
  server.registerTool(
    "brixus_list_starter_templates",
    {
      title: "List Brixus starter templates",
      description: `List all starter email templates available to your Brixus account.

Each starter template has a stable slug (e.g., "auth-reset",
"welcome-email") and declares the variable names it expects. Use the
output to pick the right template before calling
\`brixus_send_email\` or \`brixus_preview_starter_template\`.

Args: none.

Returns (JSON):
  {
    "templates": [
      {
        "slug": "auth-reset",
        "name": "Password reset",
        "description": "Send a password-reset link to a user.",
        "variables": ["userName", "resetLink"]
      },
      ...
    ]
  }

Errors:
  - invalid_api_key / missing_api_key: env var not set.
  - rate_limit_exceeded: back off.`,
      inputSchema: ListStarterTemplatesInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async () => {
      try {
        const resp = await client.listStarterTemplates();
        const text = JSON.stringify(resp, null, 2);
        if (text.length > CHARACTER_LIMIT) {
          // Starter-template list is tiny today (~10 rows). Future-proof
          // for the case where it grows past the budget.
          const keepCount = Math.max(1, Math.floor(resp.templates.length / 2));
          const truncated: Record<string, unknown> = {
            templates: resp.templates.slice(0, keepCount),
            truncated: true,
            truncationNote:
              `Response truncated from ${resp.templates.length} to ` +
              `${keepCount} rows. The underlying Brixus API returns the ` +
              "full list in one call; consider visiting the Brixus " +
              "dashboard directly.",
          };
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify(truncated, null, 2),
            }],
            structuredContent: truncated,
          };
        }
        const structured: Record<string, unknown> = { templates: resp.templates };
        return {
          content: [{ type: "text" as const, text }],
          structuredContent: structured,
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
