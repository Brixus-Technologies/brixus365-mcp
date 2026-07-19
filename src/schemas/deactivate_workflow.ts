import { z } from "zod";

export const DeactivateWorkflowInputSchema = z.object({
  workflow_id: z
    .string()
    .uuid()
    .describe(
      "UUID of the workflow to permanently deactivate. This is terminal " +
        "and NOT resumable — use `brixus_pause_workflow` instead if the " +
        "stop is meant to be temporary.",
    ),
}).strict();

export type DeactivateWorkflowInput = z.infer<
  typeof DeactivateWorkflowInputSchema
>;
