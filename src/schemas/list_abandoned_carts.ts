import { z } from "zod";

export const ListAbandonedCartsInputSchema = z.object({
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
}).strict();

export type ListAbandonedCartsInput = z.infer<
  typeof ListAbandonedCartsInputSchema
>;
