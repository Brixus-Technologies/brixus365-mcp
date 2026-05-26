import { z } from "zod";

export const ListCampaignsInputSchema = z.object({
  page: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("Page number (1-indexed). Default 1."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Results per page (1–100). Default 20."),
  status: z
    .string()
    .optional()
    .describe(
      "Filter by campaign status: 'draft', 'scheduled', 'sending', 'sent', 'paused', 'stopped'.",
    ),
  channel: z
    .string()
    .optional()
    .describe("Filter by channel type, e.g. 'email' or 'whatsapp'."),
  search: z
    .string()
    .optional()
    .describe("Search campaigns by name (case-insensitive substring match)."),
  sort_by: z
    .enum(["created_at", "scheduled_at", "name", "status"])
    .optional()
    .describe("Sort field. Default 'created_at'."),
  sort_order: z
    .enum(["asc", "desc"])
    .optional()
    .describe("Sort direction. Default 'desc'."),
}).strict();

export type ListCampaignsInput = z.infer<typeof ListCampaignsInputSchema>;
