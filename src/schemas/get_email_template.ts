import { z } from "zod";

export const GetEmailTemplateInputSchema = z.object({
  template_id: z
    .string()
    .min(1)
    .describe("UUID of the template to retrieve."),
}).strict();

export type GetEmailTemplateInput = z.infer<typeof GetEmailTemplateInputSchema>;
