import { z } from "zod";

export const DeleteWebhookInputSchema = z.object({
  subscription_id: z
    .string()
    .min(1)
    .describe(
      "Webhook subscription ID (e.g. 'whk_<uuid>' or a raw UUID).",
    ),
}).strict();

export type DeleteWebhookInput = z.infer<typeof DeleteWebhookInputSchema>;
