import { z } from "zod";

export const GetCommerceDashboardInputSchema = z.object({}).strict();

export type GetCommerceDashboardInput = z.infer<
  typeof GetCommerceDashboardInputSchema
>;
