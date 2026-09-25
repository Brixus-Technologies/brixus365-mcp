import { z } from "zod";

export const GetFormInputSchema = z.object({
  form_id: z
    .string()
    .uuid()
    .describe(
      "UUID of the form to retrieve. Use `brixus_list_forms` to discover form IDs.",
    ),
}).strict();

export type GetFormInput = z.infer<typeof GetFormInputSchema>;
