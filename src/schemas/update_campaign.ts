import { z } from "zod";

export const UpdateCampaignInputSchema = z.object({
  campaign_id: z
    .string()
    .uuid()
    .describe("UUID of the campaign to update. Only draft or ready campaigns can be updated."),
  name: z
    .string()
    .min(1)
    .max(255)
    .optional()
    .describe("New campaign name."),
  template_id: z
    .string()
    .uuid()
    .optional()
    .describe("New template UUID."),
  recipient_group_ids: z
    .array(z.string().uuid())
    .optional()
    .describe("New set of contact group UUIDs to send to (replaces existing)."),
  scheduled_at: z
    .string()
    .datetime({ offset: true })
    .optional()
    .describe(
      "ISO 8601 send time with a timezone offset (e.g. 2026-11-01T09:00:00Z). " +
        "On a ready campaign this schedules it; on a draft it is only stored and nothing is scheduled.",
    ),
}).strict();

export type UpdateCampaignInput = z.infer<typeof UpdateCampaignInputSchema>;
