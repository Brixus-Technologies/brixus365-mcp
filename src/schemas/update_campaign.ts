import { z } from "zod";

export const UpdateCampaignInputSchema = z.object({
  campaign_id: z
    .string()
    .uuid()
    .describe("UUID of the campaign to update. Only draft/scheduled campaigns can be updated."),
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
    .optional()
    .describe("New ISO 8601 scheduled send time."),
}).strict();

export type UpdateCampaignInput = z.infer<typeof UpdateCampaignInputSchema>;
