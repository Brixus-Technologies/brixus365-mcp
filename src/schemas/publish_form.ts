import { z } from "zod";

export const PublishFormInputSchema = z.object({
  form_id: z
    .string()
    .uuid()
    .describe(
      "UUID of the draft form to publish. Use `brixus_list_forms` or `brixus_create_form` to obtain a form ID.",
    ),
}).strict();

export type PublishFormInput = z.infer<typeof PublishFormInputSchema>;
