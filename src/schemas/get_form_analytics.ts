import { z } from "zod";

export const GetFormAnalyticsInputSchema = z.object({
  form_id: z
    .string()
    .uuid()
    .describe(
      "UUID of the form to get analytics for. Use `brixus_list_forms` to discover form IDs.",
    ),
  page: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("Page number for recent_submissions (1-indexed). Default 1."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Recent submissions per page (1–100). Default 20."),
  submission_status: z
    .enum(["accepted", "rejected_bot", "rejected_invalid", "rejected_quota", "rejected_spam"])
    .optional()
    .describe("Filter recent_submissions by outcome status."),
}).strict();

export type GetFormAnalyticsInput = z.infer<typeof GetFormAnalyticsInputSchema>;
