import { z } from "zod";

export const CreateWebhookInputSchema = z.object({
  url: z
    .string()
    .url()
    .describe("HTTPS URL the webhook delivers to."),
  event_types: z
    .array(z.string().min(1))
    .min(1)
    .describe(
      "Event types to subscribe to. Examples: 'email.delivered', 'email.bounced', " +
        "'email.complained', 'email.opened', 'email.clicked', 'email.failed'.",
    ),
  description: z
    .string()
    .max(200)
    .optional()
    .describe("Optional label for the webhook, <=200 chars."),
}).strict();

export type CreateWebhookInput = z.infer<typeof CreateWebhookInputSchema>;
