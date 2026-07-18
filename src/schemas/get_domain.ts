import { z } from "zod";

export const GetDomainInputSchema = z.object({
  domain_id: z
    .string()
    .uuid()
    .describe("UUID of the email domain to retrieve."),
}).strict();

export type GetDomainInput = z.infer<typeof GetDomainInputSchema>;
