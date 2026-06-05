import { z } from "zod";

export const CreateEmailTemplateInputSchema = z.object({
  name: z
    .string()
    .min(1)
    .describe("Name for the email template (e.g. 'Welcome Email')."),
  subject: z
    .string()
    .min(1)
    .describe(
      "Email subject line. Supports {{variable}} syntax for personalization.",
    ),
  template_data: z
    .record(z.unknown())
    .describe(
      "Email template structure. Must follow the schema from `brixus_get_email_component_schema`. " +
        "Contains root, content, and zones keys.",
    ),
  category: z
    .enum(["marketing", "transactional"])
    .default("marketing")
    .describe("Template category (default: 'marketing')."),
}).strict();

export type CreateEmailTemplateInput = z.infer<typeof CreateEmailTemplateInputSchema>;
