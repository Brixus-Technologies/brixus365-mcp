import { z } from "zod";

export const SendCampaignInputSchema = z.object({
  campaign_id: z
    .string()
    .uuid()
    .describe(
      "UUID of the campaign to send. This dispatches the campaign to its recipients " +
        "immediately (or per its schedule) and cannot be undone.",
    ),
}).strict();

export type SendCampaignInput = z.infer<typeof SendCampaignInputSchema>;
