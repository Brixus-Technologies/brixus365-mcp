import { z } from "zod";

export const GetRecipientGroupInputSchema = z.object({
  group_id: z
    .string()
    .uuid()
    .describe(
      "UUID of the recipient group to retrieve. Use `brixus_list_recipient_groups` " +
        "to discover group IDs.",
    ),
}).strict();

export type GetRecipientGroupInput = z.infer<typeof GetRecipientGroupInputSchema>;
