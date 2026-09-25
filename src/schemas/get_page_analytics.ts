import { z } from "zod";

export const GetPageAnalyticsInputSchema = z.object({
  page_id: z
    .string()
    .uuid()
    .describe(
      "UUID of the page to get analytics for. Use `brixus_list_pages` to discover page IDs.",
    ),
}).strict();

export type GetPageAnalyticsInput = z.infer<typeof GetPageAnalyticsInputSchema>;
