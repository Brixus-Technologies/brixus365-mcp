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
    .enum(["all", "subscribed", "unsubscribed", "bounced", "complained"])
    .optional()
    .describe("Filter by subscription status. Default 'all'."),
  sort_by: z
    .enum(["created_at", "email", "name"])
    .optional()
    .describe("Sort field. Default 'created_at'."),
  sort_order: z
    .enum(["asc", "desc"])
    .optional()
    .describe("Sort direction. Default 'desc'."),
}).strict();

export type ListContactsInput = z.infer<typeof ListContactsInputSchema>;
