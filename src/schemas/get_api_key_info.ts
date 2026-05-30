import { z } from "zod";

export const GetApiKeyInfoInputSchema = z.object({}).strict();

export type GetApiKeyInfoInput = z.infer<typeof GetApiKeyInfoInputSchema>;
