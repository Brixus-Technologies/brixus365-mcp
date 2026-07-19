import { z } from "zod";

export const GetWorkflowInputSchema = z.object({
  workflow_id: z
    .string()
    .uuid()
    .describe(
      "UUID of the workflow to retrieve. Use `brixus_list_workflows` to discover workflow IDs.",
    ),
}).strict();

export type GetWorkflowInput = z.infer<typeof GetWorkflowInputSchema>;
