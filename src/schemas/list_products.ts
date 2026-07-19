import { z } from "zod";

export const ListProductsInputSchema = z.object({
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
    .describe("Filter by product status, e.g. 'active', 'draft', 'archived'."),
  search: z
    .string()
    .optional()
    .describe("Search by product title (case-insensitive substring match)."),
}).strict();

export type ListProductsInput = z.infer<typeof ListProductsInputSchema>;
