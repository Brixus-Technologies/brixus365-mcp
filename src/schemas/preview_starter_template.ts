import { z } from "zod";

export const PreviewStarterTemplateInputSchema = z.object({
  slug: z
    .string()
    .min(1, "`slug` cannot be empty")
    .regex(/^[a-z0-9_-]+$/,
      "`slug` must be a slug (lowercase, digits, hyphens, underscores).")
    .describe("Starter-template slug to render."),
  variables: z
    .record(z.string(), z.unknown())
    .optional()
    .describe("Optional variable overrides for the preview render. " +
      "Omit to use the template's sample variables."),
}).strict();

export type PreviewStarterTemplateInput = z.infer<
  typeof PreviewStarterTemplateInputSchema
>;
