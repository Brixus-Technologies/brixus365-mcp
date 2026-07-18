import { z } from "zod";

export const ListEmailTemplatesInputSchema = z.object({
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
    .describe("Maximum records to return (1–100). Default 20."),
}).strict();

export type ListEmailTemplatesInput = z.infer<typeof ListEmailTemplatesInputSchema>;
