import { z } from "zod";

export const GetMarketingDashboardInputSchema = z.object({}).strict();

export type GetMarketingDashboardInput = z.infer<typeof GetMarketingDashboardInputSchema>;
