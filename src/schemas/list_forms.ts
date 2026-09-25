import { z } from "zod";

export const ListFormsInputSchema = z.object({
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
    .describe("Search forms by name (case-insensitive substring match)."),
  status: z
    .enum(["draft", "published", "archived"])
    .optional()
    .describe("Filter by form status."),
  sort_by: z
    .enum(["created_at", "updated_at", "name", "submission_count", "view_count"])
    .optional()
    .describe("Sort field. Default 'created_at'."),
  sort_order: z
    .enum(["asc", "desc"])
    .optional()
    .describe("Sort direction. Default 'desc'."),
}).strict();

export type ListFormsInput = z.infer<typeof ListFormsInputSchema>;
