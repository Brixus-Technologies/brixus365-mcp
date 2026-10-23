import { z } from "zod";

export const RescheduleCampaignInputSchema = z.object({
  campaign_id: z
    .string()
    .uuid()
    .describe("UUID of the campaign to reschedule. It must currently be in `scheduled` status."),
  scheduled_at: z
    .string()
    .datetime({ offset: true })
    .describe(
      "New ISO 8601 send time with a timezone offset (e.g. 2026-11-01T09:00:00Z). Must be at least 5 minutes in the future.",
    ),
}).strict();

export type RescheduleCampaignInput = z.infer<typeof RescheduleCampaignInputSchema>;
