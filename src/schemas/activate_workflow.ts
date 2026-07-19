import { z } from "zod";

export const ActivateWorkflowInputSchema = z.object({
  workflow_id: z
    .string()
    .uuid()
    .describe("UUID of the draft workflow to activate."),
}).strict();

export type ActivateWorkflowInput = z.infer<typeof ActivateWorkflowInputSchema>;
