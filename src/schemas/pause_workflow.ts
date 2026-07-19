import { z } from "zod";

export const PauseWorkflowInputSchema = z.object({
  workflow_id: z
    .string()
    .uuid()
    .describe("UUID of the currently-active workflow to pause."),
}).strict();

export type PauseWorkflowInput = z.infer<typeof PauseWorkflowInputSchema>;
