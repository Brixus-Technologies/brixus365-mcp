import { z } from "zod";

export const GetContactInputSchema = z.object({
  contact_id: z
    .string()
    .uuid()
    .describe("UUID of the contact to retrieve."),
  engagement_days: z
    .number()
    .int()
    .min(1)
    .max(365)
    .optional()
    .describe("Window in days to compute opens/clicks/lastEngagedAt over. Default 90."),
}).strict();

export type GetContactInput = z.infer<typeof GetContactInputSchema>;
