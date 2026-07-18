import { z } from "zod";

export const GetContactInputSchema = z.object({
  contact_id: z
    .string()
    .uuid()
    .describe("UUID of the contact to retrieve."),
}).strict();

export type GetContactInput = z.infer<typeof GetContactInputSchema>;
