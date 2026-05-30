import { z } from "zod";

export const ListEmailsInputSchema = z.object({
  from: z
    .string()
    .datetime({ offset: true })
    .optional()
    .describe("ISO 8601 start datetime. Only messages created at or after this time."),
  to: z
    .string()
    .datetime({ offset: true })
    .optional()
    .describe("ISO 8601 end datetime. Only messages created at or before this time."),
  status: z
    .enum(["queued", "scheduled", "sent", "delivered", "bounced", "failed", "cancelled"])
    .optional()
    .describe("Filter by delivery status."),
  skip: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Records to skip for pagination. Default 0."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Maximum records to return (1–100). Default 50."),
  sort_by: z
    .enum(["created_at", "sent_at", "status"])
    .optional()
    .describe("Sort field. Default 'created_at'."),
}).strict();

export type ListEmailsInput = z.infer<typeof ListEmailsInputSchema>;
