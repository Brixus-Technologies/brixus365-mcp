import { z } from "zod";

export const SendCampaignInputSchema = z.object({
  campaign_id: z
    .string()
    .uuid()
    .describe(
      "UUID of the campaign to send. This dispatches the campaign to its recipients " +
        "immediately (or per its schedule) and cannot be undone.",
    ),
  acknowledge_quota_overage: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Set true to proceed when the campaign's recipient count exceeds the tenant's " +
        "remaining daily send quota. Without this, an over-quota send is rejected with " +
        "a daily_quota_partial error naming how many would send now vs. how many would " +
        "be held back. Setting it true sends what fits today and PAUSES the campaign " +
        "for the rest -- there is no automatic release; resuming it later requires the " +
        "dashboard or a direct API call to POST /marketing/campaigns/{id}/resume-sending " +
        "(no MCP tool for that yet).",
    ),
}).strict();

export type SendCampaignInput = z.infer<typeof SendCampaignInputSchema>;
