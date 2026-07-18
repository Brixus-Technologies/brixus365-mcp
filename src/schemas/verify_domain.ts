import { z } from "zod";

export const VerifyDomainInputSchema = z.object({
  domain_id: z
    .string()
    .uuid()
    .describe("UUID of the email domain to verify."),
}).strict();

export type VerifyDomainInput = z.infer<typeof VerifyDomainInputSchema>;
