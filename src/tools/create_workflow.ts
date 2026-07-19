import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  CreateWorkflowInputSchema,
  type CreateWorkflowInput,
} from "../schemas/create_workflow.js";

export function registerCreateWorkflowTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_create_workflow",
    {
      title: "Create workflow",
      description: `Create a new workflow automation in your Brixus account. The workflow is created in DRAFT status -- it is not active/running until you call brixus_activate_workflow.

trigger_type/trigger_config shapes: manual -> {} (omit trigger_config); schedule -> {cron, group_id}; group_add -> {group_id}; form_submit -> {form_id}; shopify_event -> {event_type: 'abandoned_cart'|'order_placed'|'order_fulfilled'|'browse_abandoned'|'cart_abandoned', abandon_delay_minutes?: 15-1440, only for abandoned_cart/browse_abandoned/cart_abandoned}.

budget_limit requires budget_type to also be set.

Steps can be included inline via the optional \`steps\` field (this saves them in the same call), or added/edited later with brixus_set_workflow_steps.

Requires \`workflows:write\` API key scope (Pro/Enterprise tier only).`,
      inputSchema: CreateWorkflowInputSchema,
      annotations: {
        readOnlyHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: CreateWorkflowInput) => {
      try {
        const { steps, ...createParams } = params;
        const workflow = await client.createWorkflow(createParams);

        if (steps && steps.length > 0) {
          try {
            const stepsResult = await client.setWorkflowSteps(workflow.id as string, steps);
            const merged = { ...workflow, ...stepsResult };
            return {
              content: [{ type: "text" as const, text: JSON.stringify(merged, null, 2) }],
              structuredContent: merged,
            };
          } catch (stepsError) {
            const message = `Workflow created (id: ${workflow.id}) but saving steps failed: ${mapToolErrorMessage(stepsError)}. Retry with brixus_set_workflow_steps.`;
            return {
              content: [
                { type: "text" as const, text: `${message}\n\n${JSON.stringify(workflow, null, 2)}` },
              ],
              structuredContent: workflow,
            };
          }
        }

        return {
          content: [{ type: "text" as const, text: JSON.stringify(workflow, null, 2) }],
          structuredContent: workflow,
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
