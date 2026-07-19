import { z } from "zod";

export const ListRecipientGroupsInputSchema = z.object({
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
    .describe("Search by group name (case-insensitive substring match)."),
}).strict();

export type ListRecipientGroupsInput = z.infer<
  typeof ListRecipientGroupsInputSchema
>;
