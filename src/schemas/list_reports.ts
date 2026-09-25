import { z } from "zod";

export const ListReportsInputSchema = z.object({
  page: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("Page number (1-indexed). Default 1."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Results per page (1–100). Default 20."),
  source: z
    .enum(["marketing", "workflows", "connect"])
    .optional()
    .describe("Filter by the app that generated the report."),
  status: z
    .enum(["pending", "processing", "ready", "failed", "expired"])
    .optional()
    .describe("Filter by report status."),
}).strict();

export type ListReportsInput = z.infer<typeof ListReportsInputSchema>;
