import { z } from "zod";

export const GetCampaignEngagementInputSchema = z.object({
  campaign_id: z
    .string()
    .uuid()
    .describe(
      "UUID of the campaign to retrieve engagement stats for. Use `brixus_list_campaigns` to discover campaign IDs.",
    ),
}).strict();

export type GetCampaignEngagementInput = z.infer<typeof GetCampaignEngagementInputSchema>;
