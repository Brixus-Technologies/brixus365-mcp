import { z } from "zod";

export const ListContactsInputSchema = z.object({
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
  search: z
    .string()
    .optional()
    .describe("Search by email or name (case-insensitive substring match)."),
  status: z
    .enum(["all", "subscribed", "unsubscribed"])
    .optional()
    .describe("Filter by subscription status. Default 'all'."),
  sort_by: z
    .enum(["created_at", "email", "name", "engagement"])
    .optional()
    .describe(
      "Sort field. Default 'created_at'. 'engagement' orders by clicks, then opens, " +
        "then lastEngagedAt within engagement_days (ties broken by contact id).",
    ),
  sort_order: z
    .enum(["asc", "desc"])
    .optional()
    .describe("Sort direction. Default 'desc'."),
  engagement_days: z
    .number()
    .int()
    .min(1)
    .max(365)
    .optional()
    .describe("Window in days to compute opens/clicks/lastEngagedAt over. Default 90."),
  engagement: z
    .enum(["none"])
    .optional()
    .describe(
      "'none' returns only contacts with zero email opens and clicks within " +
        "engagement_days — useful for building re-engagement/cold-contact segments.",
    ),
}).strict();

export type ListContactsInput = z.infer<typeof ListContactsInputSchema>;
