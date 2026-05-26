import { z } from "zod";

export const GetEmailInputSchema = z.object({
  message_id: z
    .string()
    .min(1)
    .describe(
      "Brixus message ID returned by `brixus_send_email` or `brixus_send_email_batch` " +
        "(e.g. 'msg_live_01J...').",
    ),
}).strict();

export type GetEmailInput = z.infer<typeof GetEmailInputSchema>;
