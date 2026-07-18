import { z } from "zod";

export const ListDomainsInputSchema = z.object({}).strict();

export type ListDomainsInput = z.infer<typeof ListDomainsInputSchema>;
