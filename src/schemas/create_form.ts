import { z } from "zod";

const SuccessBehaviorSchema = z.object({
  type: z
    .enum(["message", "redirect"])
    .optional()
    .describe("What happens after a successful submission. Default 'message'."),
  message: z
    .string()
    .optional()
    .describe("Text shown to the submitter when type is 'message'."),
  redirect_url: z
    .string()
    .optional()
    .describe("URL to redirect the submitter to when type is 'redirect'."),
}).strict();

const BotProtectionSettingsSchema = z.object({
  honeypot: z
    .boolean()
    .optional()
    .describe("Enable a hidden honeypot field to catch bots. Default true."),
  min_fill_seconds: z
    .number()
    .int()
    .min(0)
    .max(30)
    .optional()
    .describe(
      "Minimum seconds a human must take to fill and submit the form before it's accepted as non-bot. Default 2.",
    ),
}).strict();

const FormSettingsSchema = z.object({
  success_behavior: SuccessBehaviorSchema
    .optional()
    .describe("What happens after a successful submission."),
  target_group_id: z
    .string()
    .uuid()
    .optional()
    .describe("UUID of the contact group new submitters are added to."),
  target_tag_ids: z
    .array(z.string().uuid())
    .optional()
    .describe("UUIDs of tags applied to new submitters."),
  double_opt_in: z
    .boolean()
    .optional()
    .describe(
      "Require double opt-in confirmation for new submitters. Omit to use the tenant's default.",
    ),
  consent_text: z
    .string()
    .optional()
    .describe("Label text shown next to the consent checkbox."),
  consent_required: z
    .boolean()
    .optional()
    .describe("Require the consent checkbox to be checked before submitting. Default false."),
  bot_protection: BotProtectionSettingsSchema
    .optional()
    .describe("Spam/bot protection settings."),
}).strict();

export const CreateFormInputSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(255)
    .describe("Form name (internal, shown in the dashboard)."),
  form_type: z
    .enum(["inline", "hosted"])
    .optional()
    .describe(
      "Form delivery type: 'inline' (embedded in a page or email) or 'hosted' (standalone page at a Brixus-hosted URL). Default 'inline'.",
    ),
  puck_data: z
    .record(z.unknown())
    .optional()
    .describe(
      "Puck editor JSON tree describing the form's fields and layout. Freeform object -- pass the exact structure returned by a prior `brixus_get_form` call, or omit to create an empty draft you fill in later via the dashboard. Capped at 2MB.",
    ),
  settings: FormSettingsSchema
    .optional()
    .describe(
      "Form behavior settings: success behavior, target contact group/tags, double opt-in, consent, and bot protection. Omit any field to use its default.",
    ),
}).strict();

export type CreateFormInput = z.infer<typeof CreateFormInputSchema>;
