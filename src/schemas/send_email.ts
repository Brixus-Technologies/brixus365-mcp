import { z } from "zod";

export const SendEmailInputSchema = z.object({
  to: z
    .string()
    .email("`to` must be a valid email address")
    .describe("Recipient email address. Preview-tier API keys are " +
      "restricted to a single recipient string; the `list` shape " +
      "accepted by the native API is intentionally not exposed here."),
  starter_template: z
    .string()
    .min(1, "`starter_template` cannot be empty")
    .regex(/^[a-z0-9-]+$/,
      "`starter_template` must be a kebab-case slug (lowercase, digits, hyphens).")
    .describe("Slug of a starter template. Call " +
      "`brixus_list_starter_templates` first to see valid slugs."),
  variables: z
    .record(z.string(), z.unknown())
    .optional()
    .describe("Key-value pairs injected into the template. Each " +
      "template declares required variables - the preview tool shows them."),
  from_name: z
    .string()
    .max(1024, "`from_name` must not exceed 1024 characters.")
    .optional()
    .describe("Display name for the sender. Defaults to the tenant's " +
      "configured from-name."),
}).strict();

export type SendEmailInput = z.infer<typeof SendEmailInputSchema>;
