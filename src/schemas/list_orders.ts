import { z } from "zod";

export const ListOrdersInputSchema = z.object({
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
  financial_status: z
    .string()
    .optional()
    .describe("Filter by payment status, e.g. 'paid', 'pending', 'refunded'."),
  fulfillment_status: z
    .string()
    .optional()
    .describe(
      "Filter by fulfillment status, e.g. 'fulfilled', 'unfulfilled', 'partial'.",
    ),
  search: z
    .string()
    .optional()
    .describe("Search by order number or customer email."),
}).strict();

export type ListOrdersInput = z.infer<typeof ListOrdersInputSchema>;
