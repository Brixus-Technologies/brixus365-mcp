import { z } from "zod";

export const CreateRecipientGroupInputSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(255)
    .describe("Name for the recipient group."),
  description: z
    .string()
    .max(500)
    .optional()
    .describe("Optional description for the group."),
}).strict();

export type CreateRecipientGroupInput = z.infer<typeof CreateRecipientGroupInputSchema>;
