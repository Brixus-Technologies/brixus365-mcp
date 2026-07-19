import { z } from "zod";

export const UpdateWorkflowInputSchema = z.object({
  workflow_id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  trigger_type: z
    .enum(["manual", "schedule", "group_add", "form_submit", "shopify_event"])
    .optional(),
  trigger_config: z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
      "Same per-trigger_type shape as brixus_create_workflow; required if trigger_type is being changed.",
    ),
  budget_type: z.enum(["message_count", "dollar_cost"]).optional(),
  budget_limit: z.number().positive().optional(),
}).strict();

export type UpdateWorkflowInput = z.infer<typeof UpdateWorkflowInputSchema>;
