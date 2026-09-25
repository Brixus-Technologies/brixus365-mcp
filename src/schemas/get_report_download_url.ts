import { z } from "zod";

export const GetReportDownloadUrlInputSchema = z.object({
  report_id: z
    .string()
    .uuid()
    .describe(
      "UUID of the report to download. Use `brixus_list_reports` to discover report IDs.",
    ),
}).strict();

export type GetReportDownloadUrlInput = z.infer<typeof GetReportDownloadUrlInputSchema>;
