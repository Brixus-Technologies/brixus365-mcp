import { z } from "zod";

export const GetAudienceStatsInputSchema = z.object({}).strict();

export type GetAudienceStatsInput = z.infer<typeof GetAudienceStatsInputSchema>;
