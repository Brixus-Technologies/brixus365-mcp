import { z } from "zod";

const AttachmentSchema = z.object({
  filename: z.string().min(1),
  content: z.string().min(1).describe("Base64-encoded file content."),
  content_type: z.string().min(1).describe("MIME type."),
});

const BatchMessageSchema = z.object({
  to: z
    .union([
      z.string().email(),
      z.array(z.string().email()).min(1).max(50),
    ])
    .describe("Recipient(s) for this message."),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  reply_to: z.string().email().optional(),
  from_name: z.string().max(1024).optional(),
  from_address: z.string().email().optional(),
  brand_name: z.string().max(128).optional(),
  logo_url: z.string().url().max(2048).optional(),
  starter_template: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_-]+$/)
    .optional()
    .describe("Exactly one of starter_template, template_id, or html is required per message."),
  template_id: z.string().uuid().optional(),
  subject: z.string().max(998).optional(),
  html: z.string().optional(),
  text: z.string().optional(),
  variables: z.record(z.string(), z.unknown()).optional(),
  attachments: z.array(AttachmentSchema).max(10).optional(),
  scheduled_at: z.string().datetime({ offset: true }).optional(),
  idempotency_key: z.string().min(1).max(256).optional(),
});

export const SendBatchInputSchema = z.object({
  messages: z
    .array(BatchMessageSchema)
    .min(1)
    .max(100)
    .describe(
      "Array of 1–100 messages to send. Each must specify exactly one content mode " +
        "(starter_template, template_id, or html). " +
        "Total recipient count across all messages must not exceed 1000.",
    ),
}).strict();

export type SendBatchInput = z.infer<typeof SendBatchInputSchema>;
