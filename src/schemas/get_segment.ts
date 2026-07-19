import { z } from "zod";

export const GetSegmentInputSchema = z.object({
  segment_id: z
    .string()
    .uuid()
    .describe(
      "UUID of the segment to retrieve. Use `brixus_list_segments` to discover segment IDs.",
    ),
}).strict();

export type GetSegmentInput = z.infer<typeof GetSegmentInputSchema>;
