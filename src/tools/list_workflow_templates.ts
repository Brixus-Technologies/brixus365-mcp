import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  ListWorkflowTemplatesInputSchema,
  type ListWorkflowTemplatesInput,
} from "../schemas/list_workflow_templates.js";

export function registerListWorkflowTemplatesTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_list_workflow_templates",
    {
      title: "List workflow automation blueprints",
      description: `List pre-built workflow templates (automation blueprints) available
in your Brixus account.

Returns each template's name, trigger type, and step outline. Useful to
show a user available automation starting points before they build a
custom workflow from scratch.

Requires \`workflows:read\` or \`workflows:manage\` API key scope (Pro/Enterprise tier only).`,
      inputSchema: ListWorkflowTemplatesInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (_params: ListWorkflowTemplatesInput) => {
      try {
        const result = await client.listWorkflowTemplates();
        const text = JSON.stringify(result, null, 2);
        return {
          content: [{
            type: "text" as const,
            text: text.length > CHARACTER_LIMIT
              ? text.slice(0, CHARACTER_LIMIT) + "\n... (response truncated)"
              : text,
          }],
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
