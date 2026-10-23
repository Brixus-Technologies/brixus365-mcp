import { z } from "zod";

export const CancelScheduledCampaignInputSchema = z.object({
  campaign_id: z
    .string()
    .uuid()
    .describe("UUID of the scheduled campaign to unschedule."),
}).strict();

export type CancelScheduledCampaignInput = z.infer<typeof CancelScheduledCampaignInputSchema>;
