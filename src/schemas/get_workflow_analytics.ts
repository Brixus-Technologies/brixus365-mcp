import { z } from "zod";

export const GetWorkflowAnalyticsInputSchema = z.object({
  workflow_id: z
    .string()
    .uuid()
    .describe("UUID of the workflow to get performance analytics for."),
}).strict();

export type GetWorkflowAnalyticsInput = z.infer<
  typeof GetWorkflowAnalyticsInputSchema
>;
