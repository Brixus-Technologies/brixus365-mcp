import { z } from "zod";

export const GetSendingHealthInputSchema = z.object({}).strict();

export type GetSendingHealthInput = z.infer<typeof GetSendingHealthInputSchema>;
