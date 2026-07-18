import { z } from "zod";

export const ListWebhooksInputSchema = z.object({
  skip: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Records to skip for pagination. Default 0."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Maximum records to return (1–100). Default 50."),
}).strict();

export type ListWebhooksInput = z.infer<typeof ListWebhooksInputSchema>;
