import { z } from "zod";

export const CreatePageInputSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(255)
    .describe("Page name (internal, not shown to visitors)."),
  template_id: z
    .string()
    .uuid()
    .describe(
      "UUID of the page template to clone. Use `brixus_list_page_templates` " +
        "to discover a valid template ID.",
    ),
}).strict();

export type CreatePageInput = z.infer<typeof CreatePageInputSchema>;
