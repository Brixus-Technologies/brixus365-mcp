import { z } from "zod";

export const UpdateEmailTemplateInputSchema = z.object({
  template_id: z
    .string()
    .min(1)
    .describe("UUID of the template to update."),
  template_data: z
    .record(z.unknown())
    .optional()
    .describe(
      "Updated email template structure. Must follow the schema from `brixus_get_email_component_schema`.",
    ),
  subject: z
    .string()
    .optional()
    .describe("Updated email subject line."),
  name: z
    .string()
    .optional()
    .describe("Updated template name."),
});

export type UpdateEmailTemplateInput = z.infer<typeof UpdateEmailTemplateInputSchema>;
