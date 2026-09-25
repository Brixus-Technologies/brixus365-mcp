import { z } from "zod";

export const ListPageTemplatesInputSchema = z.object({
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
    .describe("Results per page (1–100). Default 100."),
}).strict();

export type ListPageTemplatesInput = z.infer<typeof ListPageTemplatesInputSchema>;
