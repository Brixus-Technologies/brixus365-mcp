import { z } from "zod";
import { WorkflowStepSchema } from "./set_workflow_steps.js";

export const CreateWorkflowInputSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  trigger_type: z.enum(["manual", "schedule", "group_add", "form_submit", "shopify_event"]),
  trigger_config: z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
      "Required shape depends on trigger_type: manual -> {} (omit); schedule -> {cron: string, group_id: string}; group_add -> {group_id: string}; form_submit -> {form_id: string}; shopify_event -> {event_type: 'abandoned_cart'|'order_placed'|'order_fulfilled'|'browse_abandoned'|'cart_abandoned', abandon_delay_minutes?: number (15-1440, only for abandoned_cart/browse_abandoned/cart_abandoned)}.",
    ),
  budget_type: z.enum(["message_count", "dollar_cost"]).optional(),
  budget_limit: z.number().positive().optional().describe("Required if budget_type is set."),
  steps: z
    .array(WorkflowStepSchema)
    .optional()
    .describe(
      "Optional initial steps for the workflow. If provided, this tool creates the workflow then saves these steps in one call (equivalent to calling brixus_set_workflow_steps immediately after). Omit to create an empty draft and add steps later.",
    ),
}).strict();

export type CreateWorkflowInput = z.infer<typeof CreateWorkflowInputSchema>;
