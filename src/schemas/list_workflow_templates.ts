import { z } from "zod";

export const ListWorkflowTemplatesInputSchema = z.object({}).strict();

export type ListWorkflowTemplatesInput = z.infer<
  typeof ListWorkflowTemplatesInputSchema
>;
