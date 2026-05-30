import { z } from "zod";

const AttachmentSchema = z.object({
  filename: z.string().min(1).describe("Original filename including extension, e.g. 'invoice.pdf'."),
  content: z.string().min(1).describe("Base64-encoded file content."),
  content_type: z.string().min(1).describe("MIME type, e.g. 'application/pdf' or 'image/png'."),
});

export const SendEmailInputSchema = z.object({
  to: z
    .union([
      z.string().email("`to` must be a valid email address"),
      z.array(z.string().email()).min(1).max(50),
    ])
    .describe(
      "Recipient(s). A single email address string or an array of up to 50 addresses.",
    ),
  cc: z
    .array(z.string().email())
    .optional()
    .describe("CC recipients."),
  bcc: z
    .array(z.string().email())
    .optional()
    .describe("BCC recipients."),
  reply_to: z
    .string()
    .email()
    .optional()
    .describe("Reply-to address. Replies from recipients go here instead of the sender."),
  from_name: z
    .string()
    .max(1024)
    .optional()
    .describe("Sender display name, ≤1024 chars. Defaults to the tenant's configured name."),
  from_address: z
    .string()
    .email()
    .optional()
    .describe("Override the from address. Must be a verified domain on your Brixus account."),
  brand_name: z
    .string()
    .max(128)
    .optional()
    .describe("Brand name shown in the email header, ≤128 chars."),
  logo_url: z
    .string()
    .url()
    .max(2048)
    .optional()
    .describe("Brand logo URL for the email header, ≤2048 chars."),
  starter_template: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9-]+$/,
      "`starter_template` must be a kebab-case slug (lowercase letters, digits, hyphens).",
    )
    .optional()
    .describe(
      "Slug of a Brixus starter template. Use `brixus_list_starter_templates` to browse. " +
        "Exactly one of `starter_template`, `template_id`, or `html` is required.",
    ),
  template_id: z
    .string()
    .uuid()
    .optional()
    .describe(
      "UUID of a custom saved template in your Brixus account. " +
        "Exactly one of `starter_template`, `template_id`, or `html` is required.",
    ),
  subject: z
    .string()
    .max(998)
    .optional()
    .describe("Email subject line, ≤998 chars. Required when using `html` mode."),
  html: z
    .string()
    .optional()
    .describe(
      "Raw HTML body. " +
        "Exactly one of `starter_template`, `template_id`, or `html` is required.",
    ),
  text: z
    .string()
    .optional()
    .describe("Plain-text fallback body. Can accompany `html`."),
  variables: z
    .record(z.string(), z.unknown())
    .optional()
    .describe("Key-value pairs injected into the template. Each template declares its required variables."),
  attachments: z
    .array(AttachmentSchema)
    .max(10)
    .optional()
    .describe("File attachments. Up to 10 files; each ≤5 MB; total ≤10 MB."),
  scheduled_at: z
    .string()
    .datetime({ offset: true })
    .optional()
    .describe(
      "ISO 8601 datetime to schedule delivery. Must be in the future and ≤30 days out.",
    ),
  idempotency_key: z
    .string()
    .min(1)
    .max(256)
    .optional()
    .describe(
      "Caller-supplied deduplication key, ≤256 chars. " +
        "Reusing the same key within 24 h returns the original response without re-sending. " +
        "Supply a stable key (e.g. order ID + event type) to prevent duplicates on retry.",
    ),
}).strict();

export type SendEmailInput = z.infer<typeof SendEmailInputSchema>;
