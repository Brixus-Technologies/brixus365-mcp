import { z } from "zod";

export const GetCampaignLinkPerformanceInputSchema = z.object({
  campaign_id: z
    .string()
    .uuid()
    .describe(
      "UUID of the campaign to retrieve link click data for. Use `brixus_list_campaigns` to discover campaign IDs.",
    ),
}).strict();

export type GetCampaignLinkPerformanceInput = z.infer<typeof GetCampaignLinkPerformanceInputSchema>;
