import { z } from "zod";

export const ResumeCampaignInputSchema = z.object({
  campaign_id: z
    .string()
    .uuid()
    .describe("UUID of the paused campaign to resume sending."),
}).strict();

export type ResumeCampaignInput = z.infer<typeof ResumeCampaignInputSchema>;
