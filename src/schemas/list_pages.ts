import { z } from "zod";

export const ListPagesInputSchema = z.object({
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
    .describe("Search pages by name (case-insensitive substring match)."),
  sort_by: z
    .enum(["created_at", "updated_at", "name", "view_count", "status"])
    .optional()
    .describe("Sort field. Default 'created_at'."),
  sort_order: z
    .enum(["asc", "desc"])
    .optional()
    .describe("Sort direction. Default 'desc'."),
  status: z
    .enum(["draft", "published", "publishing", "publish_failed", "archived"])
    .optional()
    .describe(
      "Filter by page status. Omit to list pages in any status.",
    ),
}).strict();

export type ListPagesInput = z.infer<typeof ListPagesInputSchema>;
