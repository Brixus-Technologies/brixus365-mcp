import { z } from "zod";

export const CreateCampaignInputSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(255)
    .describe("Campaign name (internal, not shown to recipients)."),
  channel: z
    .enum(["email", "sms", "whatsapp"])
    .describe("Delivery channel for the campaign."),
  template_id: z
    .string()
    .uuid()
    .optional()
    .describe("UUID of the email template to send. Use `brixus_list_email_templates` to discover template IDs."),
  recipient_group_ids: z
    .array(z.string().uuid())
    .optional()
    .describe("UUIDs of contact groups to send to."),
  sender_address_id: z
    .string()
    .uuid()
    .optional()
    .describe(
      "UUID of the verified sender address to send from. Use `brixus_list_sender_addresses` to discover sender IDs. Omit to use the tenant's default marketing sender; if the tenant has no default, the call fails with an actionable error rather than creating an unsendable campaign.",
    ),
  scheduled_at: z
    .string()
    .optional()
    .describe("ISO 8601 timestamp to schedule the send for. Omit to leave as a draft (send later via `brixus_send_campaign`)."),
}).strict();

export type CreateCampaignInput = z.infer<typeof CreateCampaignInputSchema>;
