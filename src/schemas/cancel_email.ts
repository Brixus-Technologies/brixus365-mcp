import { z } from "zod";

export const CancelEmailInputSchema = z.object({
  message_id: z
    .string()
    .min(1)
    .describe(
      "Brixus message ID of the scheduled email to cancel (e.g. 'msg_live_01J...'). " +
        "Only emails in 'scheduled' status can be cancelled.",
    ),
}).strict();

export type CancelEmailInput = z.infer<typeof CancelEmailInputSchema>;
