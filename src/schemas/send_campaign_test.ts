import { z } from "zod";

export const SendCampaignTestInputSchema = z.object({
  campaign_id: z
    .string()
    .uuid()
    .describe(
      "UUID of the campaign to send a test email for. " +
        "Use `brixus_list_campaigns` to discover campaign IDs.",
    ),
  test_emails: z
    .array(z.string().email())
    .min(1)
    .max(3)
    .describe("1–3 email addresses to receive the test. Does not affect campaign statistics."),
}).strict();

export type SendCampaignTestInput = z.infer<typeof SendCampaignTestInputSchema>;
