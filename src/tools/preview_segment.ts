import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  PreviewSegmentInputSchema,
  type PreviewSegmentInput,
} from "../schemas/preview_segment.js";

export function registerPreviewSegmentTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_preview_segment",
    {
      title: "Preview a segment's matched audience",
      description: `Evaluate an unsaved segment rule tree and return the matched contact
count plus a small sample, without creating a segment.

Useful to sanity-check rules before calling the segment-create endpoint
from the Brixus dashboard, or to answer "how many contacts match X"
questions.

Args:
  - rules (object, required): a rule tree — { match: "all" | "any",
    conditions: [...] } where each condition is either
    { field, operator, value, fieldType } or another nested group.

Requires \`marketing:read\` API key scope (Pro/Enterprise tier only).`,
      inputSchema: PreviewSegmentInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: PreviewSegmentInput) => {
      try {
        const result = await client.previewSegment(params.rules);
        const text = JSON.stringify(result, null, 2);
        return {
          content: [{
            type: "text" as const,
            text: text.length > CHARACTER_LIMIT
              ? text.slice(0, CHARACTER_LIMIT) + "\n... (response truncated)"
              : text,
          }],
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
