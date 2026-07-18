import { z } from "zod";

export const PauseCampaignInputSchema = z.object({
  campaign_id: z
    .string()
    .uuid()
    .describe("UUID of the currently-sending campaign to pause."),
}).strict();

export type PauseCampaignInput = z.infer<typeof PauseCampaignInputSchema>;
