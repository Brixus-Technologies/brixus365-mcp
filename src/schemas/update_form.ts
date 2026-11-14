import { z } from "zod";
import { CreateFormInputSchema } from "./create_form.js";

// Reuse the create tool's field shapes so create and update cannot drift.
// Only the descriptions are restated: "omit to create an empty draft" is wrong here.
const { name, puck_data, settings } = CreateFormInputSchema.shape;

export const UpdateFormInputSchema = z.object({
  form_id: z
    .string()
    .uuid()
    .describe("UUID of the form to edit. Use `brixus_list_forms` or `brixus_create_form` to obtain a form ID."),
  name: name.optional().describe("New form name (internal, shown in the dashboard)."),
  puck_data: puck_data.describe(
    "New Puck editor JSON tree for the form's fields and layout. REPLACES the whole tree, so send the complete tree, not a fragment: fetch the current one with `brixus_get_form`, change it, and send it back. Capped at 2MB.",
  ),
  settings: settings.describe(
    "Form behavior settings to change: success behavior, target contact group/tags, double opt-in, consent, and bot protection. Merged into the existing settings, so any setting you omit keeps its current value.",
  ),
}).strict();

export type UpdateFormInput = z.infer<typeof UpdateFormInputSchema>;
