import { z } from "zod";

export const GetEmailComponentSchemaInputSchema = z.object({
  component_name: z
    .string()
    .optional()
    .describe(
      "Optional filter: return only the schema for this component (e.g. 'EmailButton'). " +
        "Omit to get all 16 components.",
    ),
}).strict();

export type GetEmailComponentSchemaInput = z.infer<typeof GetEmailComponentSchemaInputSchema>;
