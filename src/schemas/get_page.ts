import { z } from "zod";

export const GetPageInputSchema = z.object({
  page_id: z
    .string()
    .uuid()
    .describe(
      "UUID of the page to retrieve. Use `brixus_list_pages` to discover page IDs.",
    ),
}).strict();

export type GetPageInput = z.infer<typeof GetPageInputSchema>;
