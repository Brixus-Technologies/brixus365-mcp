import { z } from "zod";

export const WorkflowStepSchema = z.object({
  id: z
    .string()
    .uuid()
    .optional()
    .describe(
      "Client-generated UUID, only needed for referencing this step from another step's next_step_id/true_step_id/false_step_id within the same request.",
    ),
  name: z.string().max(255).optional(),
  step_type: z.enum(["send", "delay", "condition", "create_discount"]),
  channel: z
    .enum(["email", "sms", "whatsapp"])
    .optional()
    .describe("Required when step_type is 'send'."),
  next_step_id: z
    .string()
    .uuid()
    .optional()
    .describe("id of the step to run next; omit or leave the last step to end the workflow."),
  position: z.number().int().min(0).describe("Order of this step in the workflow, 0-based."),
  config: z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
      "Shape depends on step_type: delay -> {delay_type: 'fixed'|'until_time', delay_value?: number, delay_unit?: 'minutes'|'hours'|'days', time_of_day?: string}; send -> {channel?, template_id?, template_name?, sender_address?, bcc?}; condition -> {condition_type?, operator?, field?, value?, true_step_id?, false_step_id?}; create_discount -> {discount_set_id?}.",
    ),
});

export const SetWorkflowStepsInputSchema = z.object({
  workflow_id: z.string().uuid().describe("The workflow to replace steps on."),
  steps: z
    .array(WorkflowStepSchema)
    .describe("Full replacement list of steps -- this replaces ALL existing steps on the workflow (not a merge/patch)."),
}).strict();

export type SetWorkflowStepsInput = z.infer<typeof SetWorkflowStepsInputSchema>;
