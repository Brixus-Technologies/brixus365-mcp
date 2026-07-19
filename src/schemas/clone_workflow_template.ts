import { z } from "zod";

export const CloneWorkflowTemplateInputSchema = z.object({
  template_id: z
    .string()
    .uuid()
    .describe("The workflow template to clone."),
  name: z
    .string()
    .min(1)
    .max(255)
    .optional()
    .describe("Optional name override for the cloned workflow; defaults to the template's name."),
}).strict();

export type CloneWorkflowTemplateInput = z.infer<typeof CloneWorkflowTemplateInputSchema>;
