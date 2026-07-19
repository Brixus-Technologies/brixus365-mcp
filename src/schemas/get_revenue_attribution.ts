import { z } from "zod";

export const GetRevenueAttributionInputSchema = z.object({
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
  date_from: z
    .string()
    .optional()
    .describe("ISO 8601 datetime. Only include orders attributed on or after this date."),
  date_to: z
    .string()
    .optional()
    .describe("ISO 8601 datetime. Only include orders attributed on or before this date."),
}).strict();

export type GetRevenueAttributionInput = z.infer<
  typeof GetRevenueAttributionInputSchema
>;
