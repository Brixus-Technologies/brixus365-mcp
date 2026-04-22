import { z } from "zod";

// Empty schema: the endpoint takes no arguments, but registerTool requires
// a schema shape. Using an empty strict object makes accidental extra
// arguments fail fast.
export const ListStarterTemplatesInputSchema = z.object({}).strict();

export type ListStarterTemplatesInput = z.infer<
  typeof ListStarterTemplatesInputSchema
>;
