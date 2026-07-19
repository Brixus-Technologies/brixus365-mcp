import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  CloneWorkflowTemplateInputSchema,
  type CloneWorkflowTemplateInput,
} from "../schemas/clone_workflow_template.js";

export function registerCloneWorkflowTemplateTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_clone_workflow_template",
    {
      title: "Clone workflow template",
      description: `Clone a pre-built workflow template (see brixus_list_workflow_templates) into a new draft workflow in the user's workspace, ready to customize or activate.

The new workflow starts in draft status -- activate with brixus_activate_workflow.

Requires \`workflows:write\` API key scope (Pro/Enterprise tier only).`,
      inputSchema: CloneWorkflowTemplateInputSchema,
      annotations: {
        readOnlyHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: CloneWorkflowTemplateInput) => {
      try {
        const result = await client.cloneWorkflowTemplate(params.template_id, { name: params.name });
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
