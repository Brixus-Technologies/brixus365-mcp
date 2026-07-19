import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { GetSegmentInputSchema, type GetSegmentInput } from "../schemas/get_segment.js";

export function registerGetSegmentTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_segment",
    {
      title: "Get segment details",
      description: `Retrieve full details for a specific audience segment by ID.

Returns the segment's name, description, full rule tree, and cached
matched-contact count.

Requires \`marketing:read\` API key scope (Pro/Enterprise tier only).
Use \`brixus_list_segments\` to discover segment IDs.`,
      inputSchema: GetSegmentInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: GetSegmentInput) => {
      try {
        const result = await client.getSegment(params.segment_id);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: mapToolErrorMessage(error) }],
          isError: true,
        };
      }
    },
  );
}
