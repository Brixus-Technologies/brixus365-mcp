import { z } from "zod";

export const EmailAnalyticsInputSchema = z.object({
  from: z
    .string()
    .datetime({ offset: true })
    .describe("ISO 8601 start of the analytics window (required)."),
  to: z
    .string()
    .datetime({ offset: true })
    .describe("ISO 8601 end of the analytics window (required)."),
  bucket: z
    .enum(["hour", "day"])
    .optional()
    .describe(
      "Aggregation granularity. 'hour' for intraday breakdown, 'day' for daily rollups. Default 'day'.",
    ),
}).strict();

export type EmailAnalyticsInput = z.infer<typeof EmailAnalyticsInputSchema>;
