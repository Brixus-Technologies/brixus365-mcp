import { z } from "zod";

export const GetCampaignInputSchema = z.object({
  campaign_id: z
    .string()
    .uuid()
    .describe(
      "UUID of the campaign to retrieve. Use `brixus_list_campaigns` to discover campaign IDs.",
    ),
}).strict();

export type GetCampaignInput = z.infer<typeof GetCampaignInputSchema>;
